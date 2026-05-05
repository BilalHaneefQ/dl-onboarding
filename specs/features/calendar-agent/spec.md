# Feature Spec: Calendar Agent

**Status:** Active
**Last reviewed:** 2026-05-05
**Cycle landed:** calendar-agent (archive: `archive/calendar-agent/`)

---

## Calendar Agent — Reschedule Meeting

**Given** the user requests to reschedule a meeting (e.g., "reschedule my 3pm today to tomorrow 4pm")
**When** the Calendar Agent queries Google Calendar for events matching the description
**Then** the agent identifies the event and replies: "Found '[Event Name]' at [current time] with [attendee names]. Reschedule to [new time] and notify them?"
**And** no changes are made at this point

**Given** the user confirms the reschedule
**When** the Calendar Agent updates the event's start/end time via `gog calendar update primary {eventId} --from {RFC3339} --to {RFC3339} --send-updates all --no-input`
**Then** the event is updated in Google Calendar
**And** the existing Meet link (if any) is preserved on the event (conferenceData is not modified)
**And** Google Calendar notifies attendees via `--send-updates all`
**And** the agent confirms: "Rescheduled ✓ — [attendees] have been notified."

**Given** the user's description matches multiple events (e.g., "my 3pm" when there are two 3pm events)
**When** the Calendar Agent cannot uniquely identify the event
**Then** the agent asks a single clarifying question listing the candidates by number
**And** waits for the user to select before fetching event details

**Given** no matching event is found
**When** the Calendar Agent query returns no results
**Then** the agent replies: "I couldn't find a meeting matching '[description]'. Try the event name, an attendee's name, or an exact time."

**Given** the reschedule update fails
**When** `gog calendar update` returns a non-zero exit code
**Then** the agent reports the failure in plain language and the event is unchanged

---

## Calendar Agent — Create New Meeting

**Given** the user requests to create a meeting (e.g., "set up a meeting tomorrow at 2pm, add ahmed@company.com and sara@company.com")
**When** the Calendar Agent checks the user's availability at the requested time via `gog calendar freebusy primary --from {RFC3339} --to {RFC3339} -j --results-only`
**Then** the agent replies with one of:
- If free: "You're free at [time]. Creating meeting with [attendees]. Add a Google Meet link?"
- If busy: "You have '[conflicting event]' at [time]. Pick a different time, or create the meeting anyway?"

**Given** the user confirms creation (with or without Meet link)
**When** the Calendar Agent creates the event via `gog calendar create primary --summary {title} --from {RFC3339} --to {RFC3339} --attendees {emails} [--with-meet] --send-updates all --no-input`
**Then** the event is created with specified attendees and time
**And** if Meet link was requested: a Google Meet conference is attached to the event via `--with-meet`
**And** invites are sent to all attendees via `--send-updates all`
**And** the agent confirms: "Meeting created ✓ — invites sent to [attendees]." (with Meet link URL if generated)

**Given** attendee references use display names instead of email addresses (e.g., "add Ahmed and Sara")
**When** the Calendar Agent cannot resolve a name to an email
**Then** the agent asks: "What are Ahmed's and Sara's email addresses?" before running freebusy or create
**And** does not create the event with unresolved attendees

**Given** the meeting creation fails
**When** `gog calendar create` returns a non-zero exit code
**Then** the agent reports the failure in plain language and no event is created

---

## Calendar Agent — Orchestrator Routing

**Given** the Orchestrator Agent classifies a user message as calendar-intent or meet-intent
**When** the Orchestrator delegates via `openclaw agent --agent calendar-agent --message "{user's message}" --deliver`
**Then** the Calendar Agent takes over the conversation turn
**And** the user does not need to know a handoff occurred
