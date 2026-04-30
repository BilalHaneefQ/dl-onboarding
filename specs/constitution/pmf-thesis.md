# Product-Market Fit Thesis

> Part of the **Omnio** Product Constitution

**Last amended:** 2026-04-30 (C1 — added quantitative evidence targets for Day 10 validation)

---

## PMF Status

**Current stage:** Pre-PMF — active POC, internal validation only

## Customer

Disrupt Labs professionals who use Gmail, Google Calendar, and Google Meet daily and operate under time pressure throughout the workday. See [Personas](personas.md) for the full primary user profile.

## Problem

Context-switching between three separate productivity tools (Gmail, Google Calendar, Google Meet) for routine tasks — reading emails, rescheduling meetings, creating Meet links — fragments attention and wastes time. The problem is compounded when these tasks need fast action throughout the day with no single place to handle them.

## Solution

A multi-agent AI system controlled entirely through a Discord DM. An orchestrator agent interprets natural language, delegates to specialist agents (Email, Calendar/Meet), and confirms every action before execution. The user never leaves the Discord window.

## Evidence

**Infrastructure signals (current):**
- **Day 2 of POC**: Gmail reading via Discord DM confirmed working (see [`Ideation/07-timeline.md`](../../Ideation/07-timeline.md))
- **Architecture validated**: OpenClaw delegate node routing between Email and Calendar/Meet agents is functioning
- **Channel validated**: Discord Bot API resolves all timing issues that made WhatsApp unviable (408 timeouts, cold-start delays)

**Validation targets (fill in after Timeline Day 10):**
- End-to-end completion: `__/__ DL testers completed all 3 scenarios without errors`
- Time comparison: `Omnio avg __ min vs. manual app-switching avg __ min per task`
- Confirmation overhead: `__ % of tasks required >1 clarifying exchange before execution`
- Error/abort rate: `__ % of attempts abandoned or resulted in wrong action`

## Key Assumptions

1. Natural language alone is sufficient to express email, scheduling, and Meet intents accurately enough for the agent to act on
2. The confirmation-before-action pattern eliminates the trust barrier to letting an AI manage professional communications
3. Discord DM is an acceptable — and even preferred — command surface for professionals already in Discord
4. Per-user container isolation with Google OAuth is sufficient for data privacy at POC scale

## Invalidation Criteria

- Users find the confirmation overhead slower than doing the task manually in the native app
- Natural language is too ambiguous for scheduling and email intents — too many clarifying questions required
- Discord DM is not an acceptable interface for professional contexts (i.e., users won't DM a bot for work tasks)
- Google API rate limits or OAuth complexity make per-user isolation impractical at even small scale

---

## Sources

- [`Ideation/01-project-overview.md`](../../Ideation/01-project-overview.md) — Problem, Solution, Goal, Phase
- [`Ideation/02-user-scenarios.md`](../../Ideation/02-user-scenarios.md) — Key Behavior Rules
- [`Ideation/07-timeline.md`](../../Ideation/07-timeline.md) — POC progress and Definition of Done
- [`LEARNINGS.md`](../../LEARNINGS.md) — Channel decision (WhatsApp → Discord), technical validation
