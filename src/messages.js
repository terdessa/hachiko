module.exports = {
  confirmationPrompt(oldPrice, newPrice) {
    return 'I can update that and open a pull request. Proceed?';
  },

  startAck() {
    return 'Starting now.';
  },

  success({ prUrl, oldPrice, newPrice }) {
    return `Done. Pull request created: ${prUrl}\nSummary: updated homepage price from $${oldPrice} to $${newPrice}.`;
  },

  error() {
    return 'Something went wrong while creating the PR. Please try again.';
  },
};
