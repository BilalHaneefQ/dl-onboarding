---
name: gmail
description: Gmail access via gog CLI — list unread, read threads, send replies.
---

# gmail

Use `gog mail` for all Gmail operations. Account is set via `GOG_ACCOUNT` env var.

## Check Unread Emails

```bash
gog mail search "is:unread" -j --results-only --max=10
```

**Output shape** (array of thread objects):
```json
[
  {
    "id": "thread-id-abc",
    "snippet": "Quick preview of the email body...",
    "messages": [
      {
        "id": "msg-id-xyz",
        "threadId": "thread-id-abc",
        "payload": {
          "headers": [
            { "name": "From", "value": "John Smith <john@example.com>" },
            { "name": "Subject", "value": "Re: Budget proposal" },
            { "name": "Date", "value": "Mon, 4 May 2026 09:15:00 +0500" }
          ]
        }
      }
    ]
  }
]
```

**Parsing rules:**
- Sender: extract from `messages[last].payload.headers` where `name == "From"` — show display name only if present, else email address
- Subject: `headers` where `name == "Subject"`
- Time: `headers` where `name == "Date"` — format as relative time (e.g., "2h ago", "yesterday") if possible, otherwise short date
- Use the **last** message in the thread (most recent)
- Use `messages[last].id` for get and reply operations (not the thread id)
- Use `id` (thread id) for `--thread-id` in send

**Format for user:**
```
You have N unread emails:
1. John Smith — Re: Budget proposal (2h ago)
2. HR Team — Leave policy update (5h ago)
3. Client X — Invoice #1042 (yesterday)

Which one would you like to open?
```

**Empty result** (array is `[]` or length 0):
```
No unread emails right now.
```

---

## Read Full Thread

```bash
gog mail get {messageId} -j --results-only
```

**Output shape:**
```json
{
  "id": "msg-id-xyz",
  "threadId": "thread-id-abc",
  "snippet": "Short preview...",
  "payload": {
    "headers": [
      { "name": "From", "value": "John Smith <john@example.com>" },
      { "name": "Subject", "value": "Re: Budget proposal" },
      { "name": "Date", "value": "Mon, 4 May 2026 09:15:00 +0500" }
    ],
    "parts": [
      {
        "mimeType": "text/plain",
        "body": { "data": "<base64url-encoded body>" }
      }
    ]
  }
}
```

**Parsing rules:**
- Body is base64url-encoded in `payload.parts[*].body.data` where `mimeType == "text/plain"`
- Decode with: `echo "{data}" | base64 -d` (standard base64url, may need `-` → `+` and `_` → `/` substitution)
- If body > 2000 chars: summarize older thread messages, show last 2 in full
- Store `id` (messageId) and `threadId` for the reply command

---

## Send Reply

```bash
gog mail send \
  --reply-to-message-id={messageId} \
  --thread-id={threadId} \
  --reply-all \
  --subject="Re: {original subject}" \
  --body="{draft text}" \
  --no-input
```

**Safety:** Never run this without explicit user confirmation ("yes" / "send it" / "go ahead").
**Dry-run test:** Append `--dry-run` to validate without sending.

---

## Error Handling

All `gog` commands return non-zero exit code on failure. Common errors:

| Exit / stderr | Plain-language response |
|---|---|
| `missing --account` | "I need a Google account set up. Run `gog auth add your@email.com` first." |
| `token expired` / `invalid_grant` | "Your Google session expired. Run `gog auth add your@email.com` to re-authenticate." |
| `quotaExceeded` | "Gmail rate limit hit — try again in a minute." |
| `network error` / `connection refused` | "Couldn't reach Gmail — check your internet connection." |
| Any other non-zero | "Gmail returned an error: [raw error message]. Try again or check `gog auth list`." |

---

## Notes

- Set `GOG_ACCOUNT=bilal.haneef@disrupt.com` in OpenClaw env to avoid `--account` flag on every call
- `--gmail-no-send` flag on any command blocks all sends — useful during testing
- `--dry-run` on `gog mail send` validates the send without executing
