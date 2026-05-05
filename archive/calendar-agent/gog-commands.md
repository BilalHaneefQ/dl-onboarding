# gog Calendar Command Reference — Calendar Agent

Verified against gog v0.14.0 (2026-05-05).

---

## Find Events (by time window)

```bash
gog calendar events primary --from today --to tomorrow -j --results-only
gog calendar events primary --from "2026-05-06" --to "2026-05-07" -j --results-only
```

Useful for "my 3pm today" — list all events today, then filter by time.

**Output shape:** array of event objects:
```json
[
  {
    "id": "event-id-abc",
    "summary": "Product Sync",
    "start": { "dateTime": "2026-05-05T15:00:00+05:00", "timeZone": "Asia/Karachi" },
    "end":   { "dateTime": "2026-05-05T16:00:00+05:00", "timeZone": "Asia/Karachi" },
    "attendees": [
      { "email": "ahmed@company.com", "displayName": "Ahmed" },
      { "email": "sara@company.com",  "displayName": "Sara" }
    ],
    "conferenceData": {
      "entryPoints": [{ "uri": "https://meet.google.com/abc-defg-hij" }]
    }
  }
]
```

**Meet link extraction:** `event.conferenceData.entryPoints[0].uri` (if present)

---

## Search Events (by keyword)

```bash
gog calendar search "Product Sync" -j --results-only
gog calendar search "budget meeting" --from today -j --results-only
```

Use when user refers to an event by name ("my budget meeting").

---

## Check Free/Busy

```bash
gog calendar freebusy primary --from "2026-05-06T14:00:00+05:00" --to "2026-05-06T15:00:00+05:00" -j --results-only
```

**Output shape:**
```json
{
  "calendars": {
    "primary": {
      "busy": [
        { "start": "2026-05-06T14:00:00+05:00", "end": "2026-05-06T14:30:00+05:00" }
      ]
    }
  }
}
```

`busy` array is empty when the slot is free.

---

## Create Event (with Meet link)

```bash
gog calendar create primary \
  --summary "Meeting with Ahmed and Sara" \
  --from "2026-05-06T14:00:00+05:00" \
  --to   "2026-05-06T15:00:00+05:00" \
  --attendees "ahmed@company.com,sara@company.com" \
  --with-meet \
  --send-updates all \
  --no-input \
  -j --results-only
```

**Without Meet link:** omit `--with-meet`
**Send notifications:** `--send-updates all` notifies all attendees
**Dry-run:** append `--dry-run`

**Output shape:** created event object with `id`, `htmlLink`, and `conferenceData` (if `--with-meet`)

---

## Update Event (reschedule)

```bash
gog calendar update primary {eventId} \
  --from "2026-05-06T16:00:00+05:00" \
  --to   "2026-05-06T17:00:00+05:00" \
  --send-updates all \
  --no-input \
  -j --results-only
```

**Important:** `--attendees` on update REPLACES all attendees. Use `--add-attendee` to add without removing existing ones. To preserve attendees on reschedule, do NOT include `--attendees` flag.

**Meet link preservation:** The `conferenceData` field is preserved automatically on update unless explicitly cleared. No special flag needed.

**Dry-run:** append `--dry-run`

---

## Time Formats

gog accepts both RFC3339 and relative dates:
- RFC3339: `"2026-05-06T14:00:00+05:00"` (preferred for precision)
- Relative: `"today"`, `"tomorrow"`, `"monday"` (date only, not time)
- For agent use: always convert natural language times to RFC3339 with the user's timezone

**Timezone:** Use `Asia/Karachi` (UTC+5) as default unless user specifies otherwise.

---

## Spec-Delta Mapping

| Spec behavior | gog command |
|---|---|
| Find event by time | `gog calendar events primary --from today --to tomorrow -j --results-only` |
| Find event by name | `gog calendar search "{name}" -j --results-only` |
| Availability check | `gog calendar freebusy primary --from RFC3339 --to RFC3339 -j` |
| Create + Meet link | `gog calendar create primary ... --with-meet --send-updates all` |
| Create without Meet | `gog calendar create primary ... --send-updates all` |
| Reschedule (update time) | `gog calendar update primary {id} --from RFC3339 --to RFC3339 --send-updates all` |
| Error detection | Non-zero exit code from any gog command |
