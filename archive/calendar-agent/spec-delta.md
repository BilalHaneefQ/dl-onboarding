# Spec Delta: calendar-agent

> This delta merges into `specs/features/calendar-agent/spec.md` on `/sdd:complete`.

## ADDED

### Calendar Agent — Reschedule Meeting

**Given** the user requests to reschedule a meeting (e.g., "reschedule my 3pm today to tomorrow 4pm")
**When** the Calendar Agent queries Google Calendar for events matching the description
**Then** the agent identifies the event and replies: "Found '[Event Name]' at [current time] with [attendee names]. Reschedule to [new time] and notify them?"
**And** no changes are made at this point

**Given** the user confirms the reschedule
**When** the Calendar Agent updates the event's start/end time via `gog calendar`
**Then** the event is updated in Google Calendar
**And** the existing Meet link (if any) is preserved on the event
**And** Google Calendar automatically notifies attendees via email
**And** the agent confirms: "Rescheduled ✓ — [attendees] have been notified."

**Given** the user's description matches multiple events (e.g., "my 3pm" when there are two 3pm events)
**When** the Calendar Agent cannot uniquely identify the event
**Then** the agent asks a single clarifying question listing the candidates
**And** waits for the user to select before fetching event details

**Given** no matching event is found
**When** the Calendar Agent queries return no results
**Then** the agent replies: "I couldn't find a meeting matching '[description]'. Try being more specific — event name, attendee, or exact time?"

**Given** the reschedule update fails
**When** the Calendar API returns an error
**Then** the agent reports the failure in plain language and the event is unchanged

---

### Calendar Agent — Create New Meeting

**Given** the user requests to create a meeting (e.g., "set up a meeting tomorrow at 2pm, add ahmed@company.com and sara@company.com")
**When** the Calendar Agent checks the user's availability at the requested time
**Then** the agent replies with one of:
- If free: "You're free at [time]. Creating meeting with [attendees]. Add a Google Meet link?"
- If busy: "You have '[conflicting event]' at [time]. Pick a different time, or create the meeting anyway?"

**Given** the user confirms creation (with or without Meet link)
**When** the Calendar Agent creates the event via `gog calendar`
**Then** the event is created with specified attendees and time
**And** if Meet link was requested: a Google Meet conference is attached to the event
**And** invites are sent to all attendees
**And** the agent confirms: "Meeting created ✓ — invites sent to [attendees]." (with Meet link if generated)

**Given** attendee references use display names instead of email addresses (e.g., "add Ahmed and Sara")
**When** the Calendar Agent cannot resolve a name to an email
**Then** the agent asks: "What's Ahmed's email address?" before creating the event
**And** does not create the event with unresolved attendees

**Given** the meeting creation fails
**When** the Calendar API returns an error
**Then** the agent reports the failure in plain language and no event is created

---

### Calendar Agent — Orchestrator Routing

**Given** the Orchestrator Agent classifies a user message as calendar-intent or meet-intent
**When** the Orchestrator delegates to the Calendar Agent via `openclaw agent --agent calendar-agent --message "{user's message}" --deliver`
**Then** the Calendar Agent takes over the conversation turn
**And** the user does not need to know a handoff occurred

## MODIFIED

### Orchestrator Routing — Agent Availability (in orchestrator skill)

**Before:** `calendar-agent` listed as "✗ Not yet built"
**After:** `calendar-agent` listed as "✓ Active — Google Calendar + Meet"

## REMOVED

(None)
