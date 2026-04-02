# Person 1: Slack Flow and UX

## Ownership

Own the Slack-facing side of Hachiko:

- Slack app setup
- event intake
- confirmation flow
- thread replies
- user-facing messages

Do not implement GitHub PR creation logic or repo-edit logic. Stub those integrations if needed.

## Goal

Make Hachiko feel real inside Slack.

The bot should:

- receive the target message
- recognize the supported price-change request
- ask for confirmation
- accept `Yes`
- post status updates in the same thread
- send the final PR link back to Slack

## Main Deliverables

- Slack app configured for the MVP
- bot can read the relevant Slack messages
- bot can reply in-thread
- confirmation flow works reliably
- final Slack messages are clean and demo-ready

## Task List

### Slack App Setup

- [ ] Create the Slack app
- [ ] Enable Socket Mode
- [ ] Create the app-level token with `connections:write`
- [ ] Add bot permissions:
  - `app_mentions:read`
  - `chat:write`
- [ ] Install the app into the workspace
- [ ] Invite the bot to the demo channel

### Message Intake

- [ ] Subscribe to the event type you will use for the MVP
- [ ] Decide the exact trigger format for the demo
- [ ] Detect the target message:
  - `Guys, the website price is $15 but it should be $20`
- [ ] Ignore unrelated Slack messages

### Confirmation Flow

- [ ] When the trigger message is detected, reply:
  - `I can fix that and open a pull request. Proceed?`
- [ ] Track the thread or conversation state
- [ ] Accept confirmation message:
  - `Yes`
- [ ] Ignore other follow-up replies
- [ ] Prevent duplicate execution in the same thread

### Status Messages

- [ ] Post a "starting" message after confirmation
- [ ] Post a final success message with PR link
- [ ] Keep all updates inside one Slack thread
- [ ] Make messages short and clean for demo

## Suggested Final Bot Messages

### Confirmation Message

`I can fix that and open a pull request. Proceed?`

### Start Message

`Starting now.`

### Success Message

`Done. Pull request created: [LINK]`

`Summary: updated homepage price from $15 to $20.`

## Handoff Inputs Needed

Need from Person 2:

- function or endpoint that performs the repo change and returns PR metadata

Need from Person 3:

- exact demo script wording
- exact Slack message wording if polished for judging

## Done Criteria

- A teammate can post the demo message in Slack
- Hachiko replies correctly
- Someone can answer `Yes`
- Hachiko continues the flow in-thread
- A final PR link message appears in Slack

