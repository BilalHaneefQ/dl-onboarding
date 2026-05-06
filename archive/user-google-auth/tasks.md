# Tasks: user-google-auth

## Implementation Checklist

### Account Map
- [x] Create `state/user-accounts.json` with empty structure `{ "accounts": [] }`
- [x] Write account lookup helper: Discord ID → Google email (used by Orchestrator + agents)

### OAuth Callback Server
- [x] Scaffold `auth-server/server.js` — Node.js HTTP server (port 8080)
- [x] Implement `GET /oauth/start?discord_id={id}` — generate Google OAuth URL with state param
- [x] Implement `GET /oauth2/callback` — exchange code, run `gog auth add`, write account map
- [x] Implement Discord DM notification on success/failure (via Discord bot API)
- [x] Add `OAUTH_PORT`, `DISCORD_BOT_TOKEN`, `GOG_CLIENT` to env config documentation
- [x] Test callback server with `--dry-run` (validate routes without real OAuth)

### Orchestrator — Onboarding Detection
- [x] Update omnio skill: check `state/user-accounts.json` before delegating
- [x] Add unlinked user response: "Welcome to Omnio! Connect Google: [link]"
- [x] Add `/connect` command shortcut to re-trigger OAuth link
- [x] Deploy updated omnio skill to main workspace

### Agent Account Scoping
- [x] Update email-agent gmail skill: add `-a {user_email}` to all gog mail commands
- [x] Update calendar-agent gcal skill: add `-a {user_email}` to all gog calendar commands
- [x] Update agent prompts: receive user_email from Orchestrator context, pass to gog commands
- [x] Remove `GOG_ACCOUNT` global env dependency (replaced by per-command `-a` flag)

### Validation
- [x] Test account map: new Discord ID has no entry → triggers onboarding message
- [x] Test account map: known Discord ID → agent delegates normally
- [x] Test OAuth URL generation: valid URL with state=discord_id
- [x] Test callback (dry-run): valid code → writes to account map, sends DM
- [x] Test token expiry path: `invalid_grant` → re-auth link sent
- [x] Test per-user isolation: two different Discord IDs use different gog accounts

## Validation

- [x] All tasks above complete
- [x] All 6 validation scenarios pass (6/6 unit tests, 3/3 server tests — live tests in validation-report.md)
- [x] spec-delta reviewed — 1 acceptable deviation (state encoding richer than spec, see DEV-001)
- [x] No gog command runs without explicit `-a {user_email}` — GOG_ACCOUNT removed from OpenClaw env
- [x] Constitutional check: tokens on VPS only — audit table in validation-report.md
