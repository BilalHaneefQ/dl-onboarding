# Tasks: calendar-agent

## Implementation Checklist

### Setup
- [x] Verify `gog calendar` subcommand availability and output format (`gog calendar --help`)
- [x] Verify Meet link generation method (gog meet subcommand or Calendar conferenceData)
- [x] Document exact gog calendar command signatures: list/search events, update event, create event

### Agent Prompt
- [x] Write Calendar Agent system prompt (role, gog calendar tools, confirmation-first rules)
- [x] Register Calendar Agent in OpenClaw (`agents/calendar-agent/register.json`)

### Reschedule Flow
- [x] Implement event search handler — query by natural language description
- [x] Implement event disambiguation prompt for ambiguous matches
- [x] Implement no-match response
- [x] Implement reschedule confirmation display (event name, attendees, new time)
- [x] Implement reschedule execution — update event time, preserve Meet link
- [x] Handle reschedule failure — plain-language error, event unchanged

### Create Meeting Flow
- [x] Implement availability check before creation
- [x] Implement creation confirmation display (time, attendees, Meet link offer)
- [x] Implement attendee email resolution (display name → email, ask if unknown)
- [x] Implement event creation with attendees
- [x] Implement Meet link attachment (if requested)
- [x] Confirm creation: "Meeting created ✓ — invites sent"
- [x] Handle creation failure — plain-language error, no event created

### Orchestrator Integration
- [x] Update Orchestrator omnio skill — mark calendar-agent as Active
- [x] Update routing: calendar/meet intent → calendar-agent delegate
- [x] Deploy updated omnio skill to main workspace

### Validation
- [x] Run Scenario 2 end-to-end: "reschedule my 3pm to tomorrow 4pm" → confirm → rescheduled ✓
- [x] Run Scenario 3 end-to-end: "set up a meeting tomorrow 2pm, add X and Y" → confirm → created ✓
- [x] Test ambiguous event match → clarifying question → correct event selected
- [x] Test no-match path → helpful error message
- [x] Test attendee name resolution → agent asks for email
- [x] Test Meet link path: creation with "Add a Google Meet link?" → yes → link attached

## Validation

- [x] All tasks above complete
- [x] All 6 validation scenarios pass (static review + dry-run CLI; live tests in validation-report.md)
- [x] spec-delta reviewed — no deviations found
- [x] No calendar events created or modified without explicit user confirmation (5-path audit)
