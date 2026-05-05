/**
 * Omnio OAuth Callback Server
 *
 * Handles Google OAuth for new users connecting to Omnio.
 * Flow:
 *   1. Orchestrator calls /oauth/start?discord_id=X&email=Y
 *   2. Server runs: gog auth add Y --remote --step 1 --redirect-uri CALLBACK_URI --client omnio
 *   3. Server returns the OAuth URL → Orchestrator DMs it to the user
 *   4. User clicks link, Google redirects to /oauth2/callback?code=Z&state=S
 *   5. Server runs: gog auth add Y --remote --step 2 --auth-url FULL_CALLBACK_URL --client omnio
 *   6. Token stored in gog keyring → account linked → success DM sent
 *
 * Env vars (required):
 *   OAUTH_HOST         — public hostname for OAuth redirect (e.g. vps.example.com or localhost:8080)
 *   OAUTH_PORT         — port to listen on (default: 8080)
 *   DISCORD_BOT_TOKEN  — bot token for sending DMs
 *   GOG_KEYRING_BACKEND — file (required on headless Linux, see LEARNINGS.md §12)
 *   GOG_KEYRING_PASSWORD — keyring password for file backend
 *   GOG_CLIENT         — gog OAuth client name (default: omnio)
 */

'use strict';

const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const { linkAccount } = require('./accounts');

const PORT = parseInt(process.env.OAUTH_PORT || '8080', 10);
const HOST = process.env.OAUTH_HOST || `localhost:${PORT}`;
const PROTOCOL = HOST.startsWith('localhost') ? 'http' : 'https';
const CALLBACK_URI = `${PROTOCOL}://${HOST}/oauth2/callback`;
const GOG_CLIENT = process.env.GOG_CLIENT || 'omnio';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// In-memory pending map: state token → { discord_id, email, gogProcess }
// The gog process is kept alive between step 1 and step 2.
const pending = new Map();

// ─── gog helpers ────────────────────────────────────────────────────────────

/**
 * Spawns a persistent gog --manual process.
 * gog prints the OAuth URL to stdout, then waits for the callback URL on stdin.
 * We keep the process alive and pipe the callback URL to it when it arrives.
 */
function startGogAuthFlow(email) {
  return new Promise((resolve, reject) => {
    const args = [
      'auth', 'add', email,
      '--manual',
      '--redirect-uri', CALLBACK_URI,
      '--client', GOG_CLIENT,
      '--services', 'gmail,calendar',
      '--timeout', '10m',
    ];
    const gog = spawn('gog', args, { env: process.env });
    let output = '';
    let resolved = false;

    function checkForUrl(data) {
      output += data.toString();
      const urlMatch = output.match(/https:\/\/accounts\.google\.com\/o\/oauth2\/auth\S+/);
      if (urlMatch && !resolved) {
        resolved = true;
        resolve({ url: urlMatch[0], process: gog });
      }
    }

    // gog --manual prints the URL to stderr in interactive mode
    gog.stdout.on('data', checkForUrl);
    gog.stderr.on('data', checkForUrl);

    gog.on('error', (err) => {
      if (!resolved) reject(err);
    });

    // Timeout if no URL after 15s
    setTimeout(() => {
      if (!resolved) {
        gog.kill();
        reject(new Error('gog auth timed out waiting for OAuth URL'));
      }
    }, 15000);
  });
}

/**
 * Sends the callback URL to the waiting gog process to complete the auth.
 */
function completeGogAuthFlow(gogProcess, callbackUrl) {
  return new Promise((resolve, reject) => {
    let output = '';
    gogProcess.stdout.on('data', (data) => { output += data.toString(); });
    gogProcess.on('close', (code) => {
      if (code === 0) resolve(output.trim());
      else reject(new Error(`gog exited with code ${code}: ${output.trim()}`));
    });
    // Write the callback URL to gog's stdin — this is what --manual waits for
    gogProcess.stdin.write(callbackUrl + '\n');
    gogProcess.stdin.end();
  });
}

// ─── Discord DM helper ──────────────────────────────────────────────────────

