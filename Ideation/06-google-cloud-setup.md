# Google Cloud Console Setup

## Status: COMPLETE

Done once by the developer. Users only need to do a one-time OAuth browser login.

---

## What Was Set Up

### Project
- Name: `Omnio Agent`
- Project ID: `omnio-agent`

### APIs Enabled
- Gmail API
- Google Calendar API
- Google Meet REST API

### OAuth Consent Screen
- App name: Omnio
- User support email: bilal.haneef@disrupt.com
- Publishing status: Testing (max 100 users before publish)
- User type: External

### OAuth Scopes Added
| Scope | Permission |
|---|---|
| `gmail.send` | Send email on behalf of user |
| `calendar.events` | View and edit calendar events |
| `meetings.space.created` | Create and manage Google Meet conferences |
| `gmail.readonly` | Read email messages |

### OAuth Client (Web Application — for future web flows)
- Type: Web Application
- Name: Omnio OAuth Client
- Credentials: `credentials.json` downloaded and stored locally

### OAuth Client (Desktop App — used by gog CLI)
- Type: Desktop app
- Name: Omnio Desktop
- Credentials: `client_secret_126238724055-6icssqhekgfiu9r95iha7mmnj6edofa8.apps.googleusercontent.com.json`
- Stored at: `~/.config/gogcli/credentials.json`

---

## How Users Connect (Per User — One Time)

1. User clicks "Connect Google" link
2. Google OAuth consent screen appears
3. User logs in with their Google account
4. User clicks Allow
5. Token saved locally in their agent container
6. Access can be revoked anytime from Google Account → Security → Third-party apps

---

## gog CLI Setup (Done)

`gog` is the Google Workspace CLI that OpenClaw uses internally to talk to Gmail, Calendar, Drive etc.

### Installation
- Downloaded pre-built binary: `gogcli_0.14.0_linux_amd64.tar.gz` from GitHub releases
- Installed to `/usr/local/bin/gog`
- Version: `v0.14.0`

### Authentication
- Used file-based keyring (D-Bus SecretService unavailable on this machine)
- Auth command: `gog auth add bilal.haneef@disrupt.com`
- Keyring backend: `file` (set via env var)
- Keyring password: stored in OpenClaw config

### Environment Variables (saved to OpenClaw config)
```
GOG_KEYRING_BACKEND=file
GOG_KEYRING_PASSWORD=omnio123
```
These are permanently saved via:
```bash
openclaw config set env.GOG_KEYRING_BACKEND file
openclaw config set env.GOG_KEYRING_PASSWORD omnio123
```

### Services Authorized
`ads, appscript, calendar, chat, classroom, contacts, docs, drive, forms, gmail, people, sheets, slides, tasks`

---

## Important Notes
- Google Cloud setup is done ONCE by the developer
- Users never touch Google Cloud Console
- Tokens auto-refresh silently after initial login
- Currently in Testing mode — add test user emails in Audience before demoing
- `gog` binary must be present at `/usr/local/bin/gog` on any machine running the agent
