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
