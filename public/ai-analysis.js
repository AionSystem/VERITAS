// ==================== SIMPLE WORKING AI ANALYSIS ====================
// For VERITAS - OpenRouter API Integration
// Just works. No complexity.

const AI_ANALYSIS = {
  apiKey: null,
  
  // Set your API key
  setApiKey(key) {
    if (key && key.trim()) {
      this.apiKey = key.trim();
      localStorage.setItem('openrouter_api_key', this.apiKey);
      console.log('✅ API key saved');
      return true;
    }
    return false;
  },
  
  // Check if we have a key
  isConfigured() {
    return !!(this.apiKey && this.apiKey.length > 20);
  },
  
  // Analyze a photo
  async analyzePhoto(imageDataUrl, infrastructureType = null) {
    // If no key, try to load from storage
    if (!this.apiKey) {
      const saved = localStorage.getItem('openrouter_api_key');
      if (saved) this.apiKey = saved;
    }
    
    // Still no key? Use fallback
    if (!this.apiKey) {
      console.warn('⚠️ No API key - using fallback');
      return this.fallback();
    }
    
    try {
      // Extract the base64 image data
      const base64Image = imageDataUrl.split(',')[1];
      
      // Simple prompt
      const prompt = `Analyze this damage photo. Respond with ONLY JSON:
{"damage_level":"minimal or partial or complete","confidence":0.0-1.0}`;
      
      console.log('📤 Sending to OpenRouter...');
      
      // Call OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'VERITAS'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageDataUrl } }
            ]
          }],
          max_tokens: 100
        })
      });
      
      // Check response
      if (!response.ok) {
        const error = await response.text();
        console.error('❌ API Error:', response.status, error);
        throw new Error(`API error: ${response.status}`);
      }
      
      // Parse response
      const data = await response.json();
      const content = data.choices[0].message.content;
      console.log('📥 Response:', content);
      
      // Extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      
      const result = JSON.parse(jsonMatch[0]);
      
      // Map to our format
      const damageMap = {
        'minimal': 'Minimal / No damage',
        'partial': 'Partially damaged',
        'complete': 'Completely damaged'
      };
      
      return {
        success: true,
        damage_level: damageMap[result.damage_level] || 'Unknown',
        internal_tier: result.damage_level,
        score: result.damage_level === 'complete' ? 0.9 : 
               result.damage_level === 'partial' ? 0.6 : 0.3,
        confidence: Math.min(0.95, result.confidence || 0.7),
        model_used: 'gemini-2.0-flash',
        is_mock: false
      };
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      return this.fallback(error.message);
    }
  },
  
  // Simple fallback when API fails
  fallback(errorMsg = null) {
    const random = Math.random();
    let damage = 'partial';
    if (random > 0.7) damage = 'complete';
    if (random < 0.3) damage = 'minimal';
    
    return {
      success: false,
      damage_level: damage === 'minimal' ? 'Minimal / No damage' :
                    damage === 'partial' ? 'Partially damaged' : 'Completely damaged',
      internal_tier: damage,
      score: damage === 'complete' ? 0.85 : damage === 'partial' ? 0.55 : 0.25,
      confidence: 0.5 + Math.random() * 0.3,
      model_used: 'fallback',
      is_mock: true,
      error: errorMsg
    };
  },
  
  // Test if API key works
  async testApiKey() {
    if (!this.apiKey) return { success: false, error: 'No API key set' };
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      if (response.ok) {
        return { success: true, message: 'API key is valid' };
      } else {
        return { success: false, error: `Invalid key (${response.status})` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Auto-load saved key on startup
const savedKey = localStorage.getItem('openrouter_api_key');
if (savedKey) {
  AI_ANALYSIS.setApiKey(savedKey);
  console.log('✅ Loaded saved API key');
}

console.log('✅ AI Analysis module ready');