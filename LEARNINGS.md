# Learnings — Mistakes, Blockers & What Actually Worked

A running log of everything that failed, why it failed, and how we resolved it.
Useful for anyone setting this up again or onboarding a new dev.

---

## 1. Node.js Version — Wrong Version in PATH

**What happened:** Ran `openclaw init` after installing OpenClaw — got error saying Node v22.12+ required, current v20.11.1.

**Why:** `nvm install 22` was run but the terminal session didn't switch to it. The shell was still using the system Node v20.

**What we tried:** Just running `openclaw` again — still failed.

**Fix:** Had to explicitly run:
```bash
nvm use 22
nvm alias default 22
```
Every new terminal session needs `nvm use 22` unless the alias is set.

**Lesson:** Always verify `node --version` after installing via nvm. Set `nvm alias default 22` permanently so new terminals pick it up.

---

## 2. `openclaw init` — Command Not Found

**What happened:** Ran `openclaw init` — got `error: unknown command 'init'`.

**Why:** OpenClaw 2026 doesn't have an `init` command. The correct first-run command is just `openclaw` or `openclaw onboard`.

**Fix:** Run `openclaw` to enter the interactive TUI, then type `setup`.

**Lesson:** Don't assume command names from older docs or tutorials. Always check `openclaw --help` first.

---

## 3. Gateway Failing to Start via systemd

**What happened:** `openclaw gateway start` kept showing `Gateway service disabled` or `Runtime: stopped (state failed)`.

**Why:** The systemd service was installed but it used the system Node (`/usr/bin/node` = v12) instead of the nvm Node (v22). systemd doesn't load the user's shell profile or nvm, so it can't find the right Node version.

**What we tried:**
- `openclaw gateway start` — failed
- `openclaw gateway install` then `start` — failed  
- `openclaw doctor --repair` — partially helped but didn't fully fix
- `openclaw config set gateway.mode local` — needed but not sufficient alone

**Fix:** Stop the systemd service entirely and run the gateway directly in a terminal:
```bash
systemctl --user stop openclaw-gateway.service
~/.nvm/versions/node/v22.22.2/bin/node ~/.nvm/versions/node/v22.22.2/lib/node_modules/openclaw/dist/index.js gateway --port 18789
```
Keep this terminal open — gateway runs in foreground.

**Lesson:** On Linux with nvm, never use systemd for the OpenClaw gateway. Always run it directly with the full nvm node path. Install Node system-wide (not via nvm) if you want systemd to work reliably.

---

## 4. Gateway "Already Running Under systemd" Loop

**What happened:** After stopping systemd and trying to run gateway directly, kept getting `already running under systemd; waiting 5000ms`.

**Why:** The systemd service was still running in the background even after `gateway stop`.

**Fix:**
```bash
systemctl --user stop openclaw-gateway.service && systemctl --user disable openclaw-gateway.service && pkill -f "openclaw"
```
Then run gateway directly.

**Lesson:** `openclaw gateway stop` doesn't always kill the systemd service. Use `systemctl --user stop` directly.

---

## 5. Corporate Network Blocking WebSocket

**What happened:** Dashboard at `http://127.0.0.1:18789` kept showing `disconnected (1006): no reason`. Browser would just spin.

**Why:** Corporate network was intercepting and blocking WebSocket connections (`ws://`) even on localhost. The same network also broke Docker networking.

**What we tried:** Multiple gateway restarts, `openclaw doctor --fix`, different URLs — all failed on corporate WiFi.

**Fix:** Switched to phone hotspot — dashboard connected immediately. Confirmed corporate network was the blocker.

**Lesson:** OpenClaw gateway uses WebSocket. Corporate networks often block non-standard ports and WebSocket connections. Always test on hotspot or home network. For production, host on a VPS outside the corporate network.

---

## 6. WhatsApp `channel add whatsapp` — Wrong Command

**What happened:** Ran `openclaw channels add whatsapp` — got `error: too many arguments for 'add'`.

**Why:** The correct command for linking WhatsApp is `login`, not `add`.

**Fix:**
```bash
openclaw channels login --channel whatsapp
```

**Lesson:** `add` is for non-interactive channel config. `login` is for channels that require QR/browser auth like WhatsApp.

---

## 7. `openclaw pairing approve` — Wrong Syntax

**What happened:** Ran `openclaw pairing approve VQM9UYYQ` — got error about missing channel argument.

**Why:** The command requires the channel name before the code.

**Fix:**
```bash
openclaw pairing approve whatsapp VQM9UYYQ
```

**Lesson:** Always include the channel name. Format: `openclaw pairing approve <channel> <code>`.

---

## 8. Homebrew Installation Failed — Corporate SSL

