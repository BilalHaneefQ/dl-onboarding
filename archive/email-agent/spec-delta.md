# Spec Delta: email-agent

> This delta merges into `specs/features/email-agent/spec.md` on `/sdd:complete`.

## ADDED

### Email Agent — Check Emails

**Given** the user sends a message expressing intent to check emails (e.g., "check my emails", "what emails do I have", "any new emails")
**When** the Email Agent invokes `gog mail list --unread` via the gog CLI
**Then** the agent replies with a numbered summary: sender name, subject line, and received time for each unread email
**And** the agent asks "Which one would you like to open?"

**Given** the Gmail API call fails (network error, OAuth expiry, quota exceeded)
**When** `gog` returns a non-zero exit code or error output
**Then** the agent replies with a plain-language error: "I couldn't reach Gmail — [reason]. Try again or re-authenticate with `gog auth`."
**And** no further action is taken

---

### Email Agent — Read Full Thread

**Given** the user has seen the email list and specifies a selection (by number or name, e.g., "open 2", "the one from John")
**When** the Email Agent fetches the full thread via `gog mail get {message-id}`
**Then** the agent shows: sender, subject, received time, and full body (or summarized body if >500 words)
**And** asks "Would you like to reply?"

**Given** the user's selection is ambiguous (e.g., "the John one" when multiple emails are from John)
**When** the agent cannot uniquely identify the email
**Then** the agent asks a single clarifying question listing the ambiguous options by number
**And** waits for the user to disambiguate before fetching

---

### Email Agent — Draft Reply

**Given** the user confirms they want to reply (or directly requests "reply to [N]")
**When** the Email Agent sends the full thread context to the LLM with a drafting prompt
**Then** the agent returns a draft reply prefixed with: "Here's a draft reply to [sender name]:"
**And** the draft is followed by: "Should I send this? (yes / edit / cancel)"
**And** no email is sent at this point

**Given** the thread exceeds practical context length (heuristic: >10 messages or >2000 words)
**When** the agent prepares the drafting prompt
**Then** the agent summarizes messages beyond the 5 most recent and includes the summary in the prompt
**And** notes to the user: "Thread is long — I've summarized older messages for context."

---

### Email Agent — Confirm and Send

**Given** the agent has surfaced a draft and the user responds with affirmative confirmation ("yes", "send it", "go ahead")
**When** the Email Agent calls `gog mail send` with the draft content
**Then** the email is sent via Gmail API
**And** the agent confirms: "Sent ✓"

**Given** the user responds with denial ("no", "cancel", "don't send", "abort")
**When** the agent receives the negative response
**Then** the draft is discarded
**And** the agent replies: "Got it — draft discarded. Anything else?"
**And** no email is sent under any circumstances

**Given** the user responds with "edit" or requests a change to the draft
**When** the agent receives an edit instruction
**Then** the agent regenerates the draft incorporating the requested change
**And** surfaces the new draft again with the same confirmation prompt
**And** does not send until the user explicitly confirms

**Given** the Gmail send call fails after user confirmation
**When** `gog mail send` returns a non-zero exit code
**Then** the agent reports the failure in plain language: "Send failed — [reason]. The draft is preserved. Try again?"
**And** does not silently discard the draft

---

### Email Agent — Orchestrator Routing

**Given** the Orchestrator Agent classifies a user message as email-intent
**When** the Orchestrator delegates to the Email Agent via OpenClaw's `delegate` node
**Then** the Email Agent takes over the conversation turn
**And** the user does not need to know a handoff occurred

## MODIFIED

(None — first feature spec, no existing behavior to modify)

## REMOVED

(None)
