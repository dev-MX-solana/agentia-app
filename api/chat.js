// api/chat.js — Vercel Serverless Function
// Proxy sécurisé vers l'API Anthropic + vérification Stripe

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, system, model, max_tokens, uid, plan } = req.body;

    // Vérification basique
    if (!messages || !uid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Vérification plan — les plans gratuits ont une limite de messages/jour
    // Pour l'instant on accepte tout (Stripe sera ajouté après)
    // TODO: vérifier Stripe subscription via uid

    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Appel Anthropic
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 1500,
        system: system || '',
        messages
      })
    });

    const data = await anthropicRes.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
