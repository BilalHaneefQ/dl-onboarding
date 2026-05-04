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

## Email Selection — Resolving User References

After showing the numbered email list, the user will refer to an email. You must map their reference to a specific `messageId` before fetching.

**Session state:** Keep the last shown email list in memory as an array:
```
[
  { index: 1, sender: "John Smith", subject: "Re: Budget proposal", messageId: "msg-abc", threadId: "thread-xyz" },
  { index: 2, sender: "HR Team",    subject: "Leave policy update",  messageId: "msg-def", threadId: "thread-uvw" },
  ...
]
```

**Selection matching rules (in order):**

1. **By number**: "open 1", "the first one", "#2" → match `index`
2. **By sender name**: "the one from John", "John's email" → case-insensitive substring match on `sender`
3. **By subject keyword**: "the budget one", "invoice email" → case-insensitive substring match on `subject`
4. **By position**: "the last one" → highest index; "the first" → index 1

**Unique match** → fetch immediately, no confirmation needed.

**Ambiguous match** (2+ emails match the reference):
- Ask exactly one clarifying question listing the candidates by number:
  ```
  Which one do you mean?
  1. John Smith — Re: Budget proposal
  2. John Lee — Onboarding checklist
  ```
- Wait for user to clarify. Then fetch.

**No match** (reference doesn't match any email in the list):
- Reply: "I don't see an email matching '[reference]'. Here's the list again:" then re-show the list.

**Stale list** (user references an email but no list in session memory):
- Reply: "Let me check your emails first." then run the check emails flow.

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
- Decode with: `echo "{data}" | base64 -d` (standard base64url — replace `-` with `+` and `_` with `/` before decoding if needed)
- If `payload.parts` is absent, body may be in `payload.body.data` directly (simple single-part message)
- Store `id` (messageId) and `threadId` for the reply command

**Thread display format:**
```
From: John Smith <john@example.com>
Subject: Re: Budget proposal
Date: Mon, 4 May 2026 09:15am

[decoded email body]

---
Would you like to reply?
```

**Thread summarization** (apply when thread body exceeds 2000 words OR more than 10 messages):

1. Fetch the last 5 message IDs from the thread (use `gog mail search "threadId:{threadId}" -j --results-only` to get all, take last 5)
2. Fetch each of those 5 messages in full via `gog mail get {messageId} -j --results-only`
3. For older messages (beyond the 5), use the `snippet` field — no extra API call needed
4. Prepend a summary block before the full messages:
   ```
   [Thread is long — earlier context summarized]
   • N older messages from {date range}
   • Key topics: {brief topic summary from snippets}
   
   Most recent 5 messages:
   [last 5 messages in full]
   ```
5. Tell the user: "Thread is long — I've summarized older messages for context."

**Single-message thread** (no prior context): show full body directly, no summary needed.

---

## Draft Reply

When the user wants to reply (either prompted after reading or directly requested), draft a reply before sending anything.

### Drafting Prompt Construction

Build the LLM prompt with the following structure:

```
You are drafting a professional email reply on behalf of the user.

Thread context:
---
From: {sender}
Subject: {subject}
Date: {date}

{thread body or summary}
---

Draft a concise, professional reply. Match the tone of the original message.
Do not add sign-off (the user's signature will handle that).
Do not add "Subject:" or headers — body only.
Reply only to the specific points raised. Be direct, not verbose.
```

Store the draft in session memory. Do not send.

### Surfacing the Draft

Always show the draft with this exact format:

```
Here's a draft reply to {sender first name}:

---
{draft body}
---

Should I send this? (yes / edit / cancel)
```

- Use the sender's first name only (extract from "John Smith" → "John")
- The `---` delimiters help the user visually separate the draft from the conversation
- Always end with the three-option prompt on a new line

### Edit Loop

When the user says "edit", requests a change, or gives a specific instruction (e.g., "make it shorter", "add that I'll follow up Monday", "be more formal"):

1. Re-run the drafting prompt with an additional instruction line:
   ```
   Additional instruction: {user's edit request}
   Previous draft (for reference, do not repeat verbatim): {previous draft}
   ```
2. Generate a completely new draft — do not patch the old one
3. Surface the new draft with the same format and confirmation prompt
4. Repeat for as many edit rounds as the user requests
5. Only send when the user explicitly confirms with yes/send

**Edit triggers** (match any of these): "edit", "change", "shorter", "longer", "formal", "casual", "add", "remove", "different", "again", "rewrite", or any instruction that modifies the draft.

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

**Safety:** Never run this without explicit user confirmation. See confirmation rules below.
**Dry-run test:** Append `--dry-run` to validate without sending.

### Confirmation Handler

**Affirmative triggers** (match any): "yes", "send it", "go ahead", "send", "do it", "ok send", "yep", "yeah send"
→ Execute `gog mail send` with the stored draft + messageId + threadId
→ On success (exit 0): reply `Sent ✓`
→ On failure (non-zero exit): see Failure handling below

**Denial triggers** (match any): "no", "cancel", "don't send", "abort", "stop", "never mind", "discard"
→ Clear the draft from session memory
→ Reply: `Got it — draft discarded. Anything else?`
→ Do NOT send under any circumstances

**Ambiguous response** (none of the above): treat as an edit instruction, not a confirmation
→ Regenerate draft with the user's message as the edit instruction
→ Re-surface with the confirmation prompt

### Failure Handling

When `gog mail send` returns non-zero exit:
1. Do NOT discard the draft — keep it in session memory
2. Reply: `Send failed — {plain-language reason from stderr}. Your draft is still here — want to try again?`
3. Re-surface the draft body
4. Wait for another yes/cancel

**Common send failure reasons:**

| Error | Plain-language |
|---|---|
| `invalid_grant` / `token expired` | "your Google session expired — re-authenticate with `gog auth add`" |
| `quotaExceeded` | "Gmail rate limit hit — try again in a minute" |
| `Recipient address required` | "missing recipient address" |
| network error | "couldn't reach Gmail — check your connection" |
| any other | show raw error message from stderr |

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
