# Tasks: contact-lookup

## Implementation Checklist

### Setup
- [ ] Verify `gog people search` output format and auth scope requirement
- [ ] Test: `gog people search "name" -j --results-only` (check if people scope is needed)

### Skill File
- [ ] Create `skills/contact-lookup/SKILL.md` — command reference, output schema, resolution rules
- [ ] Install skill to main workspace: copy to `~/.openclaw/workspace/skills/contact-lookup/`

### Agent Updates
- [ ] Update omnio skill (orchestrator): add directory lookup before asking for attendee email
- [ ] Update gcal skill (calendar-agent): replace "ask for email" with "search then ask"
- [ ] Update gmail skill (email-agent): add name-to-email resolution for recipients
- [ ] Deploy all three updated skills to live workspaces

### Validation
- [ ] Dry-run: `gog people search "test" -j` (verify command shape, auth)
- [ ] Spec review: all 4 spec scenarios covered in skill implementation
- [ ] Check: no agent asks for email before attempting directory lookup

## Validation

- [ ] All tasks above complete
- [ ] All 4 spec scenarios covered (unique match, multiple match, no match, auth failure)
- [ ] spec-delta reviewed — no deviations
- [ ] Per-user `-a {user_email}` flag included in all people search calls
