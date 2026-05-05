# Tasks: calendar-agent

## Implementation Checklist

### Setup
- [x] Verify `gog calendar` subcommand availability and output format (`gog calendar --help`)
- [x] Verify Meet link generation method (gog meet subcommand or Calendar conferenceData)
- [x] Document exact gog calendar command signatures: list/search events, update event, create event

### Agent Prompt
- [ ] Write Calendar Agent system prompt (role, gog calendar tools, confirmation-first rules)
- [ ] Register Calendar Agent in OpenClaw (`agents/calendar-agent/register.json`)

### Reschedule Flow
- [ ] Implement event search handler — query by natural language description
- [ ] Implement event disambiguation prompt for ambiguous matches
- [ ] Implement no-match response
- [ ] Implement reschedule confirmation display (event name, attendees, new time)
- [ ] Implement reschedule execution — update event time, preserve Meet link
- [ ] Handle reschedule failure — plain-language error, event unchanged

### Create Meeting Flow
- [ ] Implement availability check before creation
- [ ] Implement creation confirmation display (time, attendees, Meet link offer)
- [ ] Implement attendee email resolution (display name → email, ask if unknown)
- [ ] Implement event creation with attendees
- [ ] Implement Meet link attachment (if requested)
- [ ] Confirm creation: "Meeting created ✓ — invites sent"
- [ ] Handle creation failure — plain-language error, no event created

### Orchestrator Integration
- [ ] Update Orchestrator omnio skill — mark calendar-agent as Active
- [ ] Update routing: calendar/meet intent → calendar-agent delegate
- [ ] Deploy updated omnio skill to main workspace

### Validation
- [ ] Run Scenario 2 end-to-end: "reschedule my 3pm to tomorrow 4pm" → confirm → rescheduled ✓
- [ ] Run Scenario 3 end-to-end: "set up a meeting tomorrow 2pm, add X and Y" → confirm → created ✓
- [ ] Test ambiguous event match → clarifying question → correct event selected
- [ ] Test no-match path → helpful error message
- [ ] Test attendee name resolution → agent asks for email
- [ ] Test Meet link path: creation with "Add a Google Meet link?" → yes → link attached

## Validation

- [ ] All tasks above complete
- [ ] All 6 validation scenarios pass
- [ ] spec-delta reviewed — no deviations from implemented behavior
- [ ] No calendar events created or modified without explicit user confirmation
