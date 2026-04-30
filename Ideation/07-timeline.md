# Build Timeline — 2 Weeks POC

## Week 1 — Core Setup & Integration

| Day | Task | Status |
|---|---|---|
| Day 1 | Install OpenClaw, Node.js 22, configure LLM | Done ✓ |
| Day 2 | Attempted WhatsApp — dropped due to 408 timeouts + cold-start issue | Done ✓ |
| Day 2 | Switched to Discord Bot API — bot online, agent responding | Done ✓ |
| Day 2 | Install gog CLI, connect Google account via OAuth | Done ✓ |
| Day 2 | Install gog skill in OpenClaw, save env vars to config | Done ✓ |
| Day 2 | Tested Gmail reading via Discord — working ✓ | Done ✓ |
| Day 3 | SDD spec for Email agent (read + draft + confirm flow) | Pending |
| Day 4 | SDD spec + build Google Calendar agent | Pending |
| Day 5 | SDD spec + build Google Meet agent | Pending |

## Week 2 — Multi-Agent + Polish

| Day | Task | Status |
|---|---|---|
| Day 6–7 | Multi-agent routing (Email Agent, Calendar/Meet Agent, Orchestrator) | Pending |
| Day 8–9 | Prompt tuning — confirmation flows, edge cases, natural language handling | Pending |
| Day 10 | End-to-end testing of all 3 scenarios | Pending |

---

## Risk Items
- **WhatsApp dropped** — replaced with Discord Bot API ✓
- **Discord cold-start** — first message after gateway restart takes ~10 min (claude-cli warm-up). Send a warmup message yourself before users start chatting.
- **Corporate network** — blocks WebSocket and SSL; work from home or hotspot. Run gateway via nvm node directly, not systemd.
- **Kaspersky** — blocks compilation from source; use pre-built binaries instead
- **gog keyring** — D-Bus unavailable; use `GOG_KEYRING_BACKEND=file` permanently
- **agentRuntime must be set** — `claude-cli` must be set in config or `anthropic` plugin won't load
- **X API approval** — not in scope for POC

---

## Definition of Done (POC)
- [x] Discord bot online and responding
- [x] Google account connected via gog CLI + OAuth
- [x] Can read Gmail unread emails via Discord
- [ ] Can draft and send email replies with confirmation
- [ ] Can reschedule a Google Calendar meeting
- [ ] Can create a new meeting with attendees + Meet link
- [ ] All 3 flows working end-to-end from a single Discord DM
