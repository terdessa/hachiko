async function createPriceUpdatePR(octokit, { oldPrice, newPrice, owner, repo, targetFile }) {
  const branchName = `hachiko/update-price-${oldPrice}-to-${newPrice}`;
  const ref = `heads/${branchName}`;

  // 1. Get main branch SHA
  const { data: mainBranch } = await octokit.repos.getBranch({
    owner,
    repo,
    branch: 'main',
  });
  const baseSha = mainBranch.commit.sha;

  // 2. Delete existing branch if it exists (for demo reruns)
  try {
    await octokit.git.getRef({ owner, repo, ref });
    await octokit.git.deleteRef({ owner, repo, ref });
  } catch (err) {
    // Branch doesn't exist — that's fine
  }

  // 3. Create new branch from main
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/${ref}`,
    sha: baseSha,
  });

  // 4. Get current file content
  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: targetFile,
    ref: branchName,
  });

  const currentContent = Buffer.from(fileData.content, 'base64').toString('utf8');

  // 5. Replace price
  const oldPattern = `export const PRICE_USD = ${oldPrice};`;
  if (!currentContent.includes(oldPattern)) {
    throw new Error(`Price value "${oldPattern}" not found in ${targetFile}`);
  }

  const newContent = currentContent.replace(oldPattern, `export const PRICE_USD = ${newPrice};`);

  // 6. Commit the change
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: targetFile,
    message: `Update website price from $${oldPrice} to $${newPrice}`,
    content: Buffer.from(newContent).toString('base64'),
    sha: fileData.sha,
    branch: branchName,
  });

  // 7. Open PR
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: `Update website price from $${oldPrice} to $${newPrice}`,
    head: branchName,
    base: 'main',
    body: `## Price Update\n\nUpdated \`${targetFile}\`: changed price from **$${oldPrice}** to **$${newPrice}**.\n\nCreated by Hachiko`,
  });

  return {
    prUrl: pr.html_url,
    prNumber: pr.number,
    branchName,
    summary: `Updated homepage price from $${oldPrice} to $${newPrice}`,
  };
}

module.exports = { createPriceUpdatePR };
