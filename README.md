# Hachiko

### The teammate who never leaves the chat.

Hachiko is an **always-on Slack agent** that listens for code change requests, confirms intent, edits the code in GitHub, opens a pull request, and posts the result — all inside the same Slack thread.

Like its namesake — the loyal dog who waited patiently every day — Hachiko sits in your team's channel, ready the moment someone asks.

---

## The Problem

Small changes get discussed in chat constantly:

> *"The website still shows $15, but we changed it to $20."*

This is a 30-second fix. But someone still has to:

1. See the message
2. Context-switch out of what they're doing
3. Open the repo
4. Find the right file
5. Make the edit
6. Create a branch
7. Commit and push
8. Open a PR

That's 8 steps and 10+ minutes of engineering time for a one-line change.

**Multiply that by every small request that starts in chat, every day.**

## The Solution

Hachiko compresses the entire workflow into one conversation:

```
Slack message  -->  Confirmation  -->  Code change  -->  Pull request  -->  Slack update
```

No context switching. No waiting. The team reports the issue where they already work, and Hachiko handles the rest.

---

## Demo Flow

```
Teammate    "The website still shows $15, but we changed it to $20."

Hachiko     "I can update that and open a pull request. Proceed?"

Teammate    "Yes"

Hachiko     "Starting now."

Hachiko     "Done. Pull request created: https://github.com/..."
             Summary: updated homepage price from $15 to $20.
```

---

## Why This Matters

### Workflow Value

| Without Hachiko | With Hachiko |
|-----------------|-------------|
| Someone notices an issue in Slack | Someone notices an issue in Slack |
| An engineer picks it up manually | Hachiko detects the request |
| Opens repo, finds file, makes edit | Hachiko asks for confirmation |
| Creates branch, commits, pushes | Hachiko creates the PR |
| Opens a PR | PR link appears in the same thread |
| **~10 minutes, 8 steps** | **~30 seconds, 1 reply** |

### Always-On Agent

Hachiko is not a one-off script or a chatbot that answers questions. It is a **persistent, event-driven automation** that:

- Stays running and available at all times
- Is triggered by real Slack messages — not manual invocation
- Performs actual engineering work — not just conversation
- Produces a real artifact — a GitHub pull request

### Reliability by Design

Trust comes from restraint:

- **Confirmation required** — always asks before acting, never assumes
- **PR-only output** — creates reviewable pull requests, never auto-merges
- **Bounded scope** — works in one known repo with predictable changes
- **Deterministic execution** — same request always produces the same result
- **Duplicate prevention** — ignores repeated confirmations in the same thread

### Technical Execution

```
Slack (Socket Mode)          LLM Classifier           GitHub App
      |                          |                        |
  message received       classify intent            create branch
      |                   extract prices             update file
  thread reply         { oldPrice, newPrice }     commit change
      |                      or null                 open PR
  confirmation                |                   return PR URL
      |                       |                        |
      +------------- state machine ------------------- +
                    (in-memory thread tracking)
```

**Stack:** Node.js, Slack Bolt, OpenAI API, Octokit, GitHub App Auth

---

## Architecture

```
src/
  app.js              Bolt app + Socket Mode — wires everything together
  classifier.js       LLM classifier — understands natural language intent
  confirmation.js     Thread state machine — tracks conversation flow
  messages.js         Bot message templates — consistent, clean replies
  github-auth.js      GitHub App auth — JWT + installation tokens
  github-pipeline.js  PR pipeline — branch, edit, commit, open PR
  config.js           Environment configuration
```

### State Machine

Every Slack thread moves through a strict state flow:

```
IDLE  -->  AWAITING_CONFIRMATION  -->  PROCESSING  -->  DONE
                                           |
                                         ERROR
```

This prevents duplicate execution, handles failures gracefully, and keeps each thread self-contained.

---

## Quick Start

### Prerequisites

- Node.js 18+
- Slack App with Socket Mode
- GitHub App with repository access
- OpenAI API key

### Setup

```bash
git clone https://github.com/terdessa/hachiko.git
cd hachiko
npm install
cp .env.example .env
```

### Configure `.env`

```env
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
OPENAI_API_KEY=sk-...
SLACK_CHANNEL_ID=C...
GITHUB_APP_ID=...
GITHUB_APP_INSTALLATION_ID=...
GITHUB_APP_PRIVATE_KEY_PATH=./your-key.pem
GITHUB_OWNER=your-org
GITHUB_REPO=your-repo
GITHUB_TARGET_FILE=src/price.js
```

### Run

```bash
node src/app.js
```

```
GitHub App authenticated
Hachiko is running (Socket Mode)
```

### Test

```bash
npm test   # 22 tests across 5 suites
```

---

## Slack App Setup

1. Create app at [api.slack.com/apps](https://api.slack.com/apps)
2. Enable **Socket Mode** — create app-level token with `connections:write`
3. Add bot scopes: `app_mentions:read`, `chat:write`, `channels:history`
4. Subscribe to event: `message.channels`
5. Install to workspace, invite bot to channel

## GitHub App Setup

1. Create app at [github.com/settings/apps](https://github.com/settings/apps)
2. Permissions: **Contents** (Read & Write), **Pull Requests** (Read & Write)
3. Install on target repository
4. Download private key `.pem` to project root

---

## Vision

The current demo handles price updates — intentionally narrow to prove the loop works. The architecture is designed to expand to any small, well-bounded code change:

- Copy and content updates
- Configuration changes
- Simple code fixes
- Dependency version bumps
- Documentation edits

The pattern stays the same: **chat request, confirmation, code change, pull request.**

---

## Design Principles

| Principle | Why |
|-----------|-----|
| **Chat-native** | Works where the team already communicates |
| **Always-on** | Triggered by real events, not manual runs |
| **Confirmation-first** | Asks before acting — builds trust |
| **PR-only** | Never auto-merges — always reviewable |
| **Narrow and reliable** | Does less, does it well |

---

*Built for the Cursor Guild Hackathon*
*Track: Always-On Agents | Side Quest: Best Developer Tool*
