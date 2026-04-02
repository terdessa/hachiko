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
