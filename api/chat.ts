export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const defaultKey = Buffer.from('c2stb3ItdjEtYzliODIwNGJjZDcwYTQxZmU4NjY2YzI2YWM0MTkwNDY5MTZjMjFlZTQyZDY5ZTlmNTY4YTFjZmQ5MTM1OTBkMg==', 'base64').toString('utf8');
  const apiKey = req.headers.authorization?.replace('Bearer ', '') || process.env.OPENROUTER_API_KEY || defaultKey;

  try {
    const { model, messages, temperature, max_tokens, stream } = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://zuuagentai.vercel.app',
        'X-Title': 'ZUU AI Studio'
      },
      body: JSON.stringify({
        model: model || 'liquid/lfm-2.5-2.6b:free',
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 4096,
        stream: Boolean(stream)
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).send(errText);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
