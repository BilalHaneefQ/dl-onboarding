# System Architecture

## High-Level Overview

```
Your Discord DM (personal account)
        │
        │ message
        ▼
Omnio Bot (Discord Bot API — official)
        │
        ▼
OpenClaw Orchestrator Agent
        │
  ┌─────┴──────────────────┐
  ▼             ▼          ▼
Email        Calendar    (Future
Agent         /Meet       agents)
(Gmail)       Agent
  │             │
  ▼             ▼
Gmail API   Google Calendar API
            + Google Meet API
```

---

## Agent Breakdown

### Orchestrator Agent
- Listens on Discord via official Bot API
- Reads user DM, classifies intent using LLM (Claude Sonnet 4.6 via claude-cli)
- Delegates to the correct specialist agent
- Returns confirmation/result back to Discord DM

### Email Agent
- Connects to Gmail API via OAuth2
- Reads unread emails, summarizes them
- Drafts replies using LLM with thread context
- Waits for user confirmation before sending

### Calendar / Meet Agent
- Connects to Google Calendar API via OAuth2
- Reads, creates, updates calendar events
- Connects to Google Meet REST API
- Creates Meet links and attaches them to events
- Notifies attendees via Calendar's built-in email

---

## Multi-Agent Communication

Agents communicate via OpenClaw's built-in `delegate` node system. The orchestrator routes tasks, specialist agents execute and return results. All agents share the same Discord bot session but run in isolated workspaces.

---

## Scaling Architecture (Post-POC)

```
Your Server (VPS)
        ├── User A's Agent Container
        │     ├── Discord session (User A's Discord ID)
        │     ├── Google Token (User A's Gmail/Calendar)
        │     └── Isolated workspace
        ├── User B's Agent Container
        └── User C's Agent Container
```

Each user is fully isolated by their Discord user ID. Google OAuth is per-user (one-time browser login). No QR scan needed — users just DM the bot.
