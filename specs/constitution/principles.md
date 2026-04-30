# Product Principles

> Part of the **Omnio** Product Constitution

**Last amended:** 2026-04-30

---

## We Always

1. **Confirm before executing**: Every action that touches external systems (send email, update calendar, create Meet link) requires explicit user confirmation. No silent execution.
2. **Ask, don't guess**: When intent is ambiguous, ask one clarifying question rather than taking the most likely action. A wrong action is worse than a short delay.
3. **Remember context within the session**: The agent carries conversation context across turns in the same Discord DM session. Users should never have to repeat themselves.
4. **Keep data on the user's side**: All Google tokens, agent state, and conversation data stay on the user's machine or VPS. No third-party data routing.

## We Never

1. **Execute without confirmation**: Not even for "safe" reads that trigger writes (e.g., drafting and sending in one shot). Always surface the draft first.
2. **Use fragile channels**: Discord over WhatsApp, pre-built binaries over compiled-from-source, persistent WebSocket over polling. Reliability is non-negotiable for a productivity tool.
3. **Mix user data across containers**: Each user's agent container is fully isolated by Discord user ID. No data crosses between users.

## We Prioritize (Ordered)

1. **Correctness** over speed — a correct, slow reply beats a fast, wrong action
2. **Confirmation** over autonomy — trust is built incrementally; unsupervised execution erodes it
3. **Specialist agents** over monolithic agents — purpose-built > general-purpose for reliability
4. **Persistent channels** over convenient ones — Discord over WhatsApp, VPS over local machine

## Design Tenets

1. **Human-in-the-loop for all writes**: Read operations may proceed unconfirmed; any write (send, create, update, delete) requires a confirmation step.
2. **One interface, all tools**: The Discord DM is the only surface. The agent handles routing — the user should never need to know which Google API is involved.
3. **Graceful ambiguity**: When a request could mean multiple things, surface the options rather than picking one. Clarity > efficiency.
4. **Fail visibly**: If an API call fails, the agent tells the user what failed and why in plain language. No silent failures.

---

## Sources

- [`Ideation/02-user-scenarios.md`](../../Ideation/02-user-scenarios.md) — Key Behavior Rules (the four rules are the direct source of the We Always section)
- [`Ideation/03-architecture.md`](../../Ideation/03-architecture.md) — Multi-agent communication, isolation architecture
- [`LEARNINGS.md`](../../LEARNINGS.md) — WhatsApp → Discord decision (reliability tenet); GOG keyring, binary vs source (fragile channels tenet)
