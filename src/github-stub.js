/**
 * Stub for Person 2's GitHub PR pipeline.
 * Replace this with the real import after merging Person 2's branch.
 *
 * Expected real function signature:
 *   createPriceUpdatePR({ oldPrice, newPrice }) → { prUrl, prNumber, branchName, summary }
 */
async function createPriceUpdatePR({ oldPrice, newPrice }) {
  console.log(`[STUB] Would create PR: update price from $${oldPrice} to $${newPrice}`);

  // Simulate a 2-second delay to mimic real API calls
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    prUrl: `https://github.com/terdessa/hachiko-demo/pull/1`,
    prNumber: 1,
    branchName: `hachiko/update-price-${oldPrice}-to-${newPrice}`,
    summary: `Updated homepage price from $${oldPrice} to $${newPrice}`,
  };
}

module.exports = { createPriceUpdatePR };
