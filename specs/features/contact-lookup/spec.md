# Feature Spec: Contact Lookup

**Status:** Active
**Last reviewed:** 2026-05-06
**Cycle landed:** contact-lookup (archive: `archive/contact-lookup/`)

---

## Contact Lookup — Name to Email Resolution

**Given** any agent receives a request that includes a person's name without an email address (e.g., "add Nameer", "schedule with Haseeb", "email Sara")
**When** the agent needs an email address to proceed
**Then** the agent runs `gog people search "{name}" -a {user_email} -j --results-only --max=5 --fail-empty` before asking the user for an email
**And** does not ask "what's their email?" until the directory lookup has been attempted

**Given** the directory search returns exactly one result
**When** the agent presents the match to the user for confirmation
**Then** the agent says: "Found Nameer Ahmed (nameer@disrupt.com). Use this address?" and waits for confirmation before proceeding
**And** uses the confirmed email for the calendar/email action

**Given** the directory search returns multiple matches
**When** the agent cannot uniquely identify the person
**Then** the agent presents a numbered list: "Found multiple people named Nameer: 1. Nameer Ahmed (nameer@disrupt.com) 2. Nameer Khan (nameer.k@disrupt.com) — which one?"
**And** waits for the user to select before proceeding

**Given** the directory search returns no results (exit code 3)
**When** the name is not found in the Workspace directory
**Then** the agent falls back to asking: "I couldn't find [name] in the directory. What's their email address?"
**And** uses the user-provided email for the action

**Given** the `gog people search` command fails (auth error exit 2, quota, network)
**When** the command returns a non-zero exit code other than 3
**Then** the agent falls back to asking for the email directly, noting: "Directory lookup unavailable — what's [name]'s email address?"
**And** the error does not block the user's primary task

---

## Implementation

- **Skill:** `skills/contact-lookup/SKILL.md` — command reference, output schema, all resolution rules
- **Installed:** `~/.openclaw/workspace/skills/contact-lookup/`
- **Applies to:** all agents (orchestrator, email-agent, calendar-agent)
- **Auth note:** requires `people` scope — re-auth with `--services gmail,calendar,people` if needed
- **Exit codes:** 0 = results found, 2 = auth/network error, 3 = no results (`--fail-empty`)
