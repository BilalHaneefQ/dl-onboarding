# Ideal Customer Profiles

> Part of the **Omnio** Product Constitution
> **Tier:** Extended — adopted at POC stage to define the internal validation cohort; expand when moving beyond Disrupt Labs.

**Last amended:** 2026-04-30 (C1 — scoped post-POC ICP as DL-internal, removed commercial budget row, deferred monetization)

---

## ICP: Disrupt Labs Internal Tester (POC)

| Attribute | Detail |
|-----------|--------|
| **Company Size** | Small team (Disrupt Labs, ~10 people) |
| **Industry** | Technology / venture building |
| **Tech Maturity** | Early adopter — comfortable with Discord bots, OAuth, and developer tooling |
| **Annual Budget** | N/A — internal POC, zero acquisition cost |
| **Buying Trigger** | Invited to test by the Omnio team |
| **Decision Maker** | N/A — participation is voluntary during POC |
| **Champion** | Bilal Haneef (builder) |

### Qualification Criteria

Must have:
- Active Google Workspace account (Gmail + Calendar + Meet)
- Discord account and willingness to DM a bot
- Works on a machine where the agent can be hosted or can connect to the POC VPS

### Disqualifiers

- Uses Apple Mail or Outlook instead of Gmail
- Corporate network that blocks WebSocket connections (see [`LEARNINGS.md`](../../LEARNINGS.md) §5)
- Kaspersky or corporate antivirus that blocks binary execution

---

## ICP: Small Team Professional (Post-POC Target — DL Internal Expansion)

> **Scope note:** Omnio is a free internal Disrupt Labs tool. This ICP represents the expanded internal audience post-POC validation, not a commercial customer. Monetization decisions are deferred until after POC results are evaluated.

| Attribute | Detail |
|-----------|--------|
| **Company Size** | 5–50 people (DL teams and affiliates) |
| **Industry** | Technology, consulting, creative agencies |
| **Tech Maturity** | Mainstream adopter — comfortable with SaaS, OAuth consent screens; not necessarily technical |
| **Distribution** | Internal invite — no commercial acquisition |
| **Buying Trigger** | Word of mouth from POC testers; productivity pain with Gmail + Calendar context switching |
| **Decision Maker** | Individual user (bottom-up adoption within DL) |
| **Champion** | Power user on the team who sets up the bot for others |

### Qualification Criteria

Must have:
- Google Workspace (Gmail + Calendar + Meet)
- Discord already in use on the team, or willingness to adopt it for this workflow
- At least daily interaction with email and calendar

### Disqualifiers

- Microsoft 365 ecosystem (Outlook + Teams) — not supported yet
- Requires enterprise SSO or data residency guarantees — not available at this stage
- Expects no-confirmation autonomous email sending — violates core principles

---

## Sources

- [`Ideation/01-project-overview.md`](../../Ideation/01-project-overview.md) — Goal and Phase (POC, internal)
- [`Ideation/08-scaling-plan.md`](../../Ideation/08-scaling-plan.md) — Post-POC user onboarding, multi-tenant architecture
- [`LEARNINGS.md`](../../LEARNINGS.md) — Corporate network and antivirus disqualifiers (§5, §10)
