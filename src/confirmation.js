class ThreadStateManager {
  constructor() {
    this.threads = new Map();
  }

  startConfirmation(threadTs, { oldPrice, newPrice }) {
    this.threads.set(threadTs, {
      status: 'AWAITING_CONFIRMATION',
      oldPrice,
      newPrice,
    });
  }

  confirm(threadTs) {
    const state = this.threads.get(threadTs);
    if (!state || state.status !== 'AWAITING_CONFIRMATION') {
      return false;
    }
    state.status = 'PROCESSING';
    return true;
  }

  markDone(threadTs) {
    const state = this.threads.get(threadTs);
    if (state) state.status = 'DONE';
  }

  markError(threadTs) {
    const state = this.threads.get(threadTs);
    if (state) state.status = 'ERROR';
  }

  getState(threadTs) {
    return this.threads.get(threadTs) || null;
  }

  isProcessedThread(threadTs) {
    const state = this.threads.get(threadTs);
    return state ? state.status === 'DONE' : false;
  }
}

module.exports = { ThreadStateManager };
