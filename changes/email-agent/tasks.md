# Tasks: email-agent

## Implementation Checklist

### Setup
- [x] Verify `gog mail` subcommand availability and output format (`gog mail --help`, `gog mail list --unread`)
- [x] Document exact gog mail command signatures needed: list, get, send

### Agent Prompt
- [x] Write Email Agent system prompt: role definition, available tools (gog CLI), confirmation-first rules, tone
- [x] Register Email Agent in OpenClaw as a specialist agent with its own workspace

### Check Emails Flow
- [ ] Implement "check emails" intent handler — call `gog mail list --unread`, parse output
- [ ] Format unread list as numbered summary (sender, subject, time)
- [ ] Handle zero unread emails gracefully: "No unread emails right now."
- [ ] Handle gog CLI error on list call — surface plain-language error to user

### Read Thread Flow
- [ ] Implement email selection handler — accept number or name reference
- [ ] Implement disambiguation prompt for ambiguous selections
- [ ] Call `gog mail get {message-id}` and format thread for display
- [ ] Implement thread summarization for long threads (>10 messages or >2000 words)

### Draft Reply Flow
- [ ] Build LLM drafting prompt with thread context
- [ ] Surface draft to user with yes / edit / cancel prompt
- [ ] Implement edit loop — regenerate draft on edit instruction, re-surface

### Confirm and Send Flow
- [ ] Implement affirmative confirmation handler → `gog mail send`
- [ ] Implement denial handler → discard draft, acknowledge
- [ ] Handle gog send failure — preserve draft, report error, offer retry
- [ ] Confirm success: "Sent ✓"

### Orchestrator Integration
- [ ] Configure Orchestrator Agent to detect email intent and delegate to Email Agent
- [ ] Verify OpenClaw `delegate` node handoff works end-to-end from Discord DM

### Validation
- [ ] Run Scenario 1 end-to-end from Discord DM: check emails → select → draft → confirm → sent ✓
- [ ] Run Scenario 1 with denial path: check → select → draft → cancel → "draft discarded"
- [ ] Run Scenario 1 with edit path: check → select → draft → edit → revised draft → confirm → sent ✓
- [ ] Test error path: simulate gog failure, verify plain-language error appears in Discord
- [ ] Test ambiguous selection: two emails from same sender → clarifying question → correct email opened

## Validation

- [ ] All tasks above complete
- [ ] All 5 validation scenarios pass
- [ ] spec-delta reviewed — no deviations from implemented behavior
- [ ] No emails sent without explicit user confirmation (critical — review all code paths)
