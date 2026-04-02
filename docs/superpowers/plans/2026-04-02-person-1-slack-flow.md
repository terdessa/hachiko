# Person 1: Slack Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Slack-facing side of Hachiko — event listener, LLM classifier, confirmation flow, status messages — so a teammate can post a price-change message and get a PR link back in-thread.

**Architecture:** Bolt app on Socket Mode listens to one channel. Every message is sent to an LLM classifier that decides if it's a price-change request or casual chat. If classified as a task, the bot replies with a confirmation prompt, waits for "Yes", calls Person 2's function (stubbed for now), and posts the PR link back. Thread state is tracked in-memory.

**Tech Stack:** Node.js, @slack/bolt, Anthropic SDK (Claude), dotenv

**Branch:** `mykyta-dev` (Person 2 works on a separate branch; merge guidance in CLAUDE.md)

---

## Agent Instructions

- Use **multi-agent system** with skills (`senior-backend`, `test-driven-development`, `systematic-debugging`) when applicable.
- **All commands allowed** — bash, npm, git, file writes, edits.
- **Model routing:** Use **Opus** for classifier prompt design, state machine, integration logic, debugging. Use **Sonnet** for scaffolding, boilerplate, config, message templates, simple file creation.
- **Do not stop early.** Every checkbox must be completed, verified, and the app must run.
- **Before building, ask the user clarifying questions** about pipeline and architecture to confirm understanding.

---

## File Structure

```
src/
  app.js              # Bolt init, Socket Mode, event routing
  classifier.js       # LLM-based message classifier
  confirmation.js     # Thread state machine + confirmation handler
  messages.js         # All bot message templates
  github-stub.js      # Stub for Person 2's createPriceUpdatePR()
  config.js           # Channel ID, env vars, constants
tests/
  classifier.test.js  # Classifier unit tests
  confirmation.test.js # State machine unit tests
  messages.test.js    # Message template tests
.env.example           # Template for required env vars
package.json
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `.env.example`, `src/config.js`

- [ ] **Step 1: Initialize project**

```bash
cd C:/Projects/hachiko
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @slack/bolt dotenv @anthropic-ai/sdk
npm install --save-dev jest
```

- [ ] **Step 3: Create `.env.example`**

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
ANTHROPIC_API_KEY=sk-ant-your-key
SLACK_CHANNEL_ID=C0123456789
```

- [ ] **Step 4: Create `src/config.js`**

```js
require('dotenv').config();

module.exports = {
  slackBotToken: process.env.SLACK_BOT_TOKEN,
  slackAppToken: process.env.SLACK_APP_TOKEN,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  channelId: process.env.SLACK_CHANNEL_ID,
};
```

- [ ] **Step 5: Add test script to `package.json`**

Add to `package.json`:
```json
{
  "scripts": {
    "start": "node src/app.js",
    "test": "jest --verbose"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .env.example src/config.js
git commit -m "feat: scaffold project with deps and config"
```

---

## Task 2: Bot Message Templates

**Files:**
- Create: `src/messages.js`, `tests/messages.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/messages.test.js`:

```js
const messages = require('../src/messages');

describe('messages', () => {
  test('confirmationPrompt returns confirmation string', () => {
    const result = messages.confirmationPrompt(15, 20);
    expect(result).toBe('I can update that and open a pull request. Proceed?');
  });

  test('startAck returns starting message', () => {
    expect(messages.startAck()).toBe('Starting now.');
  });

  test('success formats PR link and summary', () => {
    const result = messages.success({
      prUrl: 'https://github.com/org/repo/pull/1',
      oldPrice: 15,
      newPrice: 20,
    });
    expect(result).toContain('https://github.com/org/repo/pull/1');
    expect(result).toContain('$15');
    expect(result).toContain('$20');
  });

  test('error returns error message', () => {
    const result = messages.error();
    expect(result).toContain('Something went wrong');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/messages.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/messages'`

- [ ] **Step 3: Write the implementation**

Create `src/messages.js`:

```js
module.exports = {
  confirmationPrompt(oldPrice, newPrice) {
    return 'I can update that and open a pull request. Proceed?';
  },

  startAck() {
    return 'Starting now.';
  },

  success({ prUrl, oldPrice, newPrice }) {
    return `Done. Pull request created: ${prUrl}\nSummary: updated homepage price from $${oldPrice} to $${newPrice}.`;
  },

  error() {
    return 'Something went wrong while creating the PR. Please try again.';
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/messages.test.js --verbose
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/messages.js tests/messages.test.js
git commit -m "feat: add bot message templates with tests"
```

