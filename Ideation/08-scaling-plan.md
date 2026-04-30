# Scaling Plan (Post-POC)

## POC → Product

The POC is built for a single user. The architecture is designed so scaling to multiple users requires minimal changes.

---

## What Changes When Scaling

| Component | POC | Scaled |
|---|---|---|
| Discord | Single bot, single server | Same bot, multiple users via DM |
| Hosting | Local machine or single VPS | Multi-container VPS per user |
| Google OAuth | Manual setup per tester | Self-serve onboarding flow |
| Agent isolation | Single agent | Per-user container (openclaw-multitenant) |
| claude-cli cold-start | Warmup message manually | Automated warmup hook on gateway start |

---

## User Onboarding Flow (Scaled Product)

1. User gets invite link to the Omnio Discord server
2. They DM the Omnio bot
3. Bot sends onboarding prompt with a Google OAuth link
4. User clicks "Connect Google" → OAuth consent screen → Allow
5. Agent spins up in their own container linked to their Discord ID
6. They DM the bot → agent is live

Total user onboarding time: under 3 minutes. No QR scan, no spare SIM.

---

## Discord Scaling Note

- Discord Bot API: Free, unlimited users, official API
- Users are isolated by Discord user ID — no mixing of data
- Single bot token serves all users — no per-user bot needed
- For enterprise: can switch to WhatsApp Business API later without rebuilding agent logic

---

## Multi-Tenant Architecture

```
VPS
├── User A Container (Discord ID A + Google Token A)
├── User B Container (Discord ID B + Google Token B)
└── User C Container (Discord ID C + Google Token C)
```

Tool: `openclaw-multitenant` (open source, available on GitHub)
Each user is fully isolated — no data crosses between containers.
