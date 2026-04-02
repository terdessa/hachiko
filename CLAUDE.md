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

## Agent Workflow

- Use a **multi-agent system**: dispatch parallel subagents for independent tasks and invoke skills (`brainstorming`, `senior-backend`, `test-driven-development`, `systematic-debugging`, etc.) when applicable.
- **All commands allowed** — bash, npm, git, file writes, edits. No permission-asking for standard operations.
- **Don't stop early.** Every task in the plan must be completed, verified, and running before marking done.
- **Before building, ask clarifying questions** about pipeline understanding and architecture decisions. Do not write code until the user confirms.

## Model Usage

- **Opus** — architecture decisions, complex integration logic, classifier design, state machine implementation, debugging
- **Sonnet** — scaffolding, boilerplate, config files, simple file writes, message templates, dependency installation, straightforward CRUD tasks

## Branch Strategy & Merge Guide

Three teammates work on separate branches against `main`:

| Person | Branch | Owns |
|--------|--------|------|
| Person 1 (Mykyta) | `mykyta-dev` | Slack flow, classifier, confirmation, `src/app.js` |
| Person 2 | (their own branch) | GitHub pipeline, `createPriceUpdatePR()` function |
| Person 3 | (their own branch) | Demo docs, submission materials |

### How to merge Person 2 into Person 1

Person 1 uses a stub at `src/github-stub.js`. When Person 2's branch is ready:

1. Merge Person 2's branch into `mykyta-dev` (or both into `main`)
2. In `src/app.js`, replace the stub import:
   ```js
   // BEFORE:
   const { createPriceUpdatePR } = require('./github-stub');
   // AFTER:
   const { createPriceUpdatePR } = require('./github-pipeline');
   ```
3. Person 2's function **must** match this contract:
   ```js
   async function createPriceUpdatePR({ oldPrice, newPrice })
   // Returns: { prUrl: string, prNumber: number, branchName: string, summary: string }
   // Throws on failure
   ```
4. Run `npx jest --verbose` to confirm nothing broke
5. Do an E2E test in Slack to verify the full flow

### Conflict-prone files

- `package.json` / `package-lock.json` — both branches will modify these. Accept both deps, then `npm install` to regenerate lock file.
- `src/app.js` — only Person 1 should own this file. Person 2 exports a function, Person 1 imports it.

### Implementation Plans

- Person 1: `docs/superpowers/plans/2026-04-02-person-1-slack-flow.md`
