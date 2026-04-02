const SYSTEM_PROMPT = `You are a message classifier for a Slack bot called Hachiko.

Your job: determine if a Slack message is a request to change a price on a website.

Rules:
- A price-change request mentions an OLD price and a NEW price for a website/page/product.
- Casual conversation, greetings, questions, or unrelated messages are NOT price-change requests.
- Extract the numeric values only (no dollar signs).

Respond with ONLY valid JSON, no other text:
- Price change detected: {"isPriceChange": true, "oldPrice": <number>, "newPrice": <number>}
- Not a price change: {"isPriceChange": false}`;

async function classifyMessage(anthropicClient, messageText) {
  try {
    const response = await anthropicClient.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: messageText }],
    });

    const text = response.content[0].text.trim();
    const parsed = JSON.parse(text);

    if (parsed.isPriceChange && typeof parsed.oldPrice === 'number' && typeof parsed.newPrice === 'number') {
      return { oldPrice: parsed.oldPrice, newPrice: parsed.newPrice };
    }

    return null;
  } catch (err) {
    console.error('Classifier error:', err.message);
    return null;
  }
}

module.exports = { classifyMessage, SYSTEM_PROMPT };