---

## Task 3: LLM Classifier

**Files:**
- Create: `src/classifier.js`, `tests/classifier.test.js`

**Model routing: Use Opus for this task** — this is the core classification logic.

- [ ] **Step 1: Write the failing tests**

Create `tests/classifier.test.js`:

```js
const { classifyMessage } = require('../src/classifier');

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  }));
});

const Anthropic = require('@anthropic-ai/sdk');

describe('classifyMessage', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = new Anthropic();
  });

  test('detects price change and extracts prices', async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: '{"isPriceChange": true, "oldPrice": 15, "newPrice": 20}' }],
    });

    const result = await classifyMessage(
      mockClient,
      'The website still shows $15, but we changed it to $20'
    );

    expect(result).toEqual({ oldPrice: 15, newPrice: 20 });
  });

  test('returns null for casual chat', async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: '{"isPriceChange": false}' }],
    });

    const result = await classifyMessage(mockClient, 'hey team, lunch at noon?');
    expect(result).toBeNull();
  });

  test('returns null if LLM response is malformed', async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: 'not json' }],
    });

    const result = await classifyMessage(mockClient, 'some message');
    expect(result).toBeNull();
  });

  test('returns null if LLM call fails', async () => {
    mockClient.messages.create.mockRejectedValue(new Error('API error'));

    const result = await classifyMessage(mockClient, 'some message');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/classifier.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/classifier'`

- [ ] **Step 3: Write the implementation**

Create `src/classifier.js`:

```js
const SYSTEM_PROMPT = `You are a message classifier for a Slack bot called Hachiko.

Your job: determine if a Slack message is a request to change a price on a website.

Rules:
- A price-change request mentions an OLD price and a NEW price for a website/page/product.
- Casual conversation, greetings, questions, or unrelated messages are NOT price-change requests.
- Extract the numeric values only (no dollar signs).

Respond with ONLY valid JSON, no other text:
- Price change detected: {"isPriceChange": true, "oldPrice": <number>, "newPrice": <number>}
- Not a price change: {"isPriceChange": false}`;

async function classifyMessage(anthropicClient, messageText) {
  try {
    const response = await anthropicClient.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: messageText }],
    });

    const text = response.content[0].text.trim();
    const parsed = JSON.parse(text);

    if (parsed.isPriceChange && typeof parsed.oldPrice === 'number' && typeof parsed.newPrice === 'number') {
      return { oldPrice: parsed.oldPrice, newPrice: parsed.newPrice };
    }

    return null;
  } catch (err) {
    console.error('Classifier error:', err.message);
    return null;
  }
}

module.exports = { classifyMessage, SYSTEM_PROMPT };
```

> **Note:** Uses `claude-haiku-4-5-20251001` for classification — fast, cheap, reliable for this narrow task. The system prompt is strict JSON-only output.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/classifier.test.js --verbose
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/classifier.js tests/classifier.test.js
git commit -m "feat: add LLM-based message classifier with tests"
```

---

## Task 4: Thread State Machine

**Files:**
- Create: `src/confirmation.js`, `tests/confirmation.test.js`

**Model routing: Use Opus for this task** — state machine logic.

- [ ] **Step 1: Write the failing tests**

Create `tests/confirmation.test.js`:

```js
const { ThreadStateManager } = require('../src/confirmation');

