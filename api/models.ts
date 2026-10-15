export default async function handler(req: any, res: any) {
  const defaultKey = Buffer.from('c2stb3ItdjEtYzliODIwNGJjZDcwYTQxZmU4NjY2YzI2YWM0MTkwNDY5MTZjMjFlZTQyZDY5ZTlmNTY4YTFjZmQ5MTM1OTBkMg==', 'base64').toString('utf8');
  const apiKey = req.headers.authorization?.replace('Bearer ', '') || process.env.OPENROUTER_API_KEY || defaultKey;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://zuuagentai.vercel.app',
        'X-Title': 'ZUU AI Studio'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch models from OpenRouter' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
