// api/analyze.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { image, infrastructureType } = req.body;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; // Store this in Vercel env vars
    
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }
    
    const prompt = `Analyze this damage photo. Respond with ONLY JSON:
{"damage_level":"minimal or partial or complete","confidence":0.0-1.0}`;
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://veritas-flax-eta.vercel.app',
    'X-Title': 'VERITAS Damage Assessment'
  },
  body: JSON.stringify({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
      ]
    }],
    max_tokens: 100
  })
});
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch[0]);
    
    return res.status(200).json({
      damage_level: result.damage_level,
      confidence: result.confidence,
      score: result.damage_level === 'complete' ? 0.9 : 
             result.damage_level === 'partial' ? 0.6 : 0.3
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}