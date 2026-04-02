const { createPriceUpdatePR } = require('../src/github-pipeline');

describe('createPriceUpdatePR', () => {
  let mockOctokit;

  beforeEach(() => {
    mockOctokit = {
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
      git: {
        createRef: jest.fn().mockResolvedValue({ data: {} }),
        getRef: jest.fn().mockRejectedValue({ status: 404 }),
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
