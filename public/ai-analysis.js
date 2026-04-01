// ==================== AI ANALYSIS MODULE ====================
// Calls your Vercel backend API for OpenRouter AI analysis
// Complete file - copy this entire code

const AI_ANALYSIS = {
  // UPDATE THIS URL WITH YOUR ACTUAL VERCEL API ENDPOINT
  API_URL: 'https://veritas-flax-eta.vercel.app/api/openrouter',
  
  // Analyze a photo by calling your Vercel backend
  async analyzePhoto(imageDataUrl, infrastructureType = null) {
    console.log('📤 Sending to Vercel backend...');
    
    try {
      // Extract the base64 image data
      const base64Image = imageDataUrl.split(',')[1];
      
      // Call YOUR backend
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
        const error = await response.text();
        console.error('❌ Backend Error:', response.status, error);
        throw new Error(`Backend error: ${response.status}`);
      }
      
      // Parse response from your backend
      const result = await response.json();
      console.log('📥 Backend response:', result);
      
      // Map to VERITAS format
      const damageMap = {
        'minimal': 'Minimal / No damage',
        'partial': 'Partially damaged',
        'complete': 'Completely damaged'
      };
      
      return {
        success: true,
        damage_level: damageMap[result.damage_level] || 'Unknown',
        internal_tier: result.damage_level,
        score: result.score || (result.damage_level === 'complete' ? 0.9 : 
                               result.damage_level === 'partial' ? 0.6 : 0.3),
        confidence: result.confidence || 0.7,
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
    
    return {
      success: false,
      damage_level: damage === 'minimal' ? 'Minimal / No damage' :
                    damage === 'partial' ? 'Partially damaged' : 'Completely damaged',
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
    try {
      const response = await fetch(this.API_URL, {
        method: 'HEAD',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
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
    console.log('⚠️ API key is managed on Vercel backend, not in browser');
    return true; 
  },
  
  isConfigured() { 
    return true;
  }
};

console.log('✅ AI Analysis module ready - calling Vercel backend');
