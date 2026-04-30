# User Scenarios

All interactions happen through a single Discord DM with the Omnio bot. The agent always confirms before taking any action.

---

## Scenario 1 — Check & Reply to Email

1. User: "Check my emails"
2. Agent fetches unread Gmail, summarizes them
3. Agent: "You have 3 unread emails. 1. John — Re: Project proposal. 2. HR — Leave policy. 3. Client X — Invoice. Which one?"
4. User: "Reply to John"
5. Agent reads full thread, drafts a context-aware reply using LLM
6. Agent: "Here's a draft reply to John: '...' — Should I send this?"
7. User: "Yes"
8. Agent sends the email via Gmail API

---

## Scenario 2 — Reschedule a Meeting

1. User: "Reschedule my 3pm meeting today to tomorrow 4pm"
2. Agent fetches the event from Google Calendar
3. Agent: "Found 'Product Sync' at 3pm with Ahmed, Sara, Bilal. Reschedule to tomorrow 4pm and notify them?"
4. User: "Yes"
5. Agent updates the event, keeps the Meet link, Gmail notifies all attendees

---

## Scenario 3 — Create a New Meeting

1. User: "Set up a meeting tomorrow at 2pm, add ahmed@company.com and sara@company.com"
2. Agent checks availability at 2pm tomorrow
3. Agent: "You're free at 2pm. Creating meeting with Ahmed and Sara. Add a Google Meet link?"
4. User: "Yes"
5. Agent creates the Calendar event, generates Meet link, sends invites to attendees

---

## Key Behavior Rules

- Nothing executes without user confirmation
- Agent remembers context within the same conversation
- If unsure, agent asks a clarifying question rather than guessing
- All data stays on the user's machine/VPS
