# Proposal: email-agent

## Problem

Professionals waste time opening Gmail to check emails and compose replies throughout the day. The Omnio POC needs an Email Agent that handles the complete read-draft-confirm-send flow via Discord DM — the first of three specialist agents required for POC completion.

Per `Ideation/07-timeline.md`, this is Day 3 of the 2-week build. Infrastructure (OpenClaw, gog CLI, Discord bot) is confirmed working as of Day 2.

## Solution

Build an Email Agent as an OpenClaw specialist agent with three capabilities:

1. **Check emails** — fetches unread Gmail via `gog` CLI, summarizes with numbered list
2. **Draft reply** — reads the selected email thread, uses LLM to draft a context-aware reply, surfaces the draft to the user before any send
3. **Confirm and send** — sends via Gmail API only after explicit user confirmation; discards silently on denial

The agent is invoked by the Orchestrator Agent when it classifies the user's intent as email-related. It runs in an isolated OpenClaw workspace with the user's Google OAuth token.

## Scope

**In scope:**
- Reading unread Gmail (list + full thread fetch)
- LLM-drafted replies with thread context
- Confirmation-gated send
- Graceful failure messages when Gmail API calls fail

**Out of scope (explicitly deferred):**
- Composing new emails (not a reply) — post-POC
- Attachments — post-POC
- Email search / filtering by sender, subject — post-POC
- Marking emails as read without replying — post-POC
- Multi-account Gmail support — post-POC

## Risks

1. **gog CLI output format** — `gog mail` subcommand format may differ from expectations; need to validate exact output shape before writing parser logic
2. **Thread context length** — long email threads may exceed LLM context window; mitigation: summarize thread beyond last N messages
3. **OAuth token expiry** — user's Google token may expire mid-session; mitigation: detect gog auth error and prompt re-auth
4. **Cold-start delay** — first Discord message after gateway restart takes ~10 min (see `LEARNINGS.md` §18); the Email Agent cannot mitigate this — warmup message procedure must be documented
5. **Ambiguous "reply" intent** — user may say "reply" without specifying which email when multiple are listed; agent must ask "Which one?" before drafting
