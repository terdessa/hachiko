# Person 2: GitHub PR Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `createPriceUpdatePR({ oldPrice, newPrice })` — a function that edits a known file in the demo repo, creates a branch, commits, opens a real GitHub PR, and returns PR metadata. Then swap it into the existing Slack bot replacing the stub.

**Architecture:** Uses GitHub App auth (JWT → installation token) via Octokit. Gets the target file from the demo repo, does a string replacement on the price value, creates a branch, commits the change via the GitHub Contents API, and opens a PR. Returns `{ prUrl, prNumber, branchName, summary }` matching Person 1's contract.

**Tech Stack:** Node.js, @octokit/rest, @octokit/auth-app, jsonwebtoken

**Branch:** `mykyta-dev` (replacing the stub from Person 1's build)

---

## Agent Instructions

- Use **multi-agent system** with skills (`senior-backend`, `test-driven-development`, `systematic-debugging`) when applicable.
- **All commands allowed** — bash, npm, git, file writes, edits.
- **Model routing:** Use **Opus** for GitHub App auth logic, pipeline integration, debugging. Use **Sonnet** for config updates, env files, simple file creation.
- **Do not stop early.** Every checkbox must be completed, verified, and the app must run.
- **Before building, ask the user clarifying questions** about pipeline and architecture to confirm understanding.

---

## File Structure

```
src/
  github-auth.js      # GitHub App JWT + installation token
  github-pipeline.js  # createPriceUpdatePR() — the real implementation
  config.js           # (modify) add GitHub env vars
  app.js              # (modify) swap stub import for pipeline
  github-stub.js      # (keep as fallback, no longer imported)
tests/
  github-auth.test.js     # Auth unit tests
  github-pipeline.test.js # Pipeline unit tests with mocked Octokit
.env.example          # (modify) add GitHub vars
```

---

## Task 1: Install GitHub Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

```bash
cd C:/Projects/hachiko
npm install @octokit/rest @octokit/auth-app
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add Octokit and GitHub App auth dependencies"
```

---

## Task 2: Update Config and Env

**Files:**
- Modify: `src/config.js`, `.env.example`

- [ ] **Step 1: Update `.env.example`**

Replace the full contents of `.env.example` with:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
OPENAI_API_KEY=sk-your-openai-key
SLACK_CHANNEL_ID=C0123456789
GITHUB_APP_ID=your-app-id
GITHUB_APP_INSTALLATION_ID=your-installation-id
GITHUB_APP_PRIVATE_KEY_PATH=./github-app-key.pem
GITHUB_OWNER=terdessa
GITHUB_REPO=hachiko-demo
GITHUB_TARGET_FILE=script.js
```

- [ ] **Step 2: Update `src/config.js`**

Replace the full contents of `src/config.js` with:

```js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const privateKeyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH;
let githubAppPrivateKey = null;
if (privateKeyPath) {
  try {
    githubAppPrivateKey = fs.readFileSync(path.resolve(privateKeyPath), 'utf8');
  } catch (err) {
    console.warn('Warning: Could not read GitHub App private key:', err.message);
  }
}

module.exports = {
  slackBotToken: process.env.SLACK_BOT_TOKEN,
  slackAppToken: process.env.SLACK_APP_TOKEN,
  openaiApiKey: process.env.OPENAI_API_KEY,
  channelId: process.env.SLACK_CHANNEL_ID,
  githubAppId: process.env.GITHUB_APP_ID,
  githubAppInstallationId: process.env.GITHUB_APP_INSTALLATION_ID,
  githubAppPrivateKey,
  githubOwner: process.env.GITHUB_OWNER || 'terdessa',
  githubRepo: process.env.GITHUB_REPO || 'hachiko-demo',
  githubTargetFile: process.env.GITHUB_TARGET_FILE || 'script.js',
};
```

- [ ] **Step 3: Update user's `.env` file**

Add the GitHub vars to the existing `.env` (do NOT overwrite Slack/OpenAI vars already there):

```env
GITHUB_APP_ID=3254733
GITHUB_APP_INSTALLATION_ID=120949250
GITHUB_APP_PRIVATE_KEY_PATH=./github-app-key.pem
GITHUB_OWNER=terdessa
GITHUB_REPO=hachiko-demo
GITHUB_TARGET_FILE=script.js
```

- [ ] **Step 4: Commit**

```bash
git add .env.example src/config.js
git commit -m "feat: add GitHub App config and env vars"
```

---

## Task 3: GitHub App Auth

**Files:**
- Create: `src/github-auth.js`, `tests/github-auth.test.js`

**Model routing: Use Opus** — auth logic.

- [ ] **Step 1: Write the failing tests**

Create `tests/github-auth.test.js`:

```js
const { createOctokitClient } = require('../src/github-auth');

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    apps: { createInstallationAccessToken: jest.fn() },
  })),
}));

