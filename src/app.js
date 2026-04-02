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
