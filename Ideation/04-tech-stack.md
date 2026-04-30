# Tech Stack

## Core

| Layer | Tool | Why |
|---|---|---|
| Agent Framework | OpenClaw (self-hosted) v2026.4.26 | Orchestrator + agent runner |
| Runtime | Node.js 22.22.2 (via nvm) | Required by OpenClaw (Bun not supported) |
| Messaging Channel | Discord Bot API (official) | Replaced WhatsApp — stable, legit, no timeouts |
| Google Integration | `gog` CLI v0.14.0 + OAuth2 | Gmail, Calendar, Meet access via terminal |
| LLM / AI Brain | Claude Sonnet 4.6 (via claude-cli runtime) | Natural language understanding |
| Agent Runtime | `claude-cli` harness | Required for anthropic plugin to load |
| Google Workspace CLI | gog v0.14.0 | Bridges OpenClaw to Gmail, Calendar, Drive |
| Google Skill | OpenClaw `gog` skill (installed) | Tells OpenClaw when/how to use gog CLI |
| Multi-Agent Routing | OpenClaw delegate node system | Routes tasks to the right agent |

## Google APIs Used

| API | Purpose | Cost |
|---|---|---|
| Gmail API | Read emails, send replies | Free (1B quota units/day) |
| Google Calendar API | Read, create, update events | Free (1M queries/day) |
| Google Meet REST API | Create Meet links | Free |

## Discord (Current Channel)

| Item | Detail |
|---|---|
| Bot name | Omnio#5296 |
| App ID | 1499042698974331012 |
| Auth | Bot token (stored in OpenClaw config) |
| Intents | Presence, Server Members, Message Content |
| DM Policy | Open (all approved users can DM) |
| Cost | Free (official Discord Bot API) |

## WhatsApp (Dropped for POC)

WhatsApp was attempted first but dropped due to:
- Baileys (unofficial API) causing 408 WebSocket timeouts
- `claude-cli` cold-start (10 min) longer than WhatsApp's session timeout
- Corporate network blocking WebSocket connections

Switching to Discord eliminated all these issues.

## Hosting

| Option | Cost | Notes |
|---|---|---|
| Local machine | $0 | Must stay on 24/7 |
| VPS (Hetzner/DigitalOcean) | ~$5–10/month | Recommended for always-on |
| OpenClaw Cloud | $59/month | Fully managed, no setup |

## VPS Minimum Specs (Multi-Agent)

- CPU: 4 vCPU
- RAM: 8 GB
- Storage: 40 GB SSD
- OS: Ubuntu 22.04
- Docker: 24+
