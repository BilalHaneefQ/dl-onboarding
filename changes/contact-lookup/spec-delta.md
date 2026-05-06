# Spec Delta: contact-lookup

> This delta merges into `specs/features/contact-lookup/spec.md` on `/sdd:complete`.

## ADDED

### Contact Lookup — Name to Email Resolution

**Given** any agent receives a request that includes a person's name without an email address (e.g., "add Nameer", "schedule with Haseeb", "email Sara")
**When** the agent needs an email address to proceed
**Then** the agent runs `gog people search "{name}" -a {user_email} -j --results-only` before asking the user for an email
**And** does not ask "what's their email?" until the directory lookup has been attempted

**Given** the directory search returns exactly one result
**When** the agent presents the match to the user for confirmation
**Then** the agent says: "Found Nameer Ahmed (nameer@disrupt.com). Use this address?" and waits for confirmation before proceeding
**And** uses the confirmed email for the calendar/email action

**Given** the directory search returns multiple matches
**When** the agent cannot uniquely identify the person
**Then** the agent presents a numbered list: "Found multiple people named Nameer: 1. Nameer Ahmed (nameer@disrupt.com) 2. Nameer Khan (nameer.k@disrupt.com) — which one?"
**And** waits for the user to select before proceeding

**Given** the directory search returns no results
**When** the name is not found in the Workspace directory
**Then** the agent falls back to asking: "I couldn't find [name] in the directory. What's their email address?"
**And** uses the user-provided email for the action

**Given** the `gog people search` command fails (auth error, quota, network)
**When** the command returns a non-zero exit code
**Then** the agent falls back to asking for the email directly, noting: "Directory lookup unavailable — what's [name]'s email address?"
**And** the error does not block the user's primary task

## MODIFIED

### Orchestrator — Attendee Resolution (in omnio skill)

**Before:** When user says "add Ahmed" and email is unknown, orchestrator asks "What's Ahmed's email address?"
**After:** When user says "add Ahmed" and email is unknown, orchestrator first runs `gog people search "Ahmed"` and presents the result for confirmation before asking

### Calendar Agent — Attendee Resolution (in gcal skill)

**Before:** Attendee resolution — "Ask for email if display name only, never guess"
**After:** Attendee resolution — "Run `gog people search` first; only ask for email if no directory match found or search fails"

### Email Agent — Recipient Resolution (in gmail skill)

**Before:** (no explicit name-to-email resolution defined)
**After:** When user says "email [name]" without an address, run `gog people search "{name}"` before asking for email

## REMOVED

(None)
