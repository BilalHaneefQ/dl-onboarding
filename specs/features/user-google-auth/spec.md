# Feature Spec: User Google Auth

**Status:** Active
**Last reviewed:** 2026-05-06
**Cycle landed:** user-google-auth (archive: `archive/user-google-auth/`)

---

## User Onboarding — Detect Unlinked User

**Given** a user DMs the Omnio bot for the first time (no existing entry for their Discord user ID in `state/user-accounts.json`)
**When** the Orchestrator handles any message from that user
**Then** the Orchestrator checks `state/user-accounts.json` for the Discord user ID
**And** if not found, asks: "What's your Google Workspace email address?" then replies: "Welcome to Omnio! To get started, connect your Google account: [OAuth link]. This takes about 30 seconds."
**And** the OAuth link is unique to their Discord user ID (encoded as a state parameter)
**And** no specialist agent delegation occurs until the account is linked

---

## User Onboarding — OAuth Callback Server

**Given** a user clicks the OAuth link and completes the Google consent screen
**When** Google redirects to `http://localhost:8080/oauth2/callback?code={auth_code}&state={gog_state}`
**Then** the callback server pipes the full callback URL to the waiting `gog --manual` process stdin
**And** gog completes the token exchange and stores the refresh token in its keyring
**And** the server writes `{ discord_id: "...", google_email: "..." }` to `state/user-accounts.json`
**And** sends a Discord DM: "✓ Google account connected ({email}). You're all set — try 'check my emails' or 'check my calendar'."

**Given** the OAuth flow fails (user denies access, network error, invalid code)
**When** the callback server receives an error response
**Then** the server kills the waiting gog process
**And** sends a Discord DM: "Couldn't connect your Google account — [reason]. Try the link again or contact the Omnio team."
**And** no token is stored

---

## User Onboarding — Per-User gog Command Routing

**Given** a linked user sends a message that is delegated to a specialist agent
**When** the specialist agent runs any `gog` command
**Then** the command includes `-a {user_google_email}` to scope to that user's token
**And** the user's email is passed from the Orchestrator via the `[user_email:x@y.com]` prefix in the delegated message

**Given** a linked user's Google token has expired
**When** a `gog` command returns `invalid_grant` or `token expired`
**Then** the specialist agent replies: "Your Google session expired. Re-authenticate: [fresh OAuth link]"

---

## OAuth Callback Server — Technical Spec

Implementation: `auth-server/server.js` (Node.js, no npm dependencies)

- **Port:** `8080` (configurable via `OAUTH_PORT`)
- **`GET /oauth/start?discord_id={id}&email={email}`** — spawns a persistent `gog auth add {email} --manual --redirect-uri {CALLBACK_URI} --client omnio --services gmail,calendar` process; extracts the OAuth URL from gog's stderr output; stores the live process in a pending map keyed by gog's state token; returns `{ oauth_url, state }` to caller
- **`GET /oauth2/callback`** — receives Google's redirect; looks up the pending gog process by state token; pipes the full callback URL to gog's stdin; waits for gog to complete token exchange; calls `linkAccount(discordId, email)`; sends Discord DM
- **`GET /health`** — returns server status and config

**Key design:** gog `--manual` prints the OAuth URL then waits on stdin for the callback URL. The server keeps this process alive in memory between the two HTTP requests. This is required because gog stores OAuth PKCE state in-memory only — it cannot be reconstituted across separate process invocations.

**Account map:** `state/user-accounts.json` — managed by `auth-server/accounts.js` (`getGoogleEmail`, `linkAccount`, `isLinked`)

---

## MODIFIED — Email Agent and Calendar Agent Account Scoping

All `gog mail` commands use `-a {user_email}` (not `GOG_ACCOUNT` env). All `gog calendar` commands use `-a {user_email}`. The user's email is extracted from the `[user_email:x@y.com]` prefix injected by the Orchestrator.
