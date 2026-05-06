---
name: contact-lookup
description: Resolve a person's name to their Google Workspace email using the directory. Always run before asking the user for an email address.
---

# contact-lookup

When a person's name is mentioned without an email address, **always look up the directory first** before asking the user. Never ask "what's their email?" without attempting a lookup.

## When to Use

Trigger this lookup whenever you need an email address and only have a name:
- Calendar: "schedule with Nameer", "add Haseeb to the meeting", "invite Sara"
- Email: "email Ahmed", "forward to Bilal"
- Any action requiring a recipient that was given by name only

## Command

```bash
gog people search "{name}" -a {USER_EMAIL} -j --results-only --max=5 --fail-empty
```

- `-a {USER_EMAIL}` — scope to the requesting user's Google account (from `[user_email:]` prefix)
- `--fail-empty` — exits with code 3 when no results (vs 0 for empty array)
- `--max=5` — limit to 5 results to keep disambiguation manageable

**Auth note:** Requires `people` scope in gog auth. If the command returns `insufficient permissions`, prompt the user to re-authenticate:
```bash
gog auth add {USER_EMAIL} --services gmail,calendar,people --client omnio --no-input
```

## Output Shape

```json
[
  {
    "resourceName": "people/c123456",
    "names": [{ "displayName": "Nameer Ahmed", "givenName": "Nameer", "familyName": "Ahmed" }],
    "emailAddresses": [{ "value": "nameer@disrupt.com", "type": "work" }],
    "organizations": [{ "title": "Software Engineer", "name": "Disrupt Labs" }]
  }
]
```

Extract: `names[0].displayName` and `emailAddresses[0].value`.

## Resolution Rules

### Unique match (1 result)

Surface for confirmation before using:
```
Found Nameer Ahmed (nameer@disrupt.com). Use this address?
```
Wait for "yes" / "go ahead" before proceeding. On denial, ask for the email manually.

### Multiple matches (2–5 results)

Present a numbered list:
```
Found multiple people named "Nameer":
1. Nameer Ahmed — nameer@disrupt.com (Software Engineer)
2. Nameer Khan — nameer.k@disrupt.com (Designer)

Which one?
```
Wait for selection. Then confirm before using.

### No match (exit code 3 or empty array)

Fall back to asking:
```
I couldn't find "[name]" in the directory. What's their email address?
```

### Command failure (auth error, network, quota)

Fall back silently to asking — do not block the user's task:
```
Directory lookup unavailable — what's [name]'s email address?
```

## Notes

- Always confirm the resolved email with the user before using it — never silently assume
- Include job title in disambiguation lists to help the user pick the right person
- If the user confirms the wrong person and catches it, re-run with a more specific query
