# Person 2: GitHub Edit and PR Pipeline

## Ownership

Own the GitHub and repo-action side of Hachiko:

- edit the target file
- create branch
- commit change
- push branch
- open pull request
- return PR details to the Slack flow

Do not own Slack app setup or presentation materials.

## Goal

Implement the narrowest reliable backend action:

`change price from 15 to 20 -> create real PR -> return PR link`

## Main Deliverables

- target demo repo prepared
- file edit logic working
- branch creation working
- commit and push working
- PR creation working
- response object available for Slack integration

## Task List

### Demo Repo

- [ ] Create or confirm the demo repo
- [ ] Make sure the repo contains the known target file
- [ ] Make sure the file contains the initial value `15`
- [ ] Confirm the repo is small and safe for demo use

### Edit Logic

- [ ] Choose the exact target file
- [ ] Implement the file update from `15` to `20`
- [ ] Make the edit deterministic
- [ ] Ensure only the intended line changes

### GitHub Workflow

- [ ] Create branch name:
  - `hachiko/update-price-15-to-20`
- [ ] Commit the change
- [ ] Push the branch
- [ ] Open a real GitHub pull request

### PR Metadata

- [ ] Return PR URL
- [ ] Return PR number
- [ ] Return branch name
- [ ] Return a short success summary for Slack

### Integration Shape

- [ ] Expose a simple function or endpoint that Person 1 can call
- [ ] Define input shape
- [ ] Define success response shape
- [ ] Define failure response shape

## Suggested Defaults

### Branch Name

`hachiko/update-price-15-to-20`

### Commit Message

`Update website price from $15 to $20`

### PR Title

`Update website price from $15 to $20`

### PR Body

- Short reason for the change
- Mention that the price was updated from `15` to `20`
- Mention the edited file

## Guardrails

- [ ] Only run against the demo repo
- [ ] Only edit the allowlisted file
- [ ] Only change `15` to `20`
- [ ] Do not support arbitrary edits in MVP
- [ ] Do not add auto-merge

## Handoff Inputs Needed

Need from Person 1:

- exact call timing after Slack confirmation
- expected response format for final Slack reply

Need from Person 3:

- final naming and wording for PR title/body if polished for demo

## Done Criteria

- A single backend call can perform the full GitHub action
- The repo is changed from `15` to `20`
- A real PR is opened
- The PR URL can be returned to Slack

