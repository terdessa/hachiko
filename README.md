# Hachiko

**A Slack bot that turns price-change requests into GitHub pull requests.**

Like its namesake — the loyal dog who waited patiently every day — Hachiko sits in your Slack channel, waiting for the moment it can help.

---

```
Teammate:  "The website still shows $15, but we changed it to $20."
Hachiko:   "I can update that and open a pull request. Proceed?"
Teammate:  "Yes"
Hachiko:   "Starting now."
Hachiko:   "Done. Pull request created: https://github.com/..."
```

---

## How It Works

```
Slack message
  → LLM classifier (detects price-change intent)
  → Confirmation prompt (in-thread)
  → "Yes" received
  → GitHub: create branch → edit file → commit → open PR
  → Post PR link back to Slack thread
```

Hachiko uses an LLM to understand natural language — no rigid command syntax. It extracts the old and new prices from conversational messages, confirms before acting, and creates a real, reviewable pull request.

## Quick Start

### Prerequisites

- Node.js 18+
- A Slack workspace with a configured Slack App ([setup guide](#slack-app-setup))
- A GitHub App with repository access ([setup guide](#github-app-setup))
- An OpenAI API key

### Install

```bash
git clone https://github.com/terdessa/hachiko.git
cd hachiko
npm install
cp .env.example .env
```

### Configure

Edit `.env` with your credentials:

```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
OPENAI_API_KEY=sk-...
SLACK_CHANNEL_ID=C...
GITHUB_APP_ID=...
GITHUB_APP_INSTALLATION_ID=...
GITHUB_APP_PRIVATE_KEY_PATH=./your-key.pem
GITHUB_OWNER=your-org
GITHUB_REPO=your-demo-repo
GITHUB_TARGET_FILE=src/price.js
```

### Run

```bash
node src/app.js
```

```
✅ GitHub App authenticated
⚡ Hachiko is running (Socket Mode)
```

### Test

```bash
npm test
```

## Architecture

```
src/
  app.js              # Bolt app + Socket Mode, wires everything together
  classifier.js       # LLM-based message classifier (OpenAI)
  confirmation.js     # Thread state machine
  messages.js         # Bot message templates
  github-auth.js      # GitHub App authentication
  github-pipeline.js  # Branch → edit → commit → PR pipeline
  config.js           # Environment configuration
```

| Component | Responsibility |
|-----------|---------------|
| **Classifier** | Sends every message to GPT-4o-mini to determine if it's a price-change request. Returns `{ oldPrice, newPrice }` or `null`. |
| **State Machine** | Tracks each thread through `IDLE → AWAITING_CONFIRMATION → PROCESSING → DONE/ERROR`. Prevents duplicate execution. |
| **GitHub Pipeline** | Creates a branch, replaces the price value in the target file, commits, and opens a PR. Handles branch cleanup for demo reruns. |

## Slack App Setup

1. Create a new app at [api.slack.com/apps](https://api.slack.com/apps)
2. Enable **Socket Mode** and create an app-level token with `connections:write`
3. Add bot token scopes: `app_mentions:read`, `chat:write`, `channels:history`
4. Subscribe to events: `message.channels`
5. Install the app to your workspace
6. Invite the bot to your demo channel

## GitHub App Setup

1. Create a GitHub App at [github.com/settings/apps](https://github.com/settings/apps)
2. Grant **Repository permissions**: Contents (Read & Write), Pull Requests (Read & Write)
3. Install the app on your target repository
4. Download the private key `.pem` file to the project root

## Design Decisions

- **Socket Mode** — no public endpoint needed, works behind firewalls
- **LLM classification** — understands natural language, not just exact command strings
- **GPT-4o-mini for classification** — fast, cheap, reliable for this narrow task
- **In-memory state** — simple `Map` for thread tracking, no database needed for demo
- **PR-only output** — never auto-merges, always creates a reviewable artifact
- **Branch cleanup** — deletes and recreates branches so the demo can be run repeatedly
- **Confirmation required** — always asks before acting, building trust

## What Hachiko Does Not Do

- Handle arbitrary tasks
- Search or understand any codebase
- Auto-merge changes
- Replace engineers

This is intentional. Hachiko is narrow, reliable, and trustworthy — by design.

---

*Built for the Cursor Guild Hackathon — Always-On Agents track.*
