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
  githubRepo: process.env.GITHUB_REPO || 'hachiko-demo-repo',
  githubTargetFile: process.env.GITHUB_TARGET_FILE || 'src/price.js',
};
