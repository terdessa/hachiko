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