jest.mock('@octokit/auth-app', () => ({
  createAppAuth: jest.fn().mockReturnValue(jest.fn().mockResolvedValue({ token: 'ghs_test_token' })),
}));

describe('createOctokitClient', () => {
  test('returns an Octokit instance', async () => {
    const client = await createOctokitClient({
      appId: '12345',
      installationId: '67890',
      privateKey: '-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----',
    });

    expect(client).toBeDefined();
    expect(typeof client).toBe('object');
  });

  test('throws if missing credentials', async () => {
    await expect(createOctokitClient({})).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/github-auth.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/github-auth'`

- [ ] **Step 3: Write the implementation**

Create `src/github-auth.js`:

```js
const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');

async function createOctokitClient({ appId, installationId, privateKey }) {
  if (!appId || !installationId || !privateKey) {
    throw new Error('Missing GitHub App credentials: appId, installationId, and privateKey are required');
  }

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      installationId,
      privateKey,
    },
  });

  return octokit;
}

module.exports = { createOctokitClient };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/github-auth.test.js --verbose
```

Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/github-auth.js tests/github-auth.test.js
git commit -m "feat: add GitHub App auth with Octokit"
```

---

## Task 4: GitHub PR Pipeline

**Files:**
- Create: `src/github-pipeline.js`, `tests/github-pipeline.test.js`

**Model routing: Use Opus** — core pipeline logic.

- [ ] **Step 1: Write the failing tests**

Create `tests/github-pipeline.test.js`:

```js
const { createPriceUpdatePR } = require('../src/github-pipeline');

describe('createPriceUpdatePR', () => {
  let mockOctokit;

  beforeEach(() => {
    mockOctokit = {
      repos: {
        getContent: jest.fn().mockResolvedValue({
          data: {
            sha: 'abc123',
            content: Buffer.from('const price = 15;\ndocument.getElementById("price").textContent = `$${price}`;').toString('base64'),
          },
        }),
        getBranch: jest.fn().mockResolvedValue({
          data: { commit: { sha: 'main-sha-123' } },
        }),
      },
      git: {
        createRef: jest.fn().mockResolvedValue({ data: {} }),
        getRef: jest.fn().mockRejectedValue({ status: 404 }),
      },
      repos: {
        getContent: jest.fn().mockResolvedValue({
          data: {
            sha: 'file-sha-123',
            content: Buffer.from('const price = 15;\ndocument.getElementById("price").textContent = `$${price}`;').toString('base64'),
          },
        }),
        getBranch: jest.fn().mockResolvedValue({
          data: { commit: { sha: 'main-sha-123' } },
        }),
        createOrUpdateFileContents: jest.fn().mockResolvedValue({ data: {} }),
      },
      pulls: {
        create: jest.fn().mockResolvedValue({
          data: {
            html_url: 'https://github.com/terdessa/hachiko-demo/pull/42',
            number: 42,
          },
        }),
      },
    };
  });

  test('creates PR and returns metadata', async () => {
    const result = await createPriceUpdatePR(mockOctokit, {
      oldPrice: 15,
      newPrice: 20,
      owner: 'terdessa',
      repo: 'hachiko-demo',
      targetFile: 'script.js',
    });

    expect(result.prUrl).toBe('https://github.com/terdessa/hachiko-demo/pull/42');
    expect(result.prNumber).toBe(42);
    expect(result.branchName).toContain('hachiko/update-price');
    expect(result.summary).toContain('15');
    expect(result.summary).toContain('20');
  });

  test('replaces old price with new price in file content', async () => {
    await createPriceUpdatePR(mockOctokit, {
      oldPrice: 15,
      newPrice: 20,
      owner: 'terdessa',
      repo: 'hachiko-demo',
      targetFile: 'script.js',
    });

    const putCall = mockOctokit.repos.createOrUpdateFileContents.mock.calls[0][0];
    const newContent = Buffer.from(putCall.content, 'base64').toString('utf8');
    expect(newContent).toContain('const price = 20;');
    expect(newContent).not.toContain('const price = 15;');
  });

  test('throws if old price not found in file', async () => {
    mockOctokit.repos.getContent.mockResolvedValue({
      data: {
        sha: 'file-sha-123',
        content: Buffer.from('const price = 99;').toString('base64'),
      },
    });

    await expect(
      createPriceUpdatePR(mockOctokit, {
        oldPrice: 15,
        newPrice: 20,
        owner: 'terdessa',
        repo: 'hachiko-demo',
        targetFile: 'script.js',
      })
    ).rejects.toThrow('not found');
  });

  test('deletes existing branch before creating new one', async () => {
    mockOctokit.git.getRef.mockResolvedValue({ data: {} });
    mockOctokit.git.deleteRef = jest.fn().mockResolvedValue({});

    await createPriceUpdatePR(mockOctokit, {
      oldPrice: 15,
      newPrice: 20,
      owner: 'terdessa',
      repo: 'hachiko-demo',
      targetFile: 'script.js',
    });

    expect(mockOctokit.git.deleteRef).toHaveBeenCalled();
    expect(mockOctokit.git.createRef).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/github-pipeline.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/github-pipeline'`

- [ ] **Step 3: Write the implementation**

Create `src/github-pipeline.js`:

```js
async function createPriceUpdatePR(octokit, { oldPrice, newPrice, owner, repo, targetFile }) {
  const branchName = `hachiko/update-price-${oldPrice}-to-${newPrice}`;
  const ref = `heads/${branchName}`;

  // 1. Get main branch SHA
  const { data: mainBranch } = await octokit.repos.getBranch({
    owner,
    repo,
    branch: 'main',
  });
  const baseSha = mainBranch.commit.sha;

  // 2. Delete existing branch if it exists (for demo reruns)
  try {
    await octokit.git.getRef({ owner, repo, ref });
    await octokit.git.deleteRef({ owner, repo, ref });
  } catch (err) {
    // Branch doesn't exist — that's fine
  }

  // 3. Create new branch from main
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/${ref}`,
    sha: baseSha,
  });

  // 4. Get current file content
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: targetFile,
    ref: branchName,
  });

  const currentContent = Buffer.from(fileData.content, 'base64').toString('utf8');

  // 5. Replace price
  const oldPattern = `const price = ${oldPrice};`;
  if (!currentContent.includes(oldPattern)) {
    throw new Error(`Price value "${oldPattern}" not found in ${targetFile}`);
  }

  const newContent = currentContent.replace(oldPattern, `const price = ${newPrice};`);

  // 6. Commit the change
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: targetFile,
    message: `Update website price from $${oldPrice} to $${newPrice}`,
    content: Buffer.from(newContent).toString('base64'),
    sha: fileData.sha,
    branch: branchName,
  });

  // 7. Open PR
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: `Update website price from $${oldPrice} to $${newPrice}`,
    head: branchName,
    base: 'main',
    body: `## Price Update\n\nUpdated \`${targetFile}\`: changed price from **$${oldPrice}** to **$${newPrice}**.\n\nCreated by Hachiko 🐕`,
  });

  return {
    prUrl: pr.html_url,
    prNumber: pr.number,
    branchName,
    summary: `Updated homepage price from $${oldPrice} to $${newPrice}`,
  };
}

