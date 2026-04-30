# User Personas

> Part of the **Omnio** Product Constitution
> **Tier:** Extended — adopted because Omnio has a clear primary user type with distinct workflow patterns.

**Last amended:** 2026-04-30

---

## Persona: The Disrupt Labs Professional

| Attribute | Detail |
|-----------|--------|
| **Role** | Engineer, product manager, or team lead at Disrupt Labs |
| **Goals** | Handle email, scheduling, and meeting setup without leaving their current context |
| **Pain Points** | Constant app-switching between Gmail, Google Calendar, and Google Meet for routine tasks; interrupted focus blocks |
| **Current Workflow** | Opens Gmail in browser → replies to emails; opens Calendar → reschedules meetings; opens Meet → creates links; each step is a separate tab and context switch |
| **Success Metric** | Can complete the three core workflows (check/reply email, reschedule meeting, create meeting + Meet link) entirely within a Discord DM in under 2 minutes each |
| **Technical Comfort** | High — comfortable with Discord, OAuth flows, and CLI tools |
| **Frequency of Use** | Daily — email and calendar tasks happen multiple times per workday |

### Scenarios

1. **Email triage during a meeting**: User is in a meeting and receives an email notification they need to acknowledge. They DM Omnio from their phone, get a summary of unread emails, reply to the urgent one, and return to the meeting — without opening Gmail.

2. **Reschedule under pressure**: A stakeholder pings asking to move a meeting. User DMs Omnio "reschedule my 3pm today to tomorrow 4pm" — Omnio confirms the event name and attendees, updates it, and notifies them. Done in one exchange.

3. **Spin up a last-minute Meet**: Team decides to have an ad-hoc call. User DMs "set up a meeting in 10 minutes with ahmed and sara and send them a Meet link" — Omnio checks availability, creates the event with a Meet link, and sends invites. No browser needed.

---

## Persona: The Future Self-Serve User (Post-POC)

| Attribute | Detail |
|-----------|--------|
| **Role** | Any professional invited to the Omnio Discord server post-POC |
| **Goals** | Connect their own Google account and get personal productivity automation |
| **Pain Points** | Setup friction — OAuth flows, bot invitations, understanding what the agent can do |
| **Current Workflow** | Same as above but without internal DL access |
| **Success Metric** | Self-serves from Discord invite → Google OAuth → first successful agent action in under 3 minutes |
| **Technical Comfort** | Medium — comfortable with OAuth consent screens and Discord, but not CLI tools |
| **Frequency of Use** | Daily |

### Scenarios

1. **Onboarding**: Clicks Discord invite link → DMs Omnio bot → receives OAuth link → clicks "Connect Google" → agent is live. No QR scan, no support ticket.

---

## Sources

- [`Ideation/02-user-scenarios.md`](../../Ideation/02-user-scenarios.md) — All three scenario workflows map directly to the primary persona's day-in-the-life
- [`Ideation/08-scaling-plan.md`](../../Ideation/08-scaling-plan.md) — Post-POC user onboarding flow (self-serve persona)
- [`Ideation/01-project-overview.md`](../../Ideation/01-project-overview.md) — Target user description
