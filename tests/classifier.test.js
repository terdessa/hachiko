const { classifyMessage } = require('../src/classifier');

// Mock the OpenAI SDK
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

const OpenAI = require('openai');

describe('classifyMessage', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = new OpenAI();
  });

  test('detects price change and extracts prices', async () => {
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: '{"isPriceChange": true, "oldPrice": 15, "newPrice": 20}' } }],
    });

    const result = await classifyMessage(
      mockClient,
      'The website still shows $15, but we changed it to $20'
    );

    expect(result).toEqual({ oldPrice: 15, newPrice: 20 });
  });

  test('returns null for casual chat', async () => {
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: '{"isPriceChange": false}' } }],
    });

    const result = await classifyMessage(mockClient, 'hey team, lunch at noon?');
    expect(result).toBeNull();
  });

  test('returns null if LLM response is malformed', async () => {
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: 'not json' } }],
    });

    const result = await classifyMessage(mockClient, 'some message');
    expect(result).toBeNull();
  });

  test('returns null if LLM call fails', async () => {
    mockClient.chat.completions.create.mockRejectedValue(new Error('API error'));

    const result = await classifyMessage(mockClient, 'some message');
    expect(result).toBeNull();
  });
});
