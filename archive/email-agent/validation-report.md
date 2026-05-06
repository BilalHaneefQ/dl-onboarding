# Validation Report — email-agent

**Date:** 2026-05-04
**Validated by:** Static spec review + gog CLI testing (no live gateway)

---

## Spec-Delta Coverage

| Scenario | Spec Requirement | Implementation | Status |
|----------|-----------------|----------------|--------|
| Check emails — happy path | gog list → numbered summary → "Which one?" | gmail SKILL.md: `gog mail search "is:unread"` + parse rules + format | ✓ PASS |
| Check emails — API failure | non-zero exit → plain-language error | Error table in SKILL.md | ✓ PASS |
| Read thread — selection by number | "open 2" → fetch msg 2 | Selection matching rule #1 (by number) | ✓ PASS |
| Read thread — selection by name | "the one from John" → fetch John's msg | Selection matching rule #2 (by sender) | ✓ PASS |
| Read thread — ambiguous | 2+ Johns → single clarifying question | Disambiguation prompt in SKILL.md | ✓ PASS |
| Draft reply | reply intent → LLM draft → "Here's a draft…" → confirmation prompt | Draft Reply section in SKILL.md | ✓ PASS |
| Long thread | >10 msgs or >2000 words → summarize beyond 5 most recent | Thread summarization section in SKILL.md | ✓ PASS |
| Confirm and send | "yes"/"go ahead" → gog send → "Sent ✓" | Affirmative triggers + send command | ✓ PASS |
| Denial | "no"/"cancel" → discard → "Got it — draft discarded." | Denial triggers in SKILL.md | ✓ PASS |
| Edit loop | edit instruction → full rewrite → re-surface | Edit loop section in SKILL.md | ✓ PASS |
| Send failure | gog send non-zero → preserve draft → show reason | Failure handling in SKILL.md | ✓ PASS |
| Orchestrator routing | email intent → delegate → transparent handoff | omnio SKILL.md + agents.list config | ✓ PASS |

---

## Deviations

### DEV-001 — Command Syntax (Acceptable)
- **Spec says:** `gog mail list --unread`
- **Implementation uses:** `gog mail search "is:unread" -j --results-only`
- **Reason:** `gog mail list` doesn't exist in v0.14.0; `search` with Gmail query syntax is the correct command. Same result.
- **Resolution:** Spec-delta updated at `/sdd:complete` to reflect actual command. Behavior identical.

### DEV-002 — Thread Summarization Depth (Fixed)
- **Spec says:** Summarize beyond the 5 most recent (show last 5 in full)
- **Original implementation:** Show last 2 in full
- **Resolution:** Fixed in SKILL.md — now shows last 5 messages in full, uses snippets for older

---

## CLI Tests (Dev Environment — No Google OAuth)

| Test | Command | Result |
|------|---------|--------|
| Error path — no account | `gog mail search "is:unread" -j` | `missing --account` (exit 2) ✓ |
| Send dry-run | `gog mail send --to x --subject y --body z --dry-run` | `Dry run: would gmail.send` (exit 0) ✓ |
| gog version | `gog --version` | v0.14.0 confirmed ✓ |

---

## Live Tests Required (When Gateway Running)

The following scenarios require: gateway running (`openclaw-start`) + Google OAuth (`gog auth add bilal.haneef@disrupt.com`) + warmup message sent.

- [ ] **Scenario 1 — Happy path**: Discord DM "check my emails" → numbered list → select → draft → "yes" → "Sent ✓"
- [ ] **Scenario 2 — Denial path**: same up to draft → "cancel" → "Got it — draft discarded."
- [ ] **Scenario 3 — Edit path**: same up to draft → "make it shorter" → revised draft → "yes" → "Sent ✓"
- [ ] **Scenario 4 — Error path**: disconnect network → "check my emails" → plain-language error in Discord
- [ ] **Scenario 5 — Ambiguous selection**: two emails from same sender → clarifying question → select correctly

---

## Critical Path Review — No Unauthorized Sends

Code path audit for every way `gog mail send` could be reached:

1. ✅ Affirmative confirmation handler only — requires explicit "yes" keyword
2. ✅ No auto-send on draft creation
3. ✅ No auto-send on edit instruction
4. ✅ Denial clears draft without send
5. ✅ Ambiguous response treated as edit, not confirmation
6. ✅ Send failure preserves draft — no retry without user "yes"

**Verdict:** No code path sends email without explicit user confirmation.
