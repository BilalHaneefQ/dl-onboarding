# gog Mail Command Reference — Email Agent

Verified against gog v0.14.0 (2026-04-30).

---

## List Unread Emails

```bash
gog mail search "is:unread" -j --results-only --max=10
```

- Uses Gmail query syntax (`is:unread`, `from:`, `subject:`, etc.)
- `-j` outputs JSON — use for agent parsing
- `--results-only` drops pagination envelope, returns array directly
- `--max=10` limits results (default is 10)

**Output shape:** array of thread objects with `id`, `snippet`, `messages[]`

To get sender + subject without fetching full body:
```bash
gog mail search "is:unread" -j --results-only --select=id,snippet
```

---

## Get Full Message

```bash
gog mail get {messageId} -j --results-only
```

- Returns full message with headers, body, threadId
- Use `--select` to extract specific fields:
```bash
gog mail get {messageId} -j --results-only --select=id,threadId,payload.headers,snippet
```

---

## Send Reply

```bash
gog mail send \
  --reply-to-message-id={messageId} \
  --thread-id={threadId} \
  --reply-all \
  --subject="{Re: Original Subject}" \
  --body="{draft body}"
```

- `--reply-to-message-id` sets In-Reply-To and References headers
- `--reply-all` auto-populates recipients from the original message
- `--thread-id` keeps reply in the same Gmail thread
- `--body` accepts plain text

**Dry-run (safe test without sending):**
```bash
gog mail send ... --dry-run
```

**Agent safety flag (block all sends in testing):**
```bash
gog mail search ... --gmail-no-send
```

---

## Auth & Account

```bash
# Specify account explicitly (required if multiple accounts)
gog mail search "is:unread" -a bilal.haneef@disrupt.com -j --results-only

# Non-interactive mode (fail instead of prompting — use in agent context)
gog mail send ... --no-input
```

---

## Spec-Delta Mapping

| Spec behavior | gog command |
|---|---|
| Check emails | `gog mail search "is:unread" -j --results-only` |
| Read full thread | `gog mail get {messageId} -j --results-only` |
| Send reply | `gog mail send --reply-to-message-id --thread-id --reply-all --body` |
| Error detection | Non-zero exit code from any gog command |
| Agent safety testing | Append `--gmail-no-send` to block sends |
