# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hachiko is a Slack-triggered always-on engineering agent for a hackathon (Cursor Guild). It watches a Slack channel, detects a specific price-change request (e.g., "$15 should be $20"), confirms with the user, edits a known file in a demo GitHub repo, opens a real pull request, and posts the PR link back into the Slack thread.

**Track:** Always-On Agents
**Tagline:** Hachiko waits in team chat and turns requests into PRs.

## Architecture

```
Slack message
  → Bolt event listener (Socket Mode)
  → request matcher / classifier
  → confirmation handler (in-thread Yes/No)
  → repo worker (edit target file)
  → GitHub PR creation (branch, commit, push, open PR)
  → Slack thread update (post PR link)
```

### Team Responsibilities (3-person split)

- **Person 1 (Slack Flow):** Slack app setup, event intake, confirmation flow, thread replies. See `docs/person-1-slack-flow.md`.
- **Person 2 (GitHub Pipeline):** File edit logic, branch/commit/push, PR creation, returns PR metadata. See `docs/person-2-github-pr.md`.
- **Person 3 (Demo & Positioning):** Demo script, submission materials, judge-facing copy. See `docs/person-3-demo-docs.md`.

### Integration Contract

Person 1 calls a function/endpoint owned by Person 2 after Slack confirmation. Person 2 returns `{ prUrl, prNumber, branchName, summary }`.

## Tech Stack

- **Slack:** Bolt for JS/TS, Socket Mode, permissions: `app_mentions:read`, `chat:write`
- **GitHub:** GitHub API (branch creation, commits, PR opening) against a small demo repo
- **Backend:** Node.js

## MVP Scope (Intentionally Narrow)

- One Slack trigger pattern: price change detection
- One demo repo, one target file, one value change (`15 → 20`)
- Explicit confirmation required before acting
- PR-only output (no auto-merge)
- Branch naming: `hachiko/update-price-15-to-20`

## Demo Repo Structure

```
demo-site/
  index.html
  style.css
  script.js    ← target file (contains `const price = 15;`)
```

## Key Design Decisions

- Socket Mode eliminates the need for a public HTTP endpoint
- Deterministic execution: the edit is hardcoded for the demo, not a general-purpose code editor
- All bot replies stay in the originating Slack thread
- Duplicate execution prevention per thread
