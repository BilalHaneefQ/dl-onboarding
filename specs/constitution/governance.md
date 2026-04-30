# Governance

> Part of the **Omnio** Product Constitution
> **Tier:** Extended — adopted because code review and change management already involve multiple named decision-makers (CODEOWNERS).

**Last amended:** 2026-04-30

---

## Decision Authority

| Decision Type | Authority | Process |
|--------------|-----------|---------|
| Feature scope changes | Bilal Haneef (builder) + DL reviewers | Proposal via SDD cycle (`/sdd:start`); reviewed on PR |
| Architecture changes | Bilal Haneef + required CODEOWNERS | SDD cycle with spec-delta; all three reviewers must approve |
| Constitution amendments | Bilal Haneef | `/vkf/amend` tiered process (C0–C3 based on scope) |
| Tech stack changes (core) | Bilal Haneef + CODEOWNERS | SDD proposal required; annotate in `Ideation/04-tech-stack.md` |
| Tech stack changes (tooling) | Bilal Haneef | No cycle needed; document in `LEARNINGS.md` |
| Scope cut (POC Definition of Done) | Bilal Haneef | Update `Ideation/07-timeline.md`; log in `learnings.yaml` |

## Code Review

CODEOWNERS is configured in `.github/CODEOWNERS`. All PRs require approval from:
- `@salmanulhaq-dl`
- `@ilian-disrupt`
- `@mobeendisrupt`

CI validates STD-002 structural compliance on every PR (`.github/workflows/validate-std002.yml`).

## Amendment Process

Constitution changes follow the VKF amendment tiers:

| Tier | Scope | Process |
|------|-------|---------|
| C0 | Typo, formatting, link fix | Direct commit, no announcement needed |
| C1 | Adding new content to an existing section | Commit with `[constitution]` prefix; note in PR description |
| C2 | Substantive change to meaning of a section | `/vkf/amend` flow; announce tier before editing; CODEOWNERS review |
| C3 | Strategic shift (mission, PMF thesis, principles) | `/vkf/amend` flow; required discussion before PR; all CODEOWNERS must approve |

Never bypass tiers — even if the change feels small. The tier announcement creates a shared understanding of how significant the change is.

## Amendment History

| Date | File | Change | Author | Tier |
|------|------|--------|--------|------|
| 2026-04-30 | All | Initial synthesis from Ideation/ docs via `/vkf/init` | Bilal Haneef | C1 |

---

## Sources

- [`.github/CODEOWNERS`](../../.github/CODEOWNERS) — Required reviewers
- [`.github/workflows/validate-std002.yml`](../../.github/workflows/validate-std002.yml) — CI compliance gate
- [`CLAUDE.md`](../../CLAUDE.md) — Amendment tier definitions and SDD routing rules
