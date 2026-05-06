---
name: gcal
description: Google Calendar and Meet access via gog CLI — per-user scoped via -a flag.
---

# gcal

Use `gog calendar` for all Google Calendar operations. Always include `-a {USER_EMAIL}`. Calendar ID: `primary`. Timezone: `Asia/Karachi` (UTC+5, `+05:00`).

## Extracting User Email

Your message from the Orchestrator starts with `[user_email:x@y.com]`. Extract this before running any gog command:

```
[user_email:bilal@company.com] reschedule my 3pm to tomorrow 4pm
→ USER_EMAIL = bilal@company.com
→ MESSAGE = "reschedule my 3pm to tomorrow 4pm"
```

Use `USER_EMAIL` as the `-a` value for all gog commands.

---

## Event Search — Resolving User References

**By time** ("my 3pm today"):
```bash
gog calendar events primary -a {USER_EMAIL} --from today --to tomorrow -j --results-only
```
Filter by `start.dateTime` containing `T15:` for "3pm".

**By name** ("my budget meeting"):
```bash
gog calendar search "{keyword}" -a {USER_EMAIL} -j --results-only
```

**Output shape:**
```json
[
  {
    "id": "event-id-abc",
    "summary": "Product Sync",
    "start": { "dateTime": "2026-05-05T15:00:00+05:00" },
    "end":   { "dateTime": "2026-05-05T16:00:00+05:00" },
    "attendees": [{ "email": "ahmed@co.com", "displayName": "Ahmed" }],
    "conferenceData": { "entryPoints": [{ "uri": "https://meet.google.com/abc-defg-hij" }] }
  }
]
```

Keep session state: `[{ index, summary, eventId, calendarId: "primary", start, attendeeNames, hasMeetLink }]`

**Unique match** → confirmation. **Ambiguous** → single clarifying question. **No match** → helpful error.

---

## Check Availability

```bash
gog calendar freebusy primary -a {USER_EMAIL} \
  --from "{RFC3339}" --to "{RFC3339}" -j --results-only
```

`busy` empty = free. Show conflict if busy.

---

## Reschedule Event

Confirmation display:
```
Found '[Name]' at [time] with [attendees]. Reschedule to [new time] and notify them?
```

Execute (preserve Meet link — do NOT include `--attendees`):
```bash
gog calendar update primary {eventId} -a {USER_EMAIL} \
  --from "{RFC3339}" --to "{RFC3339}" \
  --send-updates all --no-input -j --results-only
```

Success: `Rescheduled ✓ — [attendees] have been notified.`
Failure: plain-language error, event unchanged.

---

## Create Event

Confirmation display:
```
You're free at [time]. Creating [duration] meeting with [attendees]. Add a Google Meet link?
```

Execute with Meet:
```bash
gog calendar create primary -a {USER_EMAIL} \
  --summary "{title}" \
  --from "{RFC3339}" --to "{RFC3339}" \
  --attendees "{email1,email2}" \
  --with-meet --send-updates all --no-input -j --results-only
```

Without Meet: omit `--with-meet`.

Success: `Meeting created ✓ — invites sent to [emails]. Meet link: https://meet.google.com/...`
Failure: plain-language error, no event created.

**Attendee resolution:** ask for email if only display name given. Default duration: 1 hour.

---

## Time Conversion

All times → RFC3339 with `+05:00` (Asia/Karachi):
- "tomorrow 4pm" → `2026-05-06T16:00:00+05:00`
- "today 3pm" → `2026-05-05T15:00:00+05:00`

---

## Token Expiry Re-Auth

If gog returns `invalid_grant` or `token expired`:
```
Your Google session expired. Re-authenticate: {AUTH_SERVER}/oauth/start?discord_id={DISCORD_ID}&email={USER_EMAIL}
```

---

## Confirmation Triggers

**Affirmative:** "yes", "go ahead", "do it", "sure", "ok", "yep", "create it", "reschedule it"
**Denial:** "no", "cancel", "don't", "abort", "stop", "never mind"

---

## Error Handling

| gog error | Response |
|---|---|
| `missing --account` | "I need a Google account configured." |
| `invalid_grant` / token expired | Re-auth link (see above) |
| `quotaExceeded` | "Google Calendar rate limit — try again in a minute." |
| `notFound` | "That event doesn't exist or was already deleted." |
| network error | "Couldn't reach Google Calendar — check your connection." |

---

## Notes

- `--dry-run` on create/update validates without making changes
- Always `--send-updates all` on create and update
- Never `--attendees` on update (replaces all attendees)
- `GOG_ACCOUNT` global env no longer used — always pass `-a {USER_EMAIL}` explicitly
