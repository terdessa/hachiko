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
