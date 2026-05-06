# Tasks: contact-lookup

## Implementation Checklist

### Setup
- [x] Verify `gog people search` output format and auth scope requirement
- [x] Test: `gog people search "name" -j --results-only` (check if people scope is needed)

### Skill File
- [x] Create `skills/contact-lookup/SKILL.md` — command reference, output schema, resolution rules
- [x] Install skill to main workspace: copy to `~/.openclaw/workspace/skills/contact-lookup/`

### Agent Updates
- [x] Update omnio skill (orchestrator): add directory lookup before asking for attendee email
- [x] Update gcal skill (calendar-agent): replace "ask for email" with "search then ask"
- [x] Update gmail skill (email-agent): add name-to-email resolution for recipients
- [x] Deploy all three updated skills to live workspaces

### Validation
- [x] Dry-run: `gog people search "test" -j` (verify command shape, auth)
- [x] Spec review: all 4 spec scenarios covered in skill implementation
- [x] Check: no agent asks for email before attempting directory lookup

## Validation

- [x] All tasks above complete
- [x] All 4 spec scenarios covered (unique/multiple/no match/auth failure — all in SKILL.md)
- [x] spec-delta reviewed — no deviations
- [x] Per-user `-a {user_email}` flag included in all people search calls

## Notes

- Auth scope: `gog people search` requires `people` service. Current auth (gmail,calendar) may need re-auth. Error is distinct: exit 2 (auth) vs exit 3 (no results) — skill handles both paths.
- Exit codes: 0 = results found, 2 = auth error, 3 = no results (--fail-empty)
