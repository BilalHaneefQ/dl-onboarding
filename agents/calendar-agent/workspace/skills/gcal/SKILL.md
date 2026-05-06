---
name: gcal
description: Google Calendar and Meet access via gog CLI — reschedule events, create meetings, generate Meet links.
---

# gcal

Use `gog calendar` for all Google Calendar operations. Calendar ID is `primary` by default. Timezone: `Asia/Karachi` (UTC+5, offset `+05:00`).

---

## Event Search — Resolving User References

When the user mentions an event, resolve it to a specific `eventId` and `calendarId` before showing the confirmation.

**Strategy 1 — By time** ("my 3pm today", "the meeting at 2"):
```bash
gog calendar events primary --from today --to tomorrow -j --results-only
```
Filter the returned array by start time proximity to the mentioned time. "3pm" → find events where `start.dateTime` contains `T15:`.

**Strategy 2 — By name** ("my budget meeting", "the sync with Sara"):
```bash
gog calendar search "{keyword}" -j --results-only
```

**Output shape** (array of event objects):
```json
[
  {
    "id": "event-id-abc",
    "summary": "Product Sync",
    "start": { "dateTime": "2026-05-05T15:00:00+05:00", "timeZone": "Asia/Karachi" },
    "end":   { "dateTime": "2026-05-05T16:00:00+05:00", "timeZone": "Asia/Karachi" },
    "attendees": [
      { "email": "ahmed@company.com", "displayName": "Ahmed" },
      { "email": "sara@company.com",  "displayName": "Sara" },
      { "email": "bilal@company.com", "displayName": "Bilal", "self": true }
    ],
    "conferenceData": {
      "entryPoints": [{ "uri": "https://meet.google.com/abc-defg-hij", "entryPointType": "video" }]
    }
  }
]
```

**Session state:** Keep the last shown event list in memory:
```
[
  { index: 1, summary: "Product Sync", eventId: "abc", calendarId: "primary",
    start: "2026-05-05T15:00:00+05:00", attendeeNames: ["Ahmed","Sara","Bilal"],
    hasMeetLink: true }
]
```

**Unique match** → proceed to confirmation immediately.

**Ambiguous match** (2+ events match):
```
Which meeting do you mean?
1. Product Sync at 3pm (with Ahmed, Sara)
2. 1:1 with Manager at 3pm
```
Wait for selection. Then show confirmation.

**No match:**
```
I couldn't find a meeting matching '[description]'.
Try the event name, an attendee's name, or an exact time.
```

---

## Reschedule Meeting

### Confirmation Display

After uniquely identifying the event, show:
```
Found '[Event Name]' at [current time] with [attendee list].
Reschedule to [new day] at [new time] and notify them?
```

Example:
```
Found 'Product Sync' at 3pm today with Ahmed, Sara, and Bilal.
Reschedule to tomorrow 4pm (16:00–17:00) and notify them?
```

Preserve the same duration as the original event. "Reschedule my 3pm to tomorrow 4pm" → find event duration → apply same duration at new time.

### Execute Reschedule

On affirmative confirmation:
```bash
gog calendar update primary {eventId} \
  --from "{new RFC3339 start}" \
  --to   "{new RFC3339 end}" \
  --send-updates all \
  --no-input \
  -j --results-only
```

**Critical:** Do NOT include `--attendees` — it replaces all attendees. Do NOT touch `conferenceData` — Meet link is preserved automatically.

On success:
```
Rescheduled ✓ — [attendee names] have been notified.
```

On failure (non-zero exit):
```
Reschedule failed — [plain-language reason from stderr]. The event wasn't changed.
```

---

## Check Availability

Before confirming a new meeting creation, always check free/busy:
```bash
gog calendar freebusy primary \
  --from "{RFC3339 slot start}" \
  --to   "{RFC3339 slot end}" \
  -j --results-only
```

**Free** (`busy` array is empty or absent):
```
You're free at [time]. Creating [duration] meeting with [attendees]. Add a Google Meet link?
```

**Busy** (slot has entries in `busy`):
```
You have '[conflicting event summary]' at [time]. Pick a different time, or create the meeting anyway?
```

If the user says "create it anyway" → proceed to creation without re-checking.

---

## Attendee Resolution

When the user names attendees without email addresses ("add Ahmed and Sara"), you cannot create the event without emails.

```
What are Ahmed's and Sara's email addresses?
```

Wait for emails before running freebusy or create. Never invent or guess email addresses.

**Known emails from prior session state** (e.g., user just rescheduled a meeting that included Ahmed) → reuse those emails without asking.

**Default title inference:** "Meeting with Ahmed and Sara" unless the user specifies a name. Ask only if the event type is specialized ("standup", "retrospective", "demo") — for generic meetings, infer the title.

---

## Create Meeting

### Confirmation Display

After freebusy check and attendee resolution:
```
You're free at [time]. Creating [duration] meeting with [attendees]. Add a Google Meet link?
```

If busy, the user said "create anyway":
```
Creating [duration] meeting with [attendees] at [time] (you have a conflict). Add a Google Meet link?
```

### Execute Creation

**With Meet link** (user said "yes" to Meet):
```bash
gog calendar create primary \
  --summary "{title}" \
  --from "{RFC3339 start}" \
  --to   "{RFC3339 end}" \
  --attendees "{email1,email2}" \
  --with-meet \
  --send-updates all \
  --no-input \
  -j --results-only
```

**Without Meet link:**
Omit `--with-meet`.

On success — extract Meet link from response if present:
```
Meeting created ✓ — invites sent to [attendee emails].
Meet link: https://meet.google.com/...
```

Without Meet link:
```
Meeting created ✓ — invites sent to [attendee emails].
```

On failure (non-zero exit):
```
Couldn't create the meeting — [plain-language reason from stderr]. Nothing was created.
```

**Default duration:** 1 hour unless user specifies ("30-minute meeting", "2 hour call").

---

## Time Conversion — Natural Language to RFC3339

Always convert before running commands. Use `Asia/Karachi` (UTC+5 = `+05:00`).

| User says | RFC3339 (assumes today is 2026-05-05) |
|---|---|
| "tomorrow 4pm" | `2026-05-06T16:00:00+05:00` |
| "today 3pm" | `2026-05-05T15:00:00+05:00` |
| "Monday 10am" | `2026-05-11T10:00:00+05:00` |
| "in 30 minutes" | current time + 30m, rounded to next 15-min slot |

Always compute the end time from the duration. Default duration: 1 hour.

---

## Confirmation Triggers

**Affirmative:** "yes", "go ahead", "do it", "sure", "ok", "yep", "create it", "reschedule it"
**Denial:** "no", "cancel", "don't", "abort", "stop", "never mind"
**Ambiguous** (anything else) → ask to clarify, not a confirmation

---

## Error Handling

| gog error | Response |
|---|---|
| `missing --account` | "I need a Google account configured. Run `gog auth add your@email.com` first." |
| `invalid_grant` / token expired | "Your Google session expired — re-authenticate with `gog auth add`." |
| `quotaExceeded` | "Google Calendar rate limit — try again in a minute." |
| `notFound` | "That event doesn't exist or was already deleted." |
| network error | "Couldn't reach Google Calendar — check your connection." |
| any other non-zero | "Calendar returned an error: [raw message from stderr]." |

---

## Notes

- `--dry-run` on create or update validates without making changes — use during testing
- `--send-updates all` is always required on create and update (never omit it)
- Never include `--attendees` on `gog calendar update` — it replaces all attendees