describe('ThreadStateManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ThreadStateManager();
  });

  test('startConfirmation creates AWAITING_CONFIRMATION state', () => {
    manager.startConfirmation('ts123', { oldPrice: 15, newPrice: 20 });
    const state = manager.getState('ts123');
    expect(state.status).toBe('AWAITING_CONFIRMATION');
    expect(state.oldPrice).toBe(15);
    expect(state.newPrice).toBe(20);
  });

  test('confirm transitions to PROCESSING', () => {
    manager.startConfirmation('ts123', { oldPrice: 15, newPrice: 20 });
    const result = manager.confirm('ts123');
    expect(result).toBe(true);
    expect(manager.getState('ts123').status).toBe('PROCESSING');
  });

  test('confirm returns false if not AWAITING_CONFIRMATION', () => {
    expect(manager.confirm('ts123')).toBe(false);
  });

  test('confirm returns false if already PROCESSING', () => {
    manager.startConfirmation('ts123', { oldPrice: 15, newPrice: 20 });
    manager.confirm('ts123');
    expect(manager.confirm('ts123')).toBe(false);
  });

  test('markDone transitions to DONE', () => {
    manager.startConfirmation('ts123', { oldPrice: 15, newPrice: 20 });
    manager.confirm('ts123');
    manager.markDone('ts123');
    expect(manager.getState('ts123').status).toBe('DONE');
  });

  test('markError transitions to ERROR', () => {
    manager.startConfirmation('ts123', { oldPrice: 15, newPrice: 20 });
    manager.confirm('ts123');
    manager.markError('ts123');
    expect(manager.getState('ts123').status).toBe('ERROR');
  });

  test('isProcessedThread returns true for DONE threads', () => {
    manager.startConfirmation('ts123', { oldPrice: 15, newPrice: 20 });
    manager.confirm('ts123');
    manager.markDone('ts123');
    expect(manager.isProcessedThread('ts123')).toBe(true);
  });

  test('getState returns null for unknown thread', () => {
    expect(manager.getState('unknown')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/confirmation.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/confirmation'`

- [ ] **Step 3: Write the implementation**

Create `src/confirmation.js`:

```js
class ThreadStateManager {
  constructor() {
    this.threads = new Map();
  }

  startConfirmation(threadTs, { oldPrice, newPrice }) {
    this.threads.set(threadTs, {
      status: 'AWAITING_CONFIRMATION',
      oldPrice,
      newPrice,
    });
  }

  confirm(threadTs) {
    const state = this.threads.get(threadTs);
    if (!state || state.status !== 'AWAITING_CONFIRMATION') {
      return false;
    }
    state.status = 'PROCESSING';
    return true;
  }

  markDone(threadTs) {
    const state = this.threads.get(threadTs);
    if (state) state.status = 'DONE';
  }

  markError(threadTs) {
    const state = this.threads.get(threadTs);
    if (state) state.status = 'ERROR';
  }

  getState(threadTs) {
    return this.threads.get(threadTs) || null;
  }

  isProcessedThread(threadTs) {
    const state = this.threads.get(threadTs);
    return state ? state.status === 'DONE' : false;
  }
}

module.exports = { ThreadStateManager };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/confirmation.test.js --verbose
```

Expected: 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/confirmation.js tests/confirmation.test.js
git commit -m "feat: add thread state machine with tests"
```

---

## Task 5: Person 2 Stub

**Files:**
- Create: `src/github-stub.js`

**Model routing: Sonnet** — simple stub.

- [ ] **Step 1: Create the stub**

Create `src/github-stub.js`:

```js
/**
 * Stub for Person 2's GitHub PR pipeline.
 * Replace this with the real import after merging Person 2's branch.
 *
 * Expected real function signature:
 *   createPriceUpdatePR({ oldPrice, newPrice }) → { prUrl, prNumber, branchName, summary }
 */
async function createPriceUpdatePR({ oldPrice, newPrice }) {
  console.log(`[STUB] Would create PR: update price from $${oldPrice} to $${newPrice}`);

  // Simulate a 2-second delay to mimic real API calls
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    prUrl: `https://github.com/terdessa/hachiko-demo/pull/1`,
    prNumber: 1,
    branchName: `hachiko/update-price-${oldPrice}-to-${newPrice}`,
    summary: `Updated homepage price from $${oldPrice} to $${newPrice}`,
  };
}

module.exports = { createPriceUpdatePR };
```

- [ ] **Step 2: Commit**

```bash
git add src/github-stub.js
git commit -m "feat: add Person 2 stub for independent testing"
```

---

## Task 6: Main App — Wire Everything Together

**Files:**
- Create: `src/app.js`

**Model routing: Use Opus** — core integration logic.

- [ ] **Step 1: Create `src/app.js`**

```js
const { App } = require('@slack/bolt');
const Anthropic = require('@anthropic-ai/sdk');
const config = require('./config');
const { classifyMessage } = require('./classifier');
const { ThreadStateManager } = require('./confirmation');
const messages = require('./messages');
const { createPriceUpdatePR } = require('./github-stub');

const app = new App({
  token: config.slackBotToken,
  appToken: config.slackAppToken,
  socketMode: true,
});

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
const stateManager = new ThreadStateManager();

// Listen to all messages in the configured channel
app.message(async ({ message, say }) => {
  // Ignore bot messages, message edits, and messages outside our channel
  if (message.subtype || message.bot_id) return;
  if (config.channelId && message.channel !== config.channelId) return;

  const threadTs = message.thread_ts || message.ts;

  // If this message is a reply in a tracked thread, check for confirmation
  if (message.thread_ts) {
    const state = stateManager.getState(message.thread_ts);
    if (state && state.status === 'AWAITING_CONFIRMATION') {
      if (message.text && message.text.trim().toLowerCase() === 'yes') {
        const confirmed = stateManager.confirm(message.thread_ts);
        if (!confirmed) return;

        await say({ text: messages.startAck(), thread_ts: message.thread_ts });

        try {
          const prResult = await createPriceUpdatePR({
            oldPrice: state.oldPrice,
            newPrice: state.newPrice,
          });

          stateManager.markDone(message.thread_ts);
          await say({
            text: messages.success({
              prUrl: prResult.prUrl,
              oldPrice: state.oldPrice,
              newPrice: state.newPrice,
            }),
            thread_ts: message.thread_ts,
          });
        } catch (err) {
          console.error('PR creation failed:', err);
          stateManager.markError(message.thread_ts);
          await say({ text: messages.error(), thread_ts: message.thread_ts });
        }
      }
    }
    return;
  }

  // Top-level message — classify it
  const classification = await classifyMessage(anthropic, message.text);
  if (!classification) return;

  stateManager.startConfirmation(message.ts, classification);

  await say({
    text: messages.confirmationPrompt(classification.oldPrice, classification.newPrice),
    thread_ts: message.ts,
  });
});

(async () => {
  await app.start();
  console.log('⚡ Hachiko is running (Socket Mode)');
})();
```

- [ ] **Step 2: Verify the app starts without errors**

Create a `.env` file with test values (do NOT commit this):

```bash
cp .env.example .env
```

Edit `.env` with real tokens, then:

```bash
node src/app.js
```

Expected: `⚡ Hachiko is running (Socket Mode)` (will fail to connect without real tokens, but no import/syntax errors)

- [ ] **Step 3: Commit**

```bash
git add src/app.js
git commit -m "feat: wire up Bolt app with classifier, state machine, and stub"
```

---

## Task 7: Run All Tests

- [ ] **Step 1: Run full test suite**

```bash
npx jest --verbose
```

Expected: All tests PASS (messages: 4, classifier: 4, confirmation: 8 = 16 total)

- [ ] **Step 2: Fix any failures**

If any test fails, debug and fix before proceeding.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve test failures"
```

(Skip this step if all tests passed.)

---

## Task 8: End-to-End Manual Test

- [ ] **Step 1: Start the app with real Slack tokens**

```bash
node src/app.js
```

Expected: `⚡ Hachiko is running (Socket Mode)`

- [ ] **Step 2: Post a test message in the demo Slack channel**

Post: `The website still shows $15 but it should be $20`

Expected: Hachiko replies in-thread: `I can update that and open a pull request. Proceed?`

- [ ] **Step 3: Reply "Yes" in the thread**

Expected:
1. Hachiko replies: `Starting now.`
2. After ~2s (stub delay): `Done. Pull request created: https://github.com/terdessa/hachiko-demo/pull/1`

- [ ] **Step 4: Test casual message is ignored**

Post: `hey team, what's for lunch?`

Expected: No reply from Hachiko.

- [ ] **Step 5: Test duplicate "Yes" is ignored**

Reply `Yes` again in the same thread.

Expected: No reply (thread is already DONE).

- [ ] **Step 6: Commit any fixes from E2E testing**

```bash
git add -A
git commit -m "fix: adjustments from end-to-end testing"
```

(Skip if no fixes needed.)

---

## Summary: State Machine

```
IDLE → (LLM classifies as price-change) → AWAITING_CONFIRMATION
AWAITING_CONFIRMATION → ("Yes" received) → PROCESSING
PROCESSING → (PR created successfully) → DONE
PROCESSING → (PR creation failed) → ERROR
```

## Integration Contract with Person 2

When merging Person 2's branch, replace the import in `src/app.js`:

```js
// BEFORE (stub):
const { createPriceUpdatePR } = require('./github-stub');

// AFTER (real):
const { createPriceUpdatePR } = require('./github-pipeline');
```

Expected function signature (Person 2 must match this):

```js
async function createPriceUpdatePR({ oldPrice, newPrice }) {
  // ... real GitHub operations ...
  return { prUrl, prNumber, branchName, summary };
}
```
