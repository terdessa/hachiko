const { ThreadStateManager } = require('../src/confirmation');

describe('ThreadStateManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ThreadStateManager();
  });

  test('startConfirmation creates AWAITING_CONFIRMATION state', () => {
    manager.startConfirmation('ts123', { oldPrice: 15, newPrice: 20 });
    const state = manager.getState('ts123');
    expect(state.status).toBe('AWAITING_CONFIRMATION');
    expect(state.oldPrice).toBe(15);
    expect(state.newPrice).toBe(20);
  });

  test('confirm transitions to PROCESSING', () => {
    manager.startConfirmation('ts123', { oldPrice: 15, newPrice: 20 });
    const result = manager.confirm('ts123');
    expect(result).toBe(true);
    expect(manager.getState('ts123').status).toBe('PROCESSING');
  });

  test('confirm returns false if not AWAITING_CONFIRMATION', () => {
    expect(manager.confirm('ts123')).toBe(false);
  });

  test('confirm returns false if already PROCESSING', () => {
    manager.startConfirmation('ts123', { oldPrice: 15, newPrice: 20 });
    manager.confirm('ts123');
    expect(manager.confirm('ts123')).toBe(false);
  });

  test('markDone transitions to DONE', () => {
    manager.startConfirmation('ts123', { oldPrice: 15, newPrice: 20 });
    manager.confirm('ts123');
    manager.markDone('ts123');
    expect(manager.getState('ts123').status).toBe('DONE');
  });

  test('markError transitions to ERROR', () => {
    manager.startConfirmation('ts123', { oldPrice: 15, newPrice: 20 });
    manager.confirm('ts123');
    manager.markError('ts123');
    expect(manager.getState('ts123').status).toBe('ERROR');
  });

  test('isProcessedThread returns true for DONE threads', () => {
    manager.startConfirmation('ts123', { oldPrice: 15, newPrice: 20 });
    manager.confirm('ts123');
    manager.markDone('ts123');
    expect(manager.isProcessedThread('ts123')).toBe(true);
  });

  test('getState returns null for unknown thread', () => {
    expect(manager.getState('unknown')).toBeNull();
  });
});
