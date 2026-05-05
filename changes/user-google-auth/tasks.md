# Tasks: user-google-auth

## Implementation Checklist

### Account Map
- [x] Create `state/user-accounts.json` with empty structure `{ "accounts": [] }`
- [x] Write account lookup helper: Discord ID → Google email (used by Orchestrator + agents)

### OAuth Callback Server
- [ ] Scaffold `auth-server/server.js` — Node.js HTTP server (port 8080)
- [ ] Implement `GET /oauth/start?discord_id={id}` — generate Google OAuth URL with state param
- [ ] Implement `GET /oauth2/callback` — exchange code, run `gog auth add`, write account map
- [ ] Implement Discord DM notification on success/failure (via Discord bot API)
- [ ] Add `OAUTH_PORT`, `DISCORD_BOT_TOKEN`, `GOG_CLIENT` to env config documentation
- [ ] Test callback server with `--dry-run` (validate routes without real OAuth)

### Orchestrator — Onboarding Detection
- [ ] Update omnio skill: check `state/user-accounts.json` before delegating
- [ ] Add unlinked user response: "Welcome to Omnio! Connect Google: [link]"
- [ ] Add `/connect` command shortcut to re-trigger OAuth link
- [ ] Deploy updated omnio skill to main workspace

### Agent Account Scoping
- [ ] Update email-agent gmail skill: add `-a {user_email}` to all gog mail commands
- [ ] Update calendar-agent gcal skill: add `-a {user_email}` to all gog calendar commands
- [ ] Update agent prompts: receive user_email from Orchestrator context, pass to gog commands
- [ ] Remove `GOG_ACCOUNT` global env dependency (replaced by per-command `-a` flag)

### Validation
- [ ] Test account map: new Discord ID has no entry → triggers onboarding message
- [ ] Test account map: known Discord ID → agent delegates normally
- [ ] Test OAuth URL generation: valid URL with state=discord_id
- [ ] Test callback (dry-run): valid code → writes to account map, sends DM
- [ ] Test token expiry path: `invalid_grant` → re-auth link sent
- [ ] Test per-user isolation: two different Discord IDs use different gog accounts

## Validation

- [ ] All tasks above complete
- [ ] All 6 validation scenarios pass
- [ ] spec-delta reviewed — no deviations from implemented behavior
- [ ] No gog command runs without explicit `-a {user_email}` (no global GOG_ACCOUNT dependency)
- [ ] Constitutional check: user tokens stored on VPS only, not routed through third-party services