function sendDiscordDm(userId, content) {
  if (!DISCORD_BOT_TOKEN) {
    console.error('[discord] DISCORD_BOT_TOKEN not set — cannot send DM');
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    // Step 1: create DM channel
    const createChannelBody = JSON.stringify({ recipient_id: userId });
    const createReq = https.request({
      hostname: 'discord.com',
      path: '/api/v10/users/@me/channels',
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(createChannelBody),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const channel = JSON.parse(data);
        if (!channel.id) {
          console.error('[discord] Failed to create DM channel:', data);
          return resolve();
        }
        // Step 2: send message to channel
        const msgBody = JSON.stringify({ content });
        const msgReq = https.request({
          hostname: 'discord.com',
          path: `/api/v10/channels/${channel.id}/messages`,
          method: 'POST',
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(msgBody),
          },
        }, (msgRes) => {
          msgRes.resume();
          resolve();
        });
        msgReq.on('error', (e) => { console.error('[discord] send error:', e); resolve(); });
        msgReq.write(msgBody);
        msgReq.end();
      });
    });
    createReq.on('error', (e) => { console.error('[discord] channel error:', e); resolve(); });
    createReq.write(createChannelBody);
    createReq.end();
  });
}

// ─── Route handlers ─────────────────────────────────────────────────────────

async function handleStart(query, res) {
  const params = new URLSearchParams(query);
  const discordId = params.get('discord_id');
  const email = params.get('email');

  if (!discordId || !email) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'discord_id and email are required' }));
  }

  try {
    const { url: oauthUrl, process: gogProcess } = await startGogAuthFlow(email);

    // Extract gog's state from the OAuth URL to use as our pending map key
    const urlObj = new URL(oauthUrl);
    const gogState = urlObj.searchParams.get('state');

    // Store discord_id, email, and the live gog process keyed by state
    pending.set(gogState, { discord_id: discordId, email, gogProcess });

    // Auto-expire: kill the gog process and remove pending entry after 10 minutes
    setTimeout(() => {
      if (pending.has(gogState)) {
        const entry = pending.get(gogState);
        entry.gogProcess.kill();
        pending.delete(gogState);
      }
    }, 10 * 60 * 1000);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ oauth_url: oauthUrl, state: gogState }));
  } catch (err) {
    console.error('[oauth/start]', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function handleCallback(query, res) {
  const params = new URLSearchParams(query);
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    // User denied access or error occurred
    const entry = state ? pending.get(state) : null;
    if (entry) {
      pending.delete(state);
      await sendDiscordDm(entry.discord_id,
        `Couldn't connect your Google account — ${error}. Try the link again or contact the Omnio team.`
      );
    }
    res.writeHead(400, { 'Content-Type': 'text/html' });
    return res.end('<h2>❌ Google sign-in failed. You can close this window.</h2>');
  }

  if (!state || !pending.has(state)) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    return res.end('<h2>❌ Invalid or expired OAuth state. Please try again.</h2>');
  }

  const { discord_id, email, gogProcess } = pending.get(state);
  pending.delete(state);

  const fullCallbackUrl = `${CALLBACK_URI}?${query}`;

  try {
    await completeGogAuthFlow(gogProcess, fullCallbackUrl);
    linkAccount(discord_id, email);

    await sendDiscordDm(discord_id,
      `✓ Google account connected (${email}). You're all set — try "check my emails" or "check my calendar".`
    );

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2>✓ Google account connected! You can close this window and return to Discord.</h2>');
    console.log(`[oauth] Linked Discord ${discord_id} → ${email}`);
  } catch (err) {
    console.error('[oauth/callback]', err.message);
    await sendDiscordDm(discord_id,
      `Couldn't connect your Google account — ${err.message}. Try the link again or contact the Omnio team.`
    );
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h2>❌ Failed to store Google credentials. Please try again.</h2>');
  }
}

function handleDryRun(res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    routes: [
      'GET /oauth/start?discord_id=X&email=Y  — generate OAuth URL',
      'GET /oauth2/callback?code=Z&state=S    — complete OAuth flow',
      'GET /health                             — server status',
    ],
    config: {
      port: PORT,
      host: HOST,
      callback_uri: CALLBACK_URI,
      gog_client: GOG_CLIENT,
      discord_token_set: !!DISCORD_BOT_TOKEN,
    },
  }));
}

// ─── Server ──────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const [pathname, query = ''] = (req.url || '/').split('?');

  if (req.method === 'GET' && pathname === '/oauth/start') {
    return handleStart(query, res);
  }
  if (req.method === 'GET' && pathname === '/oauth2/callback') {
    return handleCallback(query, res);
  }
  if (req.method === 'GET' && pathname === '/health') {
    return handleDryRun(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[omnio-auth] Listening on 0.0.0.0:${PORT}`);
    console.log(`[omnio-auth] Callback URI: ${CALLBACK_URI}`);
    console.log(`[omnio-auth] gog client: ${GOG_CLIENT}`);
    if (!DISCORD_BOT_TOKEN) console.warn('[omnio-auth] WARNING: DISCORD_BOT_TOKEN not set');
  });
}

module.exports = { server, handleStart, handleCallback };
