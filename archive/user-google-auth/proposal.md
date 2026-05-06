# Proposal: user-google-auth

## Problem

The POC currently runs with a single hardcoded Google account (`GOG_ACCOUNT=bilal.haneef@disrupt.com`). Adding a second DL tester requires manual `gog auth add` on the VPS, which is brittle and doesn't scale. The post-POC DL expansion ICP requires a self-serve flow: a new user DMs the Omnio bot, clicks a Google OAuth link, and their agent is live — without any manual setup by the Omnio team.

## Solution

Build a self-serve Google OAuth onboarding flow using gog's native multi-account support:

1. **OAuth callback server** — a small Node.js HTTP server running on the VPS that:
   - Generates a Google OAuth authorization URL for a new user
   - Handles the `/oauth2/callback` redirect from Google
   - Runs `gog auth add <email>` to store the user's refresh token

2. **Omnio onboarding bot response** — when a user DMs the bot for the first time (or runs `/connect`), the Orchestrator:
   - Checks if their Discord user ID has a linked Google account
   - If not: sends them a personalized OAuth link pointing to the callback server
   - If yes: confirms their account is connected

3. **Per-user agent routing** — after OAuth completes:
   - The user's email is stored in an account map (`discord_id → google_email`)
   - All subsequent gog commands for that user use `-a <user_email>` to scope to their account

**Constitutional note:** "Keep data on the user's side" is interpreted as "on the VPS that hosts the Omnio bot" — the token stays on our infrastructure (not a third-party service). Per-user gog keyring entries ensure no data crosses between users.

**Note on openclaw-multitenant:** `Ideation/08-scaling-plan.md` references `openclaw-multitenant` but this package is not available on npm. Scope is limited to gog's native multi-account support + manual agent container routing via `openclaw agents add`. Per-user container automation is out of scope until `openclaw-multitenant` is available.

## Scope

**In scope:**
- OAuth callback HTTP server (Node.js, runs on the same VPS as the bot)
- Onboarding command in Orchestrator: detect unlinked user → send OAuth link
- Account map: Discord user ID → Google email (stored in `state/user-accounts.json`)
- Per-user gog command routing: all gog calls include `-a <user_email>`
- Update email-agent and calendar-agent skills to use per-user account routing
- Manual `openclaw agents add` for each new user (automated provisioning deferred)

**Out of scope:**
- Automated container provisioning via openclaw-multitenant (not available)
- Re-auth flow for expired tokens (post-POC)
- Revoking access / removing users (post-POC)
- Multi-Google-account support per user (one account per Discord ID)

## Risks

1. **openclaw-multitenant unavailability** — per-user agent container isolation requires manual `openclaw agents add` for each user. This limits initial scale to ~10 users before automation is needed.
2. **OAuth callback server exposure** — the server must be publicly reachable for Google's redirect. Needs HTTPS (Let's Encrypt) or a tunnel (ngrok for development).
3. **gog keyring backend** — each user's token must use `GOG_KEYRING_BACKEND=file` and a per-user keyring file to avoid cross-contamination. Default shared keyring would mix tokens.
4. **GOG_ACCOUNT global env** — the current `GOG_ACCOUNT` is set globally in OpenClaw config. Per-user routing requires this to be passed per-command (`-a <email>`) rather than via env, or set per-agent-workspace.
5. **Callback server port** — must not conflict with OpenClaw gateway port (18789). Use 8080 or configurable.