**What happened:** Tried to install Homebrew to get `gogcli` — failed with SSL certificate error:
```
curl: (60) SSL certificate problem: self-signed certificate in certificate chain
```

**Why:** Corporate network uses a self-signed SSL certificate for traffic inspection (man-in-the-middle). curl rejects it.

**What we tried:** Standard Homebrew install script — blocked.

**Fix:** Skipped Homebrew entirely. Downloaded pre-built binary directly from GitHub releases page in browser (browser handles the corporate SSL cert, curl doesn't).

**Lesson:** On corporate networks, avoid curl-based installers. Always look for pre-built binaries on GitHub releases as an alternative.

---

## 9. `go install gogcli` — Wrong Package Path

**What happened:** Tried `go install github.com/googleworkspace/cli/cmd/gog@latest` — got `does not contain package`.

**Why:** The package path was wrong. The gog CLI is in a different repo (`steipete/gogcli`), not `googleworkspace/cli`.

**Fix:** Download binary from `https://github.com/steipete/gogcli/releases`.

**Lesson:** Verify the exact GitHub repo before using `go install`. `googleworkspace/cli` and `steipete/gogcli` are different projects.

---

## 10. Building gogcli from Source — Kaspersky Blocked

**What happened:** Tried `git clone + make` to build gogcli from source — Kaspersky antivirus terminated the `make` process.

**Why:** Kaspersky flags compilation of unknown binaries as suspicious and kills the process.

**Fix:** Downloaded pre-built binary from GitHub releases instead. No compilation needed.

**Lesson:** On machines with Kaspersky or corporate antivirus, avoid building from source. Always use pre-built binaries.

---

## 11. gog OAuth — redirect_uri_mismatch Error

**What happened:** Ran `gog auth add bilal.haneef@disrupt.com` — browser opened and showed `Error 400: redirect_uri_mismatch`.

**Why:** We had created the OAuth client as "Web Application" type in Google Cloud Console. The `gog` CLI uses a local redirect URI (`http://127.0.0.1:PORT/oauth2/callback`) which only works with "Desktop app" type clients.

**Fix:** Created a second OAuth client in Google Cloud Console with type **Desktop app**, downloaded its JSON, and ran:
```bash
gog auth credentials ~/Downloads/client_secret_....json
```

**Lesson:** Always use "Desktop app" OAuth client type for CLI tools. "Web Application" is only for server-side web apps.

---

## 12. gog Keyring Timeout

**What happened:** After successful OAuth flow, got:
```
OAuth completed, but saving the refresh token failed: keyring connection timed out after 10s
```
A password popup appeared briefly then vanished.

**Why:** The machine uses D-Bus SecretService for system keyring, which was unresponsive. This is common on Linux machines without a running GNOME Keyring or KWallet session.

**Fix:** Use file-based keyring instead:
```bash
export GOG_KEYRING_BACKEND=file
export GOG_KEYRING_PASSWORD=omnio123
gog auth add bilal.haneef@disrupt.com
```
Then save permanently to OpenClaw config:
```bash
openclaw config set env.GOG_KEYRING_BACKEND file
openclaw config set env.GOG_KEYRING_PASSWORD omnio123
```

**Lesson:** On Linux without full GNOME/KDE desktop session, D-Bus keyring is often unavailable. Always use `GOG_KEYRING_BACKEND=file` for headless or corporate Linux setups.

---

## 13. `openclaw skills install gws-workspace` — ClawHub Rate Limited

**What happened:** Ran `openclaw skills install gws-workspace` — got `429: Rate limit exceeded`.

**Why:** ClawHub has per-IP rate limits. We had been hitting the API repeatedly during troubleshooting.

**Fix:** Waited a few minutes, then installed the simpler `gog` skill instead:
```bash
openclaw skills install gog
```

**Lesson:** If ClawHub rate limits you, wait 5-10 minutes. Don't hammer the endpoint. Install one skill at a time.

---

## 14. WhatsApp Pairing Resets on Every Gateway Restart

**What happened:** After every gateway restart, the approved pairing list was lost. Users had to re-send pairing codes every time.

**Why:** OpenClaw's `pairing` dmPolicy stores approvals in memory, not on disk. Restarting the gateway wipes them.

**Fix:** Switch to `allowlist` dmPolicy and hardcode the user's number:
```bash
openclaw config set channels.whatsapp.dmPolicy allowlist
openclaw config set channels.whatsapp.allowFrom '["923158144251"]'
```

**Lesson:** Never use `pairing` mode for development — use `allowlist` so restarts don't break access.

---

## 15. WhatsApp 408 Timeout — claude-cli Too Slow

**What happened:** Agent received WhatsApp messages but never replied. Gateway logs showed WhatsApp WebSocket dropping with `status=408 Request Time-out` before Claude finished processing.

**Why:** The `claude-cli` runtime has a cold-start delay of 3-10 minutes on first use. WhatsApp Web's session times out after ~3 minutes of inactivity. By the time Claude finished, WhatsApp had disconnected.

**What we tried:** Switching to haiku model (faster), changing dmPolicy, multiple restarts — none fixed it.

**Fix:** Switched from WhatsApp to Discord Bot API entirely. Discord uses a persistent WebSocket with no session timeout.

**Lesson:** WhatsApp + claude-cli is fundamentally incompatible due to timing. Use Discord or Telegram for reliable delivery.

---

## 16. Discord — The Right Channel for This POC

**What happened:** After dropping WhatsApp, switched to Discord Bot API. Bot connected on first try and replied successfully.

**Why it works:**
- Discord uses persistent WebSocket — no 408 timeouts
- Official Bot API — no risk of account bans
- No QR scan, no spare SIM — just a bot token
- DMs work reliably even with claude-cli cold-start

**Setup:**
1. Discord Developer Portal → New Application → Bot → Reset Token
2. Enable: Presence Intent, Server Members Intent, Message Content Intent
3. OAuth2 → URL Generator → scope `bot` → invite to server
4. `openclaw onboard` → select Discord → paste token

**Lesson:** For any AI agent POC, Discord Bot API is the easiest and most reliable channel. Start here, not WhatsApp.

---

## 17. `anthropic` Plugin Disappears Without agentRuntime

**What happened:** Removing `agentRuntime` from OpenClaw config caused the `anthropic` plugin to stop loading. Gateway showed 8 plugins instead of 9.

**Why:** OpenClaw's `anthropic` plugin registration is tied to the `claude-cli` harness being configured. Without `agentRuntime: {"id": "claude-cli"}`, the plugin doesn't register even though it's enabled in `plugins.entries`.

**Fix:** Always keep this in config:
```json
"agentRuntime": {
  "id": "claude-cli"
}
```

**Lesson:** Don't remove `agentRuntime` even when trying to use direct API. The `claude-cli` harness is required for the `anthropic` plugin to load in OpenClaw 2026.4.26.

---

## 18. claude-cli Cold-Start — 10 Minute First Message Delay

**What happened:** First message after gateway restart always timed out after 600 seconds with `CLI produced no output for 600s and was terminated`. OpenClaw retried automatically and the second attempt succeeded in ~38 seconds.

**Why:** The `claude` CLI has a cold-start initialization that hangs on first invocation in OpenClaw's headless context. Second invocation is warm and fast.

**Fix:** After starting the gateway, send one warmup message yourself before users start chatting. This absorbs the cold-start delay.

**Lesson:** Plan for the cold-start. In production, implement a gateway startup hook that sends a warmup prompt automatically.

---

## 19. Direct Anthropic API Runtime Not Available

**What happened:** Set `agentRuntime: {"id": "anthropic"}` hoping to bypass claude-cli and use API key directly — got `Error: Requested agent harness "anthropic" is not registered`.

**Why:** In OpenClaw 2026.4.26, there is no `anthropic` execution harness. The only available harness is `claude-cli`. The `anthropic` plugin handles auth/pricing only, not execution.

**Fix:** Stick with `claude-cli` harness. Set `ANTHROPIC_API_KEY` in env as a fallback but keep `agentRuntime: claude-cli`.

**Lesson:** Don't confuse the `anthropic` plugin (auth/model provider) with the `anthropic` harness (execution engine). The harness doesn't exist in this version.

---

## 20. Alias for Gateway Start Command

The full gateway start command is long. Added an alias to `.bashrc`:
```bash
alias openclaw-start="systemctl --user stop openclaw-gateway.service && pkill -9 -f openclaw 2>/dev/null; sleep 2 && ~/.nvm/versions/node/v22.22.2/bin/node ~/.nvm/versions/node/v22.22.2/lib/node_modules/openclaw/dist/index.js gateway --port 18789"
```

Now just type `openclaw-start` to restart the gateway cleanly.

---

## 21. Intent Classification Table Improved Response Speed and Consistency

**What happened:** Before adding the `omnio` SKILL.md with an intent classification table, the agent was slow and inconsistent — it had to reason from scratch on every message to figure out what the user wanted and which tools to use.

**Why it was slow before:** Claude was rediscovering tools, deciding format, and figuring out intent on every single turn. More reasoning = more tokens = slower responses.

**What we did:** Created `~/.openclaw/workspace/skills/omnio/SKILL.md` with an explicit intent classification table:
- `email` keywords → delegate to `email-agent`
- `calendar` keywords → delegate to `calendar-agent`
- `meet` keywords → delegate to `calendar-agent`
- `unknown` → handle directly

**Result:** Response speed improved significantly. Claude no longer reasons about intent — it reads the table, classifies, delegates. Less thinking = faster replies.

**Also improved consistency:** Before, email list formatting varied. After adding `gmail/SKILL.md` with exact format templates, output is predictable and spec-compliant every time.

**Lesson:** For AI agents, explicit skill files with classification tables and format templates are more reliable and faster than relying on the LLM to figure things out from context alone. Define behavior in skills, don't hope the model infers it correctly.

---

## 22. `gog calendar update --attendees` Silently Wipes Guest List

**What happened:** During the calendar-agent SDD setup phase, we verified exact `gog calendar update` command flags before writing the skill. Discovered that passing `--attendees` during an update **replaces the entire attendee list** — it doesn't append.

**Why it matters:** For a reschedule flow, you only want to change the time. If the skill had blindly passed `--attendees` (even empty), it would silently remove everyone from the meeting every time a user said "reschedule my 3pm to 4pm".

**Wrong approach:**
```bash
gog calendar update primary {eventId} --from "new-time" --to "new-time" --attendees ""
# Wipes ALL attendees from the event
```

**Correct approach:**
```bash
gog calendar update primary {eventId} --from "new-time" --to "new-time" --send-updates all
# Only time changes — attendees untouched, they get notified automatically
```

**How it was caught:** SDD Task 1 (verify gog command signatures) runs before any implementation. This discovery phase prevents bugs from being baked into skill files.

**Lesson:** Always verify exact CLI flag behavior before writing skill files. Flags that sound additive (`--attendees`) can be destructive (replace, not append). Read the `--help` output carefully, especially for update/patch operations.

---

## 23. Spec Missed Crucial CLI Behavior — gog `--remote` State Is In-Memory Only

**What happened:** The `user-google-auth` spec was written assuming `gog auth add --remote --step 1` would persist the OAuth pending state to the keyring between two separate process calls. In reality, gog stores that state **in-memory only** — it dies when the process exits.

**Why the spec was wrong:** The spec was written based on reading the `--remote` flag docs without actually running the two-step flow to verify state persistence. Previous cycles (email-agent, calendar-agent) ran `gog --help` and tested commands manually before speccing. This cycle skipped that verification for the multi-step auth flow.

**What broke:** Every OAuth callback attempt returned "manual auth state mismatch" or "manual auth state missing" because step 2 ran as a new process with no knowledge of step 1's state.

**The fix:** Switched from `--remote --step 1/2` (two separate processes) to `--manual` with a **persistent spawned process** that stays alive between the OAuth start and callback. The server keeps the gog process open, pipes the callback URL to its stdin when Google redirects back.

**Second miss in the same spec:** The spec assumed gog's OAuth URL would be printed to stdout. Reality: `gog --manual` prints the URL to **stderr** in the format `Visit this URL: https://...`. The URL extraction regex had to listen on stderr, not stdout.

**Lesson:** For any multi-step CLI flow involving inter-process state, always run the full sequence manually and observe exact behavior before writing the spec. Don't assume state persistence across separate process invocations — verify it. The SDD setup tasks exist for exactly this reason — use them for auth flows too, not just simple commands.

---

## Summary — Key Environment Gotchas

| Issue | Root Cause | Fix |
|---|---|---|
| Node version wrong | nvm not loaded in new terminals | `nvm use 22 && nvm alias default 22` |
| Gateway won't start | systemd can't find nvm Node | Run gateway directly, not via systemd |
| Dashboard won't connect | Corporate network blocks WebSocket | Use hotspot or VPS |
| Homebrew/curl fails | Corporate SSL inspection | Download binaries directly from GitHub |
| Kaspersky kills make | Antivirus blocks compilation | Use pre-built binaries only |
| gog OAuth fails | Wrong OAuth client type | Use "Desktop app" not "Web Application" |
| gog keyring fails | D-Bus unavailable on Linux | Use `GOG_KEYRING_BACKEND=file` |
| WhatsApp no reply | claude-cli cold-start > WhatsApp timeout | Switch to Discord |
| anthropic plugin missing | agentRuntime not set | Always set `agentRuntime: {"id":"claude-cli"}` |
| First Discord message fails | claude-cli cold-start (600s) | Send warmup message after gateway start |
| anthropic harness not registered | Doesn't exist in OpenClaw 2026 | Use claude-cli harness only |
| Slow/inconsistent agent responses | LLM reasoning from scratch each turn | Add SKILL.md with intent classification table + format templates |
| gog calendar update wipes attendees | `--attendees` replaces, not appends | Omit `--attendees` on reschedule; use `--add-attendee` to add |
| gog --remote step 1/2 fails across processes | State is in-memory, lost on process exit | Use `--manual` with persistent spawned process instead |
| gog --manual URL on stderr not stdout | gog prints auth URL to stderr | Listen on both stdout and stderr for URL extraction |
