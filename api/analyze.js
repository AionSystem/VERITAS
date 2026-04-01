// api/analyze.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { image, infrastructureType } = req.body;
    
    // IMPORTANT: Get API key from environment variable
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    
    if (!OPENROUTER_API_KEY) {
      console.error('OpenRouter API key not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    console.log('API Key found, length:', OPENROUTER_API_KEY.length);
    
    const prompt = `Analyze this damage photo. Respond with ONLY JSON:
{
  "damage_level": "minimal" or "partial" or "complete",
  "confidence": 0.0-1.0
}`;
    
    // Use a working model - these are confirmed working:
    // 'meta-llama/llama-3.2-11b-vision-instruct:free' (free)
    // 'openai/gpt-4o-mini' (paid)
    // 'anthropic/claude-3-haiku' (paid)
    
    console.log('Calling OpenRouter with model: meta-llama/llama-3.2-11b-vision-instruct:free');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://veritas-flax-eta.vercel.app',
        'X-Title': 'VERITAS Damage Assessment'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-11b-vision-instruct:free', // Working free model
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
          ]
        }],
        max_tokens: 100,
        temperature: 0.3
      })
    });
    
    console.log('OpenRouter response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `OpenRouter error: ${response.status}`,
        details: errorText
      });
    }
    
    const data = await response.json();
    console.log('OpenRouter response received successfully');
    
    // Check if response has the expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenRouter response structure:', JSON.stringify(data));
      throw new Error('Invalid response from OpenRouter API');
    }
    
    const content = data.choices[0].message.content;
    console.log('OpenRouter content:', content);
    
    // Extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      throw new Error('No JSON in OpenRouter response');
    }
    
    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse JSON from OpenRouter');
    }
    
    // Validate result
    if (!result.damage_level || !['minimal', 'partial', 'complete'].includes(result.damage_level)) {
      result.damage_level = 'partial';
    }
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      result.confidence = 0.7;
    }
    
    // Return to frontend
    return res.status(200).json({
      damage_level: result.damage_level,
      confidence: result.confidence,
      score: result.damage_level === 'complete' ? 0.9 : 
             result.damage_level === 'partial' ? 0.6 : 0.3,
      model: 'llama-3.2-11b-vision'
    });
    
  } catch (error) {
    console.error('API Error:', error.message);
    return res.status(500).json({ 
      error: error.message,
      details: error.stack
    });
  }
}