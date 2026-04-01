// ==================== AI ANALYSIS MODULE ====================
// Calls your Vercel backend (where OpenRouter API is securely stored)
// Your backend should be at: https://veritas-flax-eta.vercel.app/api/analyze

const AI_ANALYSIS = {
  // YOUR VERCEL API ENDPOINT - Update this if different!
  API_URL: 'https://veritas-flax-eta.vercel.app/api/analyze',
  
  // Analyze photo by calling your Vercel backend
  async analyzePhoto(imageDataUrl, infrastructureType = null) {
    console.log('📤 Sending to Vercel backend at:', this.API_URL);
    
    try {
      // Extract the base64 image data (remove the data:image/jpeg;base64, prefix)
      const base64Image = imageDataUrl.split(',')[1];
      
      if (!base64Image || base64Image.length < 100) {
        throw new Error('Invalid image data');
      }
      
      // Call YOUR Vercel backend
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          infrastructureType: infrastructureType,
          timestamp: new Date().toISOString()
        })
      });
      
      // Check response
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend Error:', response.status, errorText);
        throw new Error(`Backend error: ${response.status}`);
      }
      
      // Parse response from your backend
      const result = await response.json();
      console.log('📥 Backend response:', result);
      
      // Map damage level to display text
      const damageMap = {
        'minimal': 'Minimal / No damage',
        'partial': 'Partially damaged',
        'complete': 'Completely damaged'
      };
      
      // Map to internal tier
      const tierMap = {
        'minimal': 'minimal',
        'partial': 'partial',
        'complete': 'complete'
      };
      
      return {
        success: true,
        damage_level: damageMap[result.damage_level] || 'Unknown',
        internal_tier: tierMap[result.damage_level] || null,
        score: result.score || (result.damage_level === 'complete' ? 0.9 : 
                               result.damage_level === 'partial' ? 0.6 : 0.3),
        confidence: Math.min(0.95, Math.max(0.3, result.confidence || 0.7)),
        description: result.description || 'Analysis complete',
        model_used: result.model || 'vercel-backend',
        is_mock: false
      };
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      return this.fallback(error.message);
    }
  },
  
  // Fallback when backend fails
  fallback(errorMsg = null) {
    const random = Math.random();
    let damage = 'partial';
    if (random > 0.7) damage = 'complete';
    if (random < 0.3) damage = 'minimal';
    
    const damageMap = {
      'minimal': 'Minimal / No damage',
      'partial': 'Partially damaged',
      'complete': 'Completely damaged'
    };
    
    return {
      success: false,
      damage_level: damageMap[damage],
      internal_tier: damage,
      score: damage === 'complete' ? 0.85 : damage === 'partial' ? 0.55 : 0.25,
      confidence: 0.5 + Math.random() * 0.3,
      description: errorMsg || 'AI backend unavailable - using fallback scoring',
      model_used: 'fallback',
      is_mock: true,
      error: errorMsg
    };
  },
  
  // Test if your Vercel backend is reachable
  async testBackend() {
    console.log('Testing backend at:', this.API_URL);
    try {
      const response = await fetch(this.API_URL, {
        method: 'OPTIONS',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok || response.status === 405) {
        // OPTIONS might not be supported, but if we get any response, it's reachable
        console.log('✅ Backend reachable');
        return { success: true, message: 'Backend is online' };
      } else {
        return { success: false, error: `Status: ${response.status}` };
      }
    } catch (error) {
      console.error('❌ Backend unreachable:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  // Kept for compatibility
  setApiKey() { 
    console.log('API key is managed on Vercel backend');
    return true; 
  },
  
  isConfigured() { 
    return true;
  }
};

console.log('✅ AI Analysis module loaded');
console.log('📡 Backend URL:', AI_ANALYSIS.API_URL);