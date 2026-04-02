# Hachiko

**An always-on chat agent that turns a specific team request into a real pull request.**

Hachiko lives in Slack, waits for a specific product update request, confirms the action, makes the code change in GitHub, opens a real pull request, and posts the result back into the same thread.

The name matters: Hachiko is positioned as a patient, dependable bot that is always there in chat, waiting to help.

## One-Sentence Pitch

Hachiko is a Slack-native engineering agent that turns one common product update request into a real GitHub pull request.

## Core Story

Teams constantly discuss small fixes in chat:

- a price changed but the site still shows the old value

Even for this very small change, someone still has to switch context, find the right file, make the edit, create a branch, commit, push, and open a PR.

Hachiko compresses that workflow into one chat-native loop:

`Slack message -> confirmation -> code change -> pull request -> Slack update`

## Main Track

**Always-On Agents**

This is the clearest and safest track fit because:

- the system is triggered by real outside events such as Slack messages
- it stays available after the demo
- it performs actual workflow automation, not just a one-off assistant response
- the result is a real engineering artifact: a GitHub pull request

If needed, the project can be described as having some Software Factory flavor, but the main framing should stay simple:

**Hachiko is a Slack-triggered always-on engineering automation agent.**

## Problem

Small product changes often appear first in chat, but they still require manual engineering follow-through.

Examples:

- "The website still shows $15, but we changed it to $20."

This is a small, well-bounded task, but it still costs time and context switching.

## Solution

Hachiko watches Slack, identifies one supported request pattern, asks for confirmation, executes the change in a bounded repo context, opens a PR, and reports back in-thread.

This makes the bot feel like a teammate rather than a chatbot:

- it understands a work request
- it takes action in code
- it uses GitHub properly
- it returns something reviewable

## MVP

The MVP should stay intentionally narrow.

### What It Does

- Listens to messages in a Slack channel or thread
- Detects one supported request type: price update from `$15` to `$20`
- Replies with a confirmation prompt
- Waits for a simple confirmation such as `Yes`
- Updates one known file in one known repo
- Creates a Git branch
- Commits and pushes the change
- Opens a real GitHub pull request
- Posts the PR link and summary back into Slack

### What It Does Not Do

- Handle arbitrary tasks
- Search and understand any codebase
- Fix large or ambiguous bugs
- Auto-merge changes
- Replace engineers
- Support multiple workflows in the MVP

This is a controlled demo, and that is a strength rather than a weakness.

## Best Demo Scenario

The demo is a single pricing update.

### Example Chat Flow

User in Slack:

> The website still shows $15, but we changed it to $20.

Hachiko:

> I can update that and open a pull request. Proceed?

User:

> Yes

Hachiko:

> Starting now.

Then Hachiko:

- updates the target file
- creates a branch such as `hachiko/update-price-15-to-20`
- commits the change
- opens a real PR
- posts the PR link back in the same Slack thread

### Example Final Bot Reply

> Done. Pull request created: [link]  
> Summary: updated homepage price from $15 to $20.

## Demo Repository

Use a tiny prepared repo so the workflow is obvious and reliable.

### Suggested Structure

```text
demo-site/
  index.html
  style.css
  script.js
```

### Example Target Change

```js
const price = 15;
document.getElementById("price").textContent = `$${price}`;
```

Change it to:

```js
const price = 20;
document.getElementById("price").textContent = `$${price}`;
```

This repo is ideal because it is:

- easy to understand
- easy to edit
- low risk
- fast to demo

## Exact User Story

A teammate notices that the public website still shows the old price.

They post in Slack:

> Guys, the website price is $15 but it should be $20.

Hachiko replies:

> I can fix that and open a pull request. Proceed?

Someone replies:

> Yes

Hachiko then edits the known price value in the target repo, opens a real PR, and sends the link back into Slack.

This is the entire product story for the MVP, and that is intentional.

## Workflow Value

Hachiko is built for small, high-frequency changes that are annoying to do manually even though they are simple.

The value is not that the change is intellectually difficult. The value is that Hachiko removes context switching for tiny engineering tasks that start in chat.

Without Hachiko:

- someone notices the issue in Slack
- an engineer has to pick it up manually
- they open the repo
- find the file
- make the edit
- create a branch
- commit and push
- open a PR

With Hachiko:

- the team reports the issue where they already work
- Hachiko asks for confirmation
- Hachiko creates the PR immediately

That makes the project useful, even though the task itself is narrow.

## Product Flow

1. A teammate posts a supported request in Slack.
2. Hachiko detects the message and classifies it.
3. Hachiko asks for confirmation.
4. A teammate replies `Yes`.
5. Hachiko edits the target code in GitHub.
6. Hachiko opens a PR.
7. Hachiko posts the PR link and summary back into Slack.

## System Architecture

```text
Slack message
  -> event listener
  -> request matcher / classifier
  -> confirmation handler
  -> repo worker
  -> GitHub PR creation
  -> Slack thread update
```

## Tech Stack

The fastest clean implementation for the hackathon is:

- Slack
  - Slack app
  - Bolt for JavaScript or TypeScript
  - Socket Mode
  - `app_mentions:read`
  - `chat:write`
  - app-level token with `connections:write`
- GitHub
  - GitHub API for branch creation, commits, pushes, and PR creation
  - a small dedicated demo repository
- Bot backend
  - Node.js
  - simple request parsing for the MVP
  - LLM-assisted classification and editing, but within a hardcoded bounded workflow

### Why This Stack

- Slack looks more like a real workplace tool than Telegram
- Socket Mode removes the need to expose a public HTTP endpoint
- Bolt is the fastest clean path for a working Slack bot
- GitHub PR output is concrete and highly demo-friendly

## Recommended Scope for 24 Hours

If you want the strongest hackathon version, build this exact slice:

- one Slack trigger
- one repo
- one change type
- one confirmation path
- PR creation only
- no auto-merge
- no automated verification in the MVP

This version is realistic, stable, and very easy for judges to understand.

## Reliability Strategy

The project scores better if it shows restraint.

To keep it trustworthy:

- support only small, bounded tasks
- work in one known repo
- edit one known file with one known change
- require explicit confirmation in Slack before acting
- open PRs for human review instead of deploying directly
- keep the workflow deterministic after confirmation

For this MVP, reliability comes from strict scope control rather than from a heavy verification layer.

## Deterministic Execution

Although Hachiko can be described as using an LLM for classification and editing, the actual demo flow is intentionally constrained:

- one message pattern
- one repo
- one target file
- one value change: `15 -> 20`

This is important because the goal is not to show a general autonomous coder.

The goal is to show a narrow automation that works smoothly in a real workflow.

## Pull Request Output

The PR is the key product artifact.

For the demo, the PR should clearly show:

- branch name
- commit message
- one edited file
- the exact diff from `15` to `20`
- a clean title such as `Update website price from $15 to $20`

That makes the outcome concrete and easy for judges to trust.

## Why Judges Should Care

Hachiko scores well against the rubric:

- Concrete workflow value: it saves engineers time on repetitive tiny product updates that start in chat
- Track fit: it is clearly an always-on agent triggered by real chat events
- Reliability and verification: it stays trustworthy by using strict scope, explicit approval, and PR-only output
- Technical execution: it combines Slack, GitHub, controlled code changes, and real PR automation
- Demo clarity: the workflow is easy to explain in under two minutes

## Best Bonus Angle

The easiest bonus category to align with is:

**Best Developer Tool**

That is a natural fit because Hachiko improves a real engineering workflow instead of acting like a general chatbot.

It may also pick up some credit for reliability if the PR flow and approval loop are presented cleanly, but the main bonus angle should be developer workflow value.

## What Makes It Memorable

This is not "a bot that can do anything."

It is a narrow, believable, useful automation:

- chat-native
- always-on
- bounded
- review-friendly
- easy to trust

That makes it much stronger than a vague AI coding assistant pitch.

## What Not To Claim

Avoid saying:

- it can fix any bug
- it understands any codebase
- it can replace engineers
- it can safely merge everything automatically

Say instead:

- it handles small product changes and simple front-end issues
- it works best in bounded repo contexts
- it creates pull requests for human review
- it reduces engineering context switching

## Judge-Friendly Description

Hachiko is a Slack-triggered engineering agent that turns a simple product change request into a ready-to-review pull request. When a teammate reports that the website still shows `$15` instead of `$20`, the system confirms intent, creates a branch, edits the code, opens a real PR, and posts the result back into the original Slack thread.

## Short Tagline

**Hachiko waits in team chat and turns requests into PRs.**
