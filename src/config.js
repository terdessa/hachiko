require('dotenv').config();

module.exports = {
  slackBotToken: process.env.SLACK_BOT_TOKEN,
  slackAppToken: process.env.SLACK_APP_TOKEN,
  openaiApiKey: process.env.OPENAI_API_KEY,
  channelId: process.env.SLACK_CHANNEL_ID,
};
