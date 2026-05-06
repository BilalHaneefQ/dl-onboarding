# Proposal: contact-lookup

## Problem

When a user mentions a person by name without an email address ("schedule with Nameer", "add Haseeb to the meeting"), the agent falls back to asking for the email instead of looking it up. The Google Workspace directory is available via `gog people search <name>` but the agent doesn't know to use it first.

Source: `Ideation/PLAN.md` Gap 1.

## Solution

Create a dedicated `contact-lookup` skill (`skills/contact-lookup/SKILL.md`) that:
1. Defines the `gog people search <name> -j --results-only` command
2. Documents the output format (name, email, job title)
3. Instructs the agent: always search before asking for an email when a person's name is given

The skill is installed into the main agent's workspace so it applies to email-agent, calendar-agent, and orchestrator turns alike.

## Scope

**In scope:**
- `gog people search <name>` — look up by display name or partial match
- Return top result's email when unique; ask to clarify when multiple matches
- Apply to any context where an email is needed (calendar attendees, email recipients)
- Per-user scoping: include `-a {user_email}` flag

**Out of scope:**
- Creating or updating contacts — read-only lookup only
- Phone number or photo lookup — email only
- External (non-Workspace) contacts — Workspace directory only

## Risks

1. **Multiple matches** — "Nameer" could match several people; disambiguation needed
2. **No match** — person not in Workspace directory; fall through to asking for email
3. **gog people auth scope** — requires `people` service in gog auth; current auth may only have `gmail,calendar` — may need re-auth with `--services gmail,calendar,people`
