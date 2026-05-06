# Email Agent

OpenClaw specialist agent for Gmail — handles check / draft / confirm-send via Discord DM.

## Registration

Registered in OpenClaw via `agents.list` in `~/.openclaw/openclaw.json`:

```json
{
  "id": "email-agent",
  "workspace": "/home/bilal/sites/dl-onboarding/agents/email-agent/workspace",
  "agentDir": "/home/bilal/.openclaw/agents/email-agent/agent",
  "agentRuntime": { "id": "claude-cli" }
}
```

To verify: `openclaw agents list --json`
To invoke directly: `openclaw agent --agent email-agent --message "check my emails"`

## Workspace

`workspace/` — contains `AGENTS.md` (system prompt, identity, rules).
`prompt.md` — version-controlled source; copy to `workspace/AGENTS.md` if the workspace is reset.

## Re-register after reset

```bash
openclaw config set --batch-file agents/email-agent/register.json
```

See `register.json` for the full batch config.
