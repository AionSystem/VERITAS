// ==================== AI ANALYSIS MODULE ====================
// Uses OpenRouter API with Sonnet 3.5 (primary) and DeepSeek (fallback)
// Runs in browser, returns damage assessment for CERTUS Engine

const AI_ANALYSIS = {
  // OpenRouter configuration
  OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',
  
  // Model configuration - Updated with working models
  MODELS: {
    primary: {
      id: 'anthropic/claude-3.5-sonnet:beta',
      name: 'Claude 3.5 Sonnet',
      priority: 1
    },
    fallback: {
      id: 'google/gemini-2.0-flash-exp:free',
      name: 'Gemini 2.0 Flash',
      priority: 2
    }
  },
  
  // Current API key
  apiKey: null,
  
  // Cache for analyzed photos
  cache: new Map(),
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,
  
  // Set API key
  setApiKey(key) {
    if (key && key.trim()) {
      this.apiKey = key.trim();
      console.log('[AI_ANALYSIS] API key configured successfully');
      return true;
    }
    console.warn('[AI_ANALYSIS] Invalid API key provided');
    return false;
  },
  
  // Check if API is configured
  isConfigured() {
    return !!(this.apiKey && this.apiKey.length > 0);
  },
  
  // Main analyze function
  async analyzePhoto(imageDataUrl, infrastructureType = null) {
    // Check if configured
    if (!this.isConfigured()) {
      console.warn('[AI_ANALYSIS] No API key configured');
      return this.getFallbackResponse('No API key configured');
    }
    
    // Validate image
    if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) {
      console.error('[AI_ANALYSIS] Invalid image data');
      return this.getFallbackResponse('Invalid image data');
    }
    
    // Check cache
    const cacheKey = `${infrastructureType || 'none'}_${imageDataUrl.slice(0, 100)}`;
    if (this.cache.has(cacheKey)) {
      console.log('[AI_ANALYSIS] Using cached result');
      return this.cache.get(cacheKey);
    }
    
    // Extract base64 data (remove the data:image prefix)
    const base64Image = imageDataUrl.split(',')[1];
    if (!base64Image) {
      console.error('[AI_ANALYSIS] Failed to extract base64 data');
      return this.getFallbackResponse('Image encoding error');
    }
    
    // Build prompt
    const prompt = this.buildPrompt(infrastructureType);
    
    // Try primary model with retry, then fallback
    let result = null;
    let modelUsed = null;
    let lastError = null;
    
    // Try primary model
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[AI_ANALYSIS] Attempt ${attempt} with primary model: ${this.MODELS.primary.name}`);
        result = await this.callOpenRouter(base64Image, prompt, this.MODELS.primary.id);
        modelUsed = this.MODELS.primary.id;
        break; // Success, exit loop
      } catch (error) {
        lastError = error;
        console.warn(`[AI_ANALYSIS] Primary model attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    // If primary failed, try fallback
    if (!result) {
      console.log('[AI_ANALYSIS] Trying fallback model...');
      try {
        result = await this.callOpenRouter(base64Image, prompt, this.MODELS.fallback.id);
        modelUsed = this.MODELS.fallback.id;
      } catch (fallbackError) {
        console.error('[AI_ANALYSIS] Fallback model also failed:', fallbackError);
        lastError = fallbackError;
      }
    }
    
    // Parse result or return fallback
    let assessment;
    if (result) {
      assessment = this.parseResponse(result, modelUsed);
    } else {
      assessment = this.getFallbackResponse(lastError?.message || 'All models failed');
    }
    
    // Cache result (even fallback)
    this.cache.set(cacheKey, assessment);
    
    return assessment;
  },
  
  // Build the prompt
  buildPrompt(infrastructureType) {
    return `You are a disaster damage assessment expert. Analyze this photo and provide a damage assessment.

IMPORTANT: Respond with ONLY a valid JSON object, no other text.

{
  "damage_level": "minimal" OR "partial" OR "complete",
  "confidence": number between 0 and 1,
  "damage_description": "brief 1-2 sentence description",
  "infrastructure_verified": "${infrastructureType || 'unknown'}",
  "notes": "any notable observations"
}

Definitions:
- minimal: Little or no visible damage. Structure appears intact.
- partial: Significant visible damage but structure still standing.
- complete: Structure destroyed, collapsed, or completely unsafe.

Be honest about confidence. Low quality photos = low confidence.`;
  },
  
  // Call OpenRouter API
  async callOpenRouter(base64Image, prompt, modelId) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
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
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorText;
        try {
          const errorData = await response.json();
          errorText = errorData.error?.message || errorData.error || response.statusText;
        } catch {
          errorText = await response.text();
        }
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid API response structure');
      }
      
      const content = data.choices[0].message.content;
      
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[AI_ANALYSIS] No JSON found in response:', content.substring(0, 200));
        throw new Error('No JSON in response');
      }
      
      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('[AI_ANALYSIS] JSON parse error:', parseError);
        console.error('[AI_ANALYSIS] Raw JSON:', jsonMatch[0]);
        throw new Error('Failed to parse JSON response');
      }
      
      // Validate required fields
      if (!parsed.damage_level || !['minimal', 'partial', 'complete'].includes(parsed.damage_level)) {
        parsed.damage_level = 'partial'; // Default fallback
      }
      
      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
        parsed.confidence = 0.7;
      }
      
      return parsed;
      
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout after 30 seconds');
      }
      throw error;
    }
  },
  
  // Parse response for CERTUS Engine
  parseResponse(assessment, modelUsed) {
    // Map damage level to display text
    const damageMap = {
      minimal: 'Minimal / No damage',
      partial: 'Partially damaged',
      complete: 'Completely damaged'
    };
    
    // Map to internal tier
    const tierMap = {
      minimal: 'minimal',
      partial: 'partial',
      complete: 'complete'
    };
    
    // Calculate score based on damage level
    const scoreMap = {
      minimal: 0.25,
      partial: 0.6,
      complete: 0.9
    };
    
    return {
      success: true,
      damage_level: damageMap[assessment.damage_level] || 'Unknown',
      internal_tier: tierMap[assessment.damage_level] || null,
      score: scoreMap[assessment.damage_level] || 0.5,
      confidence: Math.min(0.95, Math.max(0.3, assessment.confidence)),
      description: assessment.damage_description || 'Damage assessment completed',
      notes: assessment.notes || '',
      model_used: modelUsed,
      timestamp: new Date().toISOString(),
      is_mock: false
    };
  },
  
  // Fallback response when API fails
  getFallbackResponse(errorMessage = null) {
    return {
      success: false,
      damage_level: 'Unknown',
      internal_tier: null,
      score: 0.5 + (Math.random() * 0.3),
      confidence: 0.4 + (Math.random() * 0.3),
      description: errorMessage ? `AI analysis failed: ${errorMessage}` : 'AI analysis unavailable (offline/error mode)',
      notes: 'Using fallback scoring. Check API key and internet connection.',
      model_used: 'fallback',
      timestamp: new Date().toISOString(),
      is_mock: true,
      error: errorMessage
    };
  },
  
  // Helper: convert dataURL to Blob
  async dataURLtoBlob(dataURL) {
    const response = await fetch(dataURL);
    return await response.blob();
  },
  
  // Get model status
  getModelStatus() {
    return {
      primary: this.MODELS.primary,
      fallback: this.MODELS.fallback,
      hasKey: !!this.apiKey,
      isConfigured: this.isConfigured(),
      cacheSize: this.cache.size
    };
  },
  
  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('[AI_ANALYSIS] Cache cleared');
  },
  
  // Test API key
  async testApiKey() {
    if (!this.isConfigured()) {
      return { success: false, error: 'No API key configured' };
    }
    
    try {
      // Simple test query
      const response = await fetch(this.OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.MODELS.fallback.id,
          messages: [
            {
              role: 'user',
              content: 'Hello, please respond with "OK"'
            }
          ],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        return { success: true, message: 'API key is valid' };
      } else {
        const error = await response.text();
        return { success: false, error: `API error: ${response.status} - ${error}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Initialize from localStorage if available
if (typeof window !== 'undefined') {
  const savedKey = localStorage.getItem('openrouter_api_key');
  if (savedKey) {
    AI_ANALYSIS.setApiKey(savedKey);
    console.log('[AI_ANALYSIS] Loaded API key from localStorage');
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.AI_ANALYSIS = AI_ANALYSIS;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AI_ANALYSIS;
}