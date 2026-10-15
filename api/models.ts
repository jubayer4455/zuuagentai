export default async function handler(req: any, res: any) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '') || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(401).json({ error: 'OpenRouter API key is missing. Configure OPENROUTER_API_KEY in environment variables.' });
  }

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