module.exports = { createPriceUpdatePR };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/github-pipeline.test.js --verbose
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/github-pipeline.js tests/github-pipeline.test.js
git commit -m "feat: add GitHub PR pipeline with tests"
```

---

## Task 5: Wire Pipeline into App

**Files:**
- Modify: `src/app.js`

**Model routing: Use Opus** — integration logic.

- [ ] **Step 1: Update `src/app.js`**

Replace the full contents of `src/app.js` with:

```js
const { App } = require('@slack/bolt');
const OpenAI = require('openai');
const config = require('./config');
const { classifyMessage } = require('./classifier');
const { ThreadStateManager } = require('./confirmation');
const messages = require('./messages');
const { createOctokitClient } = require('./github-auth');
const { createPriceUpdatePR } = require('./github-pipeline');

const app = new App({
  token: config.slackBotToken,
  appToken: config.slackAppToken,
  socketMode: true,
});

const openai = new OpenAI({ apiKey: config.openaiApiKey });
const stateManager = new ThreadStateManager();

let octokit = null;

// Listen to all messages in the configured channel
app.message(async ({ message, say }) => {
  // Ignore bot messages, message edits, and messages outside our channel
  if (message.subtype || message.bot_id) return;
  if (config.channelId && message.channel !== config.channelId) return;

  // If this message is a reply in a tracked thread, check for confirmation
  if (message.thread_ts) {
    const state = stateManager.getState(message.thread_ts);
    if (state && state.status === 'AWAITING_CONFIRMATION') {
      if (message.text && message.text.trim().toLowerCase() === 'yes') {
        const confirmed = stateManager.confirm(message.thread_ts);
        if (!confirmed) return;

        await say({ text: messages.startAck(), thread_ts: message.thread_ts });

        try {
          const prResult = await createPriceUpdatePR(octokit, {
            oldPrice: state.oldPrice,
            newPrice: state.newPrice,
            owner: config.githubOwner,
            repo: config.githubRepo,
            targetFile: config.githubTargetFile,
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
  const classification = await classifyMessage(openai, message.text);
  if (!classification) return;

  stateManager.startConfirmation(message.ts, classification);

  await say({
    text: messages.confirmationPrompt(classification.oldPrice, classification.newPrice),
    thread_ts: message.ts,
  });
});

(async () => {
  // Initialize GitHub client
  octokit = await createOctokitClient({
    appId: config.githubAppId,
    installationId: config.githubAppInstallationId,
    privateKey: config.githubAppPrivateKey,
  });
  console.log('✅ GitHub App authenticated');

  await app.start();
  console.log('⚡ Hachiko is running (Socket Mode)');
})();
```

- [ ] **Step 2: Verify syntax**

```bash
node -c src/app.js
```

Expected: No syntax errors

- [ ] **Step 3: Commit**

```bash
git add src/app.js
git commit -m "feat: wire real GitHub pipeline into app, replace stub"
```

---

## Task 6: Run All Tests

- [ ] **Step 1: Run full test suite**

```bash
npx jest --verbose
```

Expected: All tests PASS (messages: 4, classifier: 4, confirmation: 8, github-auth: 2, github-pipeline: 4 = 22 total)

- [ ] **Step 2: Fix any failures**

Debug and fix before proceeding.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve test failures"
```

(Skip if all passed.)

---

## Task 7: Verify Demo Repo

- [ ] **Step 1: Check demo repo has target file**

```bash
gh api repos/terdessa/hachiko-demo/contents/script.js --jq '.content' | base64 -d
```

Expected: file exists and contains `const price = 15;`

- [ ] **Step 2: If file doesn't exist, create it**

If the file is missing, create `script.js` in the demo repo:

```bash
gh api repos/terdessa/hachiko-demo/contents/script.js \
  --method PUT \
  --field message="Initial demo site script" \
  --field content="$(echo -n 'const price = 15;
document.getElementById("price").textContent = `$${price}`;' | base64)"
```

- [ ] **Step 3: Verify the file is correct**

```bash
gh api repos/terdessa/hachiko-demo/contents/script.js --jq '.content' | base64 -d
```

Expected: `const price = 15;`

---

## Task 8: End-to-End Test

- [ ] **Step 1: Start the app**

```bash
node src/app.js
```

Expected:
```
✅ GitHub App authenticated
⚡ Hachiko is running (Socket Mode)
```

- [ ] **Step 2: Post in Slack**

Post: `The website still shows $15 but it should be $20`

Expected: Hachiko replies with confirmation prompt

- [ ] **Step 3: Confirm**

Reply: `Yes`

Expected: Real PR created at `https://github.com/terdessa/hachiko-demo/pull/N`

- [ ] **Step 4: Verify PR on GitHub**

Check that the PR:
- Has branch `hachiko/update-price-15-to-20`
- Shows diff: `const price = 15` → `const price = 20`
- Has clean title and body

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: adjustments from end-to-end testing"
```

---

## Integration Contract

This is the contract that Person 1's code already depends on:

```js
// Function signature
async function createPriceUpdatePR(octokit, { oldPrice, newPrice, owner, repo, targetFile })

// Returns
{ prUrl: string, prNumber: number, branchName: string, summary: string }

// Throws on failure
```

Note: The function now takes `octokit` as first arg (initialized at app startup). The `app.js` in Task 5 handles passing it through.
