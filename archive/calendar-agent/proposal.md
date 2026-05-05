# Proposal: calendar-agent

## Problem

Two of the three Omnio POC scenarios (Scenarios 2 and 3) require a Calendar/Meet Agent that doesn't yet exist. Users currently have no way to reschedule meetings or create new ones with Meet links via Discord DM. Per `Ideation/07-timeline.md`, this is Days 4–5 of the build.

## Solution

Build a Calendar/Meet Agent as an OpenClaw specialist agent with three capabilities:

1. **Reschedule meeting** — find an existing event by natural language ("my 3pm today"), update its time, preserve existing Meet link, notify attendees
2. **Create new meeting** — check availability, create Calendar event with specified attendees, optionally generate Google Meet link, send invites
3. **Create Meet link only** — generate a Meet link and attach it to a new or existing event

All three require explicit user confirmation before executing. The agent uses `gog calendar` and `gog meet` (if available) CLI commands via the `gog` skill.

The Orchestrator Agent routes calendar/meet intent to this agent via the same `openclaw agent --agent calendar-agent` delegation pattern established for the email-agent.

## Scope

**In scope:**
- Reschedule existing Google Calendar event (change start/end time, same day or different day)
- Create new Calendar event with attendees
- Add Google Meet link to new event
- Preserve existing Meet link when rescheduling
- Notify attendees via Calendar's built-in invite notifications
- Availability check before creating (confirm slot is free)

**Out of scope (explicitly deferred):**
- Cancel/delete events — post-POC
- Multi-calendar support (non-primary calendar) — post-POC
- Recurring event edits — post-POC
- External attendee availability checking — post-POC
- RSVP tracking — post-POC

## Risks

1. **gog calendar command shape** — need to verify exact `gog calendar` subcommands before writing spec-delta (same lesson as email-agent's `list --unread` vs `search "is:unread"`)
2. **Meet link creation** — `gog` may not have a dedicated `meet` subcommand; Meet links may be generated via Calendar API's conferenceData when creating events
3. **Ambiguous event matching** — "my 3pm meeting" could match multiple events; need disambiguation flow similar to email selection
4. **Timezone handling** — rescheduling requires correct timezone interpretation ("tomorrow 4pm" in user's local timezone)
5. **Attendee resolution** — "add ahmed and sara" requires resolving display names to email addresses (may need Google Contacts lookup via `gog contacts`)
