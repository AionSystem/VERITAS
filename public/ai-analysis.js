// ==================== AI ANALYSIS MODULE ====================
// Uses OpenRouter API with Sonnet 3.5 (primary) and DeepSeek (fallback)
// Runs in browser, returns damage assessment for CERTUS Engine

const AI_ANALYSIS = {
  // OpenRouter configuration
  OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',
  
  // Model configuration
  MODELS: {
    primary: {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      priority: 1
    },
    fallback: {
      id: 'deepseek/deepseek-chat',
      name: 'DeepSeek',
      priority: 2
    }
  },
  
  // Current API key (set via environment or user input)
  apiKey: null,
  
  // Cache for analyzed photos (avoid re-analyzing)
  cache: new Map(),
  
  // Set API key (from environment or user)
  setApiKey(key) {
    this.apiKey = key;
  },
  
  // Analyze a photo and return damage assessment
  async analyzePhoto(imageDataUrl, infrastructureType = null) {
    if (!this.apiKey) {
      console.warn('[AI_ANALYSIS] No API key set');
      return this.getMockResponse();
    }
    
    // Check cache
    const cacheKey = imageDataUrl.slice(0, 100);
    if (this.cache.has(cacheKey)) {
      console.log('[AI_ANALYSIS] Using cached result');
      return this.cache.get(cacheKey);
    }
    
    // Convert base64 to blob for analysis
    const imageBlob = await this.dataURLtoBlob(imageDataUrl);
    const base64Image = imageDataUrl.split(',')[1];
    
    // Build prompt
    const prompt = this.buildPrompt(infrastructureType);
    
    // Try primary model, fallback to secondary if needed
    let result = null;
    let modelUsed = null;
    
    try {
      result = await this.callOpenRouter(base64Image, prompt, this.MODELS.primary.id);
      modelUsed = this.MODELS.primary.id;
    } catch (primaryError) {
      console.warn('[AI_ANALYSIS] Primary model failed:', primaryError);
      try {
        result = await this.callOpenRouter(base64Image, prompt, this.MODELS.fallback.id);
        modelUsed = this.MODELS.fallback.id;
      } catch (fallbackError) {
        console.error('[AI_ANALYSIS] Both models failed:', fallbackError);
        return this.getMockResponse();
      }
    }
    
    // Parse result
    const assessment = this.parseResponse(result, modelUsed);
    
    // Cache result
    this.cache.set(cacheKey, assessment);
    
    return assessment;
  },
  
  // Build the prompt for damage assessment
  buildPrompt(infrastructureType) {
    return `You are a disaster damage assessment AI. Analyze this photo of damaged infrastructure.

Please respond with a JSON object only (no other text):

{
  "damage_level": "minimal" | "partial" | "complete",
  "confidence": 0.0 to 1.0,
  "damage_description": "brief description of observed damage",
  "infrastructure_verified": "${infrastructureType || 'unknown'}",
  "notes": "any notable observations"
}

Damage level definitions:
- minimal: Little or no visible structural impact. Building appears functional.
- partial: Significant damage but structure still standing. May have cracks, broken windows, partial collapse.
- complete: Structure destroyed, total collapse, or unsafe to enter.

Be honest about confidence. If the photo is unclear or doesn't show the building well, set confidence low.`;
  },
  
  // Call OpenRouter API with image
  async callOpenRouter(base64Image, prompt, modelId) {
    const response = await fetch(this.OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'VERITAS Damage Assessment'
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }
    
    return JSON.parse(jsonMatch[0]);
  },
  
  // Parse response and format for CERTUS Engine
  parseResponse(assessment, modelUsed) {
    // Map damage level to CERTUS format
    const damageMap = {
      minimal: 'Minimal / No damage',
      partial: 'Partially damaged',
      complete: 'Completely damaged'
    };
    
    // Map to internal tier for CERTUS
    const tierMap = {
      minimal: 'minimal',
      partial: 'partial',
      complete: 'complete'
    };
    
    return {
      success: true,
      damage_level: damageMap[assessment.damage_level] || 'Minimal / No damage',
      internal_tier: tierMap[assessment.damage_level] || 'minimal',
      score: assessment.damage_level === 'complete' ? 0.9 : 
             assessment.damage_level === 'partial' ? 0.6 : 0.3,
      confidence: Math.min(0.95, Math.max(0.5, assessment.confidence || 0.7)),
      description: assessment.damage_description || '',
      notes: assessment.notes || '',
      model_used: modelUsed,
      timestamp: new Date().toISOString()
    };
  },
  
  // Fallback mock response when API unavailable
  getMockResponse() {
    return {
      success: true,
      damage_level: 'Unknown',
      internal_tier: null,
      score: 0.5,
      confidence: 0.3,
      description: 'AI analysis unavailable (offline mode)',
      notes: 'Using fallback scoring',
      model_used: 'mock',
      timestamp: new Date().toISOString(),
      is_mock: true
    };
  },
  
  // Helper: convert dataURL to Blob
  dataURLtoBlob(dataURL) {
    return fetch(dataURL).then(res => res.blob());
  },
  
  // Check if API is configured
  isConfigured() {
    return !!this.apiKey;
  },
  
  // Get model status
  getModelStatus() {
    return {
      primary: this.MODELS.primary,
      fallback: this.MODELS.fallback,
      hasKey: !!this.apiKey
    };
  }
};

// Export for use in index.html
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AI_ANALYSIS;
}
