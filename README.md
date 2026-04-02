# Hachiko

**The teammate who never leaves the chat.**

Hachiko is an always-on Slack agent that listens for small code change requests, confirms intent, makes the edit in GitHub, opens a pull request, and posts the result back — all inside the same thread.

Like its namesake — the loyal dog who waited patiently every day — Hachiko sits in your team's Slack, ready to help the moment someone asks.

---

## The Problem

Small changes get discussed in chat all the time:

> "The website still shows $15, but we changed it to $20."
>
> "Can someone update the banner text? It still says 'Summer Sale'."
>
> "The footer copyright year is wrong."

These are trivial fixes. But someone still has to context-switch, open the repo, find the file, make the edit, create a branch, commit, push, and open a PR.

That friction adds up. The fix sits in chat, waiting.

## The Solution

Hachiko compresses that entire workflow into one conversation:

```
Slack message → confirmation → code change → pull request → Slack update
```

The team reports the issue where they already work. Hachiko asks for confirmation, makes the change, opens a PR for human review, and posts the link. No context switching. No waiting.

---

## Demo

The current version demonstrates the core loop with a price-change scenario:

```
Teammate:  "The website still shows $15, but we changed it to $20."
Hachiko:   "I can update that and open a pull request. Proceed?"
Teammate:  "Yes"
Hachiko:   "Starting now."
Hachiko:   "Done. Pull request created: https://github.com/..."
```

This is a working proof of concept — intentionally narrow to show that the loop works reliably end to end.

## Vision

The price-change demo is just the starting point. Hachiko is designed to grow into a general-purpose Slack-to-PR agent that handles any small, well-bounded code change:

- **Copy and content updates** — text changes, translations, labels
- **Configuration changes** — feature flags, environment values, API endpoints
- **Simple code fixes** — typos, wrong constants, outdated references
- **Dependency updates** — version bumps requested by the team
- **Documentation edits** — README updates, changelog entries

The pattern is always the same: someone describes what needs to change in natural language, Hachiko understands the intent, confirms, edits the right file, and opens a PR.

Future versions will use deeper codebase understanding to find the right file automatically, support multiple repositories, and handle more complex multi-file changes — all while keeping the human-in-the-loop confirmation that makes it trustworthy.

---

## Quick Start

### Prerequisites

- Node.js 18+
- A Slack App with Socket Mode ([setup guide](#slack-app-setup))
- A GitHub App with repository access ([setup guide](#github-app-setup))
- An OpenAI API key

### Install & Run

```bash
git clone https://github.com/terdessa/hachiko.git
cd hachiko
npm install
cp .env.example .env   # fill in your credentials
node src/app.js
```

```
✅ GitHub App authenticated
⚡ Hachiko is running (Socket Mode)
```

### Test

```bash
npm test   # 22 tests
```

## Architecture

```
Slack message
  → LLM classifier (understands natural language intent)
  → Confirmation prompt (in-thread)
  → "Yes" received
  → GitHub: create branch → edit file → commit → open PR
  → Post PR link back to Slack thread
```

```
src/
  app.js              # Bolt app + Socket Mode, wires everything
  classifier.js       # LLM-based message classifier (OpenAI)
  confirmation.js     # Thread state machine
  messages.js         # Bot message templates
  github-auth.js      # GitHub App authentication
  github-pipeline.js  # Branch → edit → commit → PR pipeline
  config.js           # Environment configuration
```

## Slack App Setup

1. Create a new app at [api.slack.com/apps](https://api.slack.com/apps)
2. Enable **Socket Mode** — create an app-level token with `connections:write`
3. Add bot token scopes: `app_mentions:read`, `chat:write`, `channels:history`
4. Subscribe to events: `message.channels`
5. Install to your workspace and invite the bot to your channel

## GitHub App Setup

1. Create a GitHub App at [github.com/settings/apps](https://github.com/settings/apps)
2. Grant permissions: **Contents** (Read & Write), **Pull Requests** (Read & Write)
3. Install on your target repository
4. Download the private key `.pem` file to the project root

## Design Principles

- **Chat-native** — works where the team already communicates
- **Always-on** — triggered by real events, not manual invocation
- **Confirmation-first** — always asks before acting
- **PR-only output** — never auto-merges, always creates a reviewable artifact
- **Narrow and reliable** — does less, but does it well

---

*Built for the Cursor Guild Hackathon — Always-On Agents track.*
