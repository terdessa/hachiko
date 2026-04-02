const messages = require('../src/messages');

describe('messages', () => {
  test('confirmationPrompt returns confirmation string', () => {
    const result = messages.confirmationPrompt(15, 20);
    expect(result).toBe('I can update that and open a pull request. Proceed?');
  });

  test('startAck returns starting message', () => {
    expect(messages.startAck()).toBe('Starting now.');
  });

  test('success formats PR link and summary', () => {
    const result = messages.success({
      prUrl: 'https://github.com/org/repo/pull/1',
      oldPrice: 15,
      newPrice: 20,
    });
    expect(result).toContain('https://github.com/org/repo/pull/1');
    expect(result).toContain('$15');
    expect(result).toContain('$20');
  });

  test('error returns error message', () => {
    const result = messages.error();
    expect(result).toContain('Something went wrong');
  });
});
