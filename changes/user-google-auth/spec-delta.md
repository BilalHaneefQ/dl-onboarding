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
**When** Google redirects to `https://{vps-domain}/oauth2/callback?code={auth_code}&state={discord_user_id}`
**Then** the callback server exchanges the auth code for a refresh token
**And** runs `gog auth add {user_email} --client omnio` to store the token
**And** writes `{ discord_user_id: "...", google_email: "..." }` to `state/user-accounts.json`
**And** sends a Discord DM to the user: "✓ Google account connected ({email}). You're all set — try 'check my emails'."

**Given** the OAuth flow fails (user denies access, network error, invalid code)
**When** the callback server receives an error response
**Then** the server sends a Discord DM: "Couldn't connect your Google account — [reason]. Try the link again: [link]"
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

The callback server is a Node.js HTTP server:
- Listens on port `8080` (configurable via `OAUTH_PORT` env var)
- Route `GET /oauth2/callback` — handles Google redirect
- Route `GET /oauth/start?discord_id={id}` — generates and returns OAuth authorization URL
- Uses gog's `--client omnio` credential (the OAuth client JSON from Google Cloud Console)
- HTTPS required in production (Let's Encrypt or reverse proxy)
- State parameter: base64-encoded Discord user ID

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
