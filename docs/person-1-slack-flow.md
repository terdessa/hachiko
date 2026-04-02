# Person 1: Slack Flow and UX

## Agent Instructions

> **This section is for the AI agent (Claude Code / Cursor) executing this plan.**

### Execution Mode

- Use a **multi-agent system**: dispatch parallel subagents for independent tasks (e.g., scaffolding files, writing classifier, writing confirmation handler). Use appropriate skills (`brainstorming`, `senior-backend`, `test-driven-development`, `systematic-debugging`, etc.) whenever they apply.
- **All tools and commands are allowed** — bash, npm, git, file writes, edits, etc. Do not ask for permission on standard operations.
- **Do not stop early.** Every task in this plan must be completed. Do not mark the work as done until all checklist items are checked, all files exist, and the app runs without errors.
- After building, **verify everything works**: run the app, check for import errors, confirm the state machine logic, and validate the integration contract shape.

### Model Routing

- **Use Opus for**: classifier logic, state machine implementation, confirmation flow, integration contract design, debugging, architecture decisions
- **Use Sonnet for**: project scaffolding (`npm init`, installing deps), writing `.env.example`, boilerplate files, message template strings, simple config, straightforward file creation

### Before You Build — Ask Questions First

Before writing any code, you **must** ask the user clarifying questions to confirm your understanding. Questions should cover:

1. **Pipeline understanding** — "Here is how I understand the message flow: [describe]. Is this correct?"
2. **Architecture decisions** — "Should the classifier use regex or LLM-assisted classification? Do you want both implemented with a toggle?"
3. **Integration boundary** — "Person 2's function does not exist yet. Should I create a stub/mock that simulates PR creation, or leave a clear import placeholder?"
4. **State management** — "I plan to use an in-memory Map for thread state. Is that acceptable, or do you want Redis/file-based persistence?"
5. **Scope confirmation** — "The plan says Socket Mode + Bolt. Should I also set up any Express routes, or is Socket Mode the only transport?"
6. **Error scenarios** — "How should the bot behave if the same price-change is requested twice in different threads? Process both, or deduplicate by price values?"
7. **Demo reset** — "Should there be a slash command or special message to reset state for re-demo, or is restarting the process enough?"

Do not proceed to implementation until the user confirms the architecture. Once confirmed, build everything end-to-end without stopping.

---

## Ownership

Own the Slack-facing side of Hachiko:

- Slack app setup and configuration
- event intake and message classification
- confirmation flow
- thread replies and status updates
- error messaging
- user-facing message tone (Hachiko should feel like a teammate, not a chatbot)

Do not implement GitHub PR creation logic or repo-edit logic. Call Person 2's function/endpoint and use the returned PR metadata.

## Goal

Make Hachiko feel real inside Slack.

The bot should follow the architecture from `idea.md`:

```
Slack message → event listener → request matcher/classifier → confirmation handler → [call Person 2] → Slack thread update
```

## Main Deliverables

- Slack app configured for the MVP (Socket Mode, no public endpoint needed)
- message classifier that detects price-change requests
- in-thread confirmation flow
- status messages and final PR link posted in the same thread
- error handling for failed GitHub operations

## Environment Setup

### Required Tokens

Store these in `.env` (gitignored):

- `SLACK_BOT_TOKEN` — Bot User OAuth Token (`xoxb-...`)
- `SLACK_APP_TOKEN` — App-Level Token (`xapp-...`) with `connections:write` scope

### Project Init

```bash
npm init -y
npm install @slack/bolt dotenv
```

### Entry Point

```
src/
  app.js           # Bolt app init + Socket Mode
  classifier.js    # message classification logic
  confirmation.js  # thread state + confirmation handler
  slack-messages.js # all bot message templates
```

## Task List

### Slack App Setup

- [ ] Create the Slack app at api.slack.com
- [ ] Enable Socket Mode
- [ ] Create the app-level token with `connections:write`
- [ ] Add bot token scopes:
  - `app_mentions:read`
  - `chat:write`
  - `channels:history` (needed to read messages the bot wasn't @mentioned in)
  - `reactions:write` (optional — acknowledge trigger message with emoji)
- [ ] Subscribe to events:
  - `message.channels` (to detect messages without requiring @mention)
- [ ] Install the app into the workspace
- [ ] Invite the bot to the demo channel

### Message Classification

The `idea.md` specifies "LLM-assisted classification within a hardcoded bounded workflow." For the MVP, implement a classifier that:

- [ ] Detects price-change intent from natural language, not just one exact string
- [ ] Extracts the old price and new price from the message
- [ ] Handles variations like:
  - `The website still shows $15, but we changed it to $20`
  - `Guys, the website price is $15 but it should be $20`
  - `Hey the price on the site says $15 — it needs to be $20`
- [ ] Returns a structured result: `{ oldPrice, newPrice }` or `null` if not a match
- [ ] Ignores unrelated messages without responding

**Approach options (pick one):**

1. **Regex-based** — fast, no API calls, good enough for demo
2. **LLM-assisted** — send message to Claude/GPT with a classification prompt, extract prices (more impressive for judges but adds latency + API dependency)

### Confirmation Flow

- [ ] When a price-change message is detected, reply in-thread:
  - `I can update that and open a pull request. Proceed?`
- [ ] Track thread state using an in-memory `Map<threadTs, { oldPrice, newPrice, status }>`
- [ ] Listen for replies in the same thread
- [ ] Accept confirmation: `Yes` (case-insensitive)
- [ ] Ignore non-`Yes` replies
- [ ] Prevent duplicate execution: if a thread is already `processing` or `done`, ignore further `Yes` replies
- [ ] Support demo reset: allow re-triggering from a new message/thread

### Status Messages

- [ ] Post `Starting now.` after confirmation is received
- [ ] Call Person 2's function with `{ oldPrice, newPrice }`
- [ ] On success, post PR link and summary in-thread
- [ ] On failure, post an error message in-thread:
  - `Something went wrong while creating the PR. Please try again.`
- [ ] Keep all messages inside the originating Slack thread

### Integration with Person 2

- [ ] Import and call Person 2's function after confirmation
- [ ] Expected input: `{ oldPrice: number, newPrice: number }`
- [ ] Expected success response: `{ prUrl: string, prNumber: number, branchName: string, summary: string }`
- [ ] Handle failure response gracefully

## Bot Messages (match `idea.md` wording)

### Confirmation Prompt

> I can update that and open a pull request. Proceed?

### Start Acknowledgment

> Starting now.

### Success

> Done. Pull request created: {prUrl}
> Summary: updated homepage price from ${oldPrice} to ${newPrice}.

### Error

> Something went wrong while creating the PR. Please try again.

## Thread State Machine

```
IDLE → (price-change detected) → AWAITING_CONFIRMATION
AWAITING_CONFIRMATION → (Yes received) → PROCESSING
PROCESSING → (PR created) → DONE
PROCESSING → (PR failed) → ERROR
```

## Handoff Contract

### From Person 2 (required)

- Exported function: `createPriceUpdatePR({ oldPrice, newPrice })` → returns `{ prUrl, prNumber, branchName, summary }`
- Error behavior: throws on failure

### From Person 3 (optional)

- Final polished message wording if different from above
- Demo script so Slack flow matches the presentation

## Done Criteria

- [ ] A teammate posts a natural price-change message in Slack
- [ ] Hachiko detects it and replies with the confirmation prompt in-thread
- [ ] A teammate replies `Yes`
- [ ] Hachiko posts "Starting now." and then the PR link
- [ ] The flow works on repeated runs from new messages
- [ ] Failed GitHub calls show an error message instead of silence

