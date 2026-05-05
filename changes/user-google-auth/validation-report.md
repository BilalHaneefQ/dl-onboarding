# Validation Report — user-google-auth

**Date:** 2026-05-05
**Method:** Unit tests on accounts.js + server route tests + static spec review

---

## Unit Tests — accounts.js (6/6 passed)

```
PASS  new user: getGoogleEmail returns null
PASS  new user: isLinked returns false
PASS  linkAccount + getGoogleEmail roundtrip
PASS  isLinked returns true after linkAccount
PASS  per-user isolation: two IDs return different emails
PASS  linkAccount updates existing entry (no duplicate rows)
```

All 6 pass. Per-user isolation confirmed: two different Discord IDs map to different Google emails with zero cross-contamination.

---

## Server Route Tests (3/3 passed)

```
PASS  /oauth/start missing params → 400 { error: "discord_id and email are required" }
PASS  /oauth2/callback invalid state → 400 HTML "Invalid or expired OAuth state"
PASS  /oauth/start without gog credentials → 500 { error: "OAuth client credentials missing..." }
       (correct — expected behavior in dev env without Google Cloud credentials)
```

Error messages are user-appropriate and actionable.

---

## Spec-Delta Coverage

| Scenario | Spec Requirement | Implementation | Status |
|----------|-----------------|----------------|--------|
| Unlinked user → onboarding | Check user-accounts.json, trigger OAuth if not found | omnio SKILL.md Step 1 + Onboarding section | ✓ PASS |
| OAuth URL generation | `/oauth/start` returns URL with state=discord_id | gogAuthStep1 + state token encoding | ✓ PASS |
| OAuth callback exchange | `/oauth2/callback` → gog auth step 2 → linkAccount | handleCallback in server.js | ✓ PASS |
| Discord DM on success | "✓ Google account connected (email). Try 'check my emails'." | sendDiscordDm in server.js | ✓ PASS |
| OAuth failure path | Error → DM with retry link | handleCallback error branch | ✓ PASS |
| Per-user gog scoping | `-a {user_email}` on all gog commands | Both agent skills updated | ✓ PASS |
| Token expiry re-auth | `invalid_grant` → re-auth link | Error handling in both skills | ✓ PASS |
| GOG_ACCOUNT removed | No global account dependency | OpenClaw env config updated | ✓ PASS |
| /connect command | Re-triggers onboarding regardless of link status | omnio SKILL.md /connect section | ✓ PASS |

---

## Deviations

### DEV-001 — OAuth State Handling (Minor, Acceptable)
- **Spec says:** "State parameter: base64-encoded Discord user ID"
- **Implementation:** State is `base64url(discord_id:email:timestamp)` — richer encoding for the pending map
- **Reason:** Need to associate Discord ID and email at callback time without a database lookup
- **Resolution:** Acceptable deviation — encodes a superset of the spec's requirement

---

## Constitutional Check — "Keep Data on the User's Side"

| Data | Stored where | Routes through third party? |
|------|-------------|---------------------------|
| Google OAuth refresh tokens | gog keyring on VPS (`/home/bilal/.config/gogcli/`) | No |
| Account map (discord → email) | `state/user-accounts.json` on VPS | No |
| OAuth callback | Self-hosted server on VPS (port 8080) | No |
| Discord DM notifications | Via Discord Bot API (the channel itself, not auth data) | Discord only (acceptable — this is the messaging surface) |

**Verdict:** ✓ Tokens stay on VPS. No Google credentials route through third-party services.

---

## Live Tests Required (When Gateway + Google OAuth Set Up)

Prereqs:
1. Google Cloud Console: create OAuth Desktop app client → download JSON
2. `gog auth credentials set --name omnio /path/to/client_secret.json`
3. Add `https://{VPS_HOST}/oauth2/callback` to Authorized redirect URIs
4. Start auth server: `OAUTH_HOST=vps.example.com DISCORD_BOT_TOKEN=... node auth-server/server.js`
5. Start OpenClaw gateway: `openclaw-start`

- [ ] New user DMs bot → "Welcome to Omnio! Connect your Google account: [URL]"
- [ ] User clicks OAuth URL → Google consent → redirected to callback → "✓ Google account connected"
- [ ] Linked user DMs "check my emails" → email-agent runs `gog mail search -a user@email.com`
- [ ] Two different users DM bot → each gets scoped to their own gog account
- [ ] Token expiry: manually expire token → `invalid_grant` → re-auth link appears in Discord
- [ ] `/connect` command → re-triggers onboarding flow even for linked user
