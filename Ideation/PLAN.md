# Omnio — Coding Plan

## Context

The Omnio Discord agent is live and already handles email reading/replying and calendar creation out of the box via the `gog` skill. Live testing confirmed 3 remaining gaps before the POC is complete:

1. **Meet links not auto-attached** — meetings with attendees are created without a Google Meet link
2. **Contact lookup by name fails** — agent falls back to email search instead of using Google Directory
3. **Per-user Google auth missing** — only one hardcoded Google account; scaling requires each Discord user to connect their own Gmail

Everything else (email confirmation flow, calendar create/reschedule, adding attendees) already works without custom code.

---

## What We're Building

### Gap 1 — Contact/Directory Lookup (Prompt Engineering)

**Problem:** When user says "schedule with Nameer", agent searches email history instead of Google Directory.

**Fix:** Add a custom instruction to the agent's SOUL.md / system prompt that tells it:
> "When a person's name is mentioned without an email, always run `gog people search <name>` first before asking for the email."

**Files to modify:**
- `/home/bilal/.openclaw/workspace/SOUL.md` — add contact lookup instruction
- OR create `skills/contact-lookup/SKILL.md` — dedicated skill for name→email resolution

**How to test:** Say "add Haseeb to my meeting" → agent should find haseeb@disrupt.com without asking

---

### Gap 2 — Auto Meet Link (OpenClaw Skill)

**Problem:** When creating a calendar event with attendees, the agent doesn't add a Google Meet link unless explicitly asked.

**Fix:** Create a custom OpenClaw skill `meet-link` that:
- Watches for calendar event creation with 1+ attendees
- Calls Google Meet REST API to generate a Meet space
- Patches the Calendar event with the conferenceData

**Files to create:**
- `skills/meet-link/SKILL.md` — tells the agent when to use this skill
- `skills/meet-link/index.js` — calls Meet API via gog auth token

**How to test:** Ask "create a meeting with Nameer tomorrow 3pm" → reply should include a meet.google.com link

---

### Gap 3 — Per-User Google OAuth (Node.js Web Server)

**Problem:** Only `bilal.haneef@disrupt.com` is connected. New Discord users get errors when they try Gmail/Calendar features.

**Fix:** Build a small Node.js OAuth server:
1. When new user DMs bot → bot sends: "Connect your Google account → [link]"
2. Link opens `/auth/google?discord_id=<id>` on a local/VPS server
3. Server runs OAuth flow → saves token to `~/.openclaw/credentials/users/<discord_id>.json`
4. gog picks up the right token per request

**Files to create:**
- `src/auth-server.js` — Express server handling OAuth callback
- `src/token-store.js` — reads/writes per-user tokens
- `skills/user-onboarding/SKILL.md` — tells agent to trigger auth flow for new users

**How to test:** New Discord user DMs bot → gets auth link → clicks → token saved → can check their own Gmail

---

## Build Order (SDD Cycles)

| # | Cycle | Feature | Effort | Value |
|---|---|---|---|---|
| 1 | `contact-lookup` | Contact/Directory Lookup | Small (prompt only) | High — fixes immediate pain |
| 2 | `meet-link` | Auto Meet Link | Medium (1 skill file) | High — completes POC scenario 3 |
| 3 | `user-google-auth` | Per-User Google OAuth | Large (Node.js server) | Critical for scaling |

---

## SDD Workflow

Each gap gets its own SDD cycle:
```
/sdd:start contact-lookup
/sdd:start meet-link
/sdd:start user-google-auth
```

Spec first → implement → `/sdd:complete`

---

## Critical Files

| File | Purpose |
|---|---|
| `/home/bilal/.openclaw/workspace/SOUL.md` | Agent identity/instructions |
| `/home/bilal/sites/dl-onboarding/skills/gog/SKILL.md` | Existing Google skill to reference |
| `/home/bilal/.openclaw/openclaw.json` | OpenClaw config (env vars, channels) |
| `/home/bilal/.openclaw/workspace/skills/` | Where new skills get installed |

---

## Verification (End-to-End)

After all 3 cycles are complete:
1. "check my emails" → reads real inbox ✓
2. "reply to [email] saying yes" → drafts → confirm → sends ✓
3. "schedule meeting with Nameer tomorrow 3pm" → finds email from directory, creates event, attaches Meet link ✓
4. New Discord user DMs bot → gets auth link → connects Gmail → can check their own inbox ✓
