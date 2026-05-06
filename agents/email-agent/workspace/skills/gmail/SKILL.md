---
name: gmail
description: Gmail access via gog CLI — list unread, read threads, send replies. Scoped per-user via -a flag.
---

# gmail

Use `gog mail` for all Gmail operations. Always include `-a {user_email}` to scope to the correct user's account.

## Extracting User Email

Your message from the Orchestrator starts with `[user_email:x@y.com]`. Extract this before running any gog command:

```
[user_email:bilal@company.com] check my emails
→ USER_EMAIL = bilal@company.com
→ MESSAGE = "check my emails"
```

Use `USER_EMAIL` as the `-a` value for all gog commands in this session.

---

## Check Unread Emails

```bash
gog mail search "is:unread" -a {USER_EMAIL} -j --results-only --max=10
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
            { "name": "Date", "value": "Mon, 5 May 2026 09:15:00 +0500" }
          ]
        }
      }
    ]
  }
]
```

**Parsing rules:**
- Sender: extract from `messages[last].payload.headers` where `name == "From"`
- Subject: `headers` where `name == "Subject"`
- Time: `headers` where `name == "Date"` — format as relative time
- Use `messages[last].id` for get/reply operations; `id` (thread id) for `--thread-id` in send

**Format for user:**
```
You have N unread emails:
1. John Smith — Re: Budget proposal (2h ago)
2. HR Team — Leave policy update (5h ago)
3. Client X — Invoice #1042 (yesterday)

Which one would you like to open?
```

**Empty result:** `No unread emails right now.`

---

## Email Selection — Resolving User References

Keep session state: index → messageId + threadId mapping.

**Matching rules (in order):** by number → by sender name → by subject keyword → by position

**Unique match** → fetch. **Ambiguous** → single clarifying question. **No match** → re-show list. **Stale list** → re-fetch first.

---

## Read Full Thread

```bash
gog mail get {messageId} -a {USER_EMAIL} -j --results-only
```

Body is base64url-encoded in `payload.parts[*].body.data` where `mimeType == "text/plain"`. Decode with `base64 -d` (replace `-`→`+` and `_`→`/` first if needed).

**Thread summarization** (>10 messages or >2000 words): summarize beyond the 5 most recent; show last 5 in full. Tell user: "Thread is long — I've summarized older messages for context."

---

## Draft Reply

Build LLM prompt with thread context. Surface draft:
```
Here's a draft reply to {sender first name}:

---
{draft body}
---

Should I send this? (yes / edit / cancel)
```

**Edit loop:** full rewrite on any edit instruction. Only send on explicit "yes".

---

## Send Reply

```bash
gog mail send \
  -a {USER_EMAIL} \
  --reply-to-message-id={messageId} \
  --thread-id={threadId} \
  --reply-all \
  --subject="Re: {subject}" \
  --body="{draft}" \
  --no-input
```

**Confirmation triggers:** "yes", "send it", "go ahead", "send", "do it", "ok send", "yep"
**Denial triggers:** "no", "cancel", "don't send", "abort", "stop", "never mind"
**Ambiguous** → treat as edit, not confirmation

**On success:** `Sent ✓`
**On failure:** preserve draft, report error, offer retry

---

## Token Expiry Re-Auth

If gog returns `invalid_grant` or `token expired`:
```
Your Google session expired. Re-authenticate here: {AUTH_SERVER}/oauth/start?discord_id={DISCORD_ID}&email={USER_EMAIL}
```

---

## Error Handling

| gog error | Response |
|---|---|
| `missing --account` | "I need a Google account set up. Run `gog auth add your@email.com` first." |
| `invalid_grant` / token expired | Re-auth link (see above) |
| `quotaExceeded` | "Gmail rate limit — try again in a minute." |
| network error | "Couldn't reach Gmail — check your connection." |
| any other non-zero | "Gmail returned an error: [raw message]. Try again or check `gog auth list`." |

---

## Notes

- `--gmail-no-send` blocks all sends — use during testing
- `--dry-run` on send validates without executing
- `GOG_ACCOUNT` global env is no longer used — always pass `-a {USER_EMAIL}` explicitly

---

## Recipient Name Resolution

When the user says "email [name]" or "forward to [name]" without an email address:

1. Run `gog people search "{name}" -a {USER_EMAIL} -j --results-only --max=5 --fail-empty`
2. Follow the `contact-lookup` skill resolution rules (confirm unique match, disambiguate multiple, ask if none)
3. Never ask "what's their email?" without attempting a directory lookup first

Example:
```
User: "email Ahmed about the budget doc"
→ Run: gog people search "Ahmed" -a bilal@disrupt.com -j --results-only
→ Reply: "Found Ahmed Hassan (ahmed@disrupt.com). Use this address?"
→ User: "yes" → proceed to draft the email to ahmed@disrupt.com
```
