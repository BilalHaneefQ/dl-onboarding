# Spec Delta: user-google-auth

> This delta merges into `specs/features/user-google-auth/spec.md` on `/sdd:complete`.

## ADDED

### User Onboarding — Detect Unlinked User

**Given** a user DMs the Omnio bot for the first time (no existing account map entry for their Discord user ID)
**When** the Orchestrator handles any message from that user
**Then** the Orchestrator checks `state/user-accounts.json` for the Discord user ID
**And** if not found, replies: "Welcome to Omnio! To get started, connect your Google account: [OAuth link]. This takes about 30 seconds."
**And** the OAuth link is unique to their Discord user ID (encoded as a state parameter)
**And** no specialist agent delegation occurs until the account is linked

---

### User Onboarding — OAuth Callback Server

**Given** a user clicks the OAuth link and completes the Google consent screen
**When** Google redirects to `http://localhost:8080/oauth2/callback?code={auth_code}&state={gog_state}`
**Then** the callback server pipes the full callback URL to the waiting gog process stdin
**And** gog completes the token exchange and stores the refresh token in its keyring
**And** the server writes `{ discord_id: "...", google_email: "..." }` to `state/user-accounts.json`
**And** sends a Discord DM: "✓ Google account connected ({email}). You're all set — try 'check my emails' or 'check my calendar'."

**Given** the OAuth flow fails (user denies access, network error, invalid code)
**When** the callback server receives an error response
**Then** the server kills the waiting gog process
**And** sends a Discord DM: "Couldn't connect your Google account — [reason]. Try the link again or contact the Omnio team."
**And** no token is stored

---

### User Onboarding — Per-User gog Command Routing

**Given** a linked user sends a message that is delegated to a specialist agent
**When** the specialist agent runs any `gog` command
**Then** the command includes `-a {user_google_email}` to scope to that user's token
**And** the user's email is passed from the Orchestrator to the specialist agent via the `--message` context or OpenClaw agent env

**Given** a linked user's Google token has expired
**When** a `gog` command returns `invalid_grant` or `token expired`
**Then** the specialist agent replies: "Your Google session expired. Re-authenticate: [fresh OAuth link]"
**And** the fresh OAuth link encodes their Discord user ID as the state parameter

---

### OAuth Callback Server — Technical Spec

The callback server is a Node.js HTTP server (`auth-server/server.js`):
- Listens on port `8080` (configurable via `OAUTH_PORT` env var)
- Route `GET /oauth/start?discord_id={id}&email={email}` — spawns a persistent `gog auth add --manual` process, extracts the OAuth URL from gog's **stderr** output, stores the live process in a pending map keyed by gog's state token, returns the OAuth URL to the caller
- Route `GET /oauth2/callback` — receives Google's redirect, looks up the pending gog process by state token, pipes the full callback URL to gog's **stdin**, waits for gog to complete token exchange
- Route `GET /health` — returns server status and config

**Key implementation detail — persistent gog process:**
The `gog --manual` flow prints the OAuth URL to stderr then waits on stdin for the callback URL. The server keeps this process alive between `/oauth/start` and `/oauth2/callback`. When the callback fires, it writes the full callback URL to the waiting process's stdin. This avoids gog's in-memory state being lost between separate process invocations.

**Deviation from original spec — `--remote --step 1/2` does not work across processes:**
The original spec assumed `gog --remote --step 1` would persist state in the keyring between two separate execFile calls. In practice, gog stores pending OAuth state in-memory only — it is lost when the step 1 process exits. Switched to `--manual` with a persistent spawned process instead.

**Deviation from original spec — gog URL output is on stderr, tab-separated:**
`gog --manual` prints `Visit this URL: https://...` to stderr (not stdout). URL extraction reads from both stdout and stderr and uses a regex to find the Google OAuth URL.

**Credentials setup required (one-time):**
```bash
# Flatten the Desktop app client_secret JSON (gog expects flat format, not nested under "installed")
python3 -c "
import json
with open('client_secret_xxx.json') as f: d=json.load(f)
with open('/home/user/.config/gogcli/credentials-omnio.json','w') as f: json.dump(d['installed'],f)
"
```

**Required env vars:**
- `DISCORD_BOT_TOKEN` — bot token for sending DMs
- `GOG_KEYRING_BACKEND=file` — required on headless Linux
- `GOG_KEYRING_PASSWORD` — keyring encryption password
- `GOG_CLIENT=omnio` — gog credential name (default)

---

## MODIFIED

### Email Agent — Account Scoping

**Before:** `gog mail search "is:unread" -j --results-only` (uses `GOG_ACCOUNT` env)
**After:** `gog mail search "is:unread" -a {user_email} -j --results-only` (explicit per-user account)

Apply same `-a {user_email}` change to all `gog mail` commands in the email-agent skill.

### Calendar Agent — Account Scoping

**Before:** `gog calendar events primary ...` (uses `GOG_ACCOUNT` env)
**After:** `gog calendar events primary -a {user_email} ...` (explicit per-user account)

Apply same `-a {user_email}` change to all `gog calendar` commands in the calendar-agent skill.

## REMOVED

(None)
