// ==================== VERITAS AI ANALYSIS MODULE WITH DEBUGGER ====================
// Complete working version with OpenRouter API support
// Version: 2.5.1 - Debug Enhanced

const AI_ANALYSIS = (function() {
  'use strict';
  
  // ==================== CONFIGURATION ====================
  const CONFIG = {
    OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',
    MODELS: {
      primary: {
        id: 'google/gemini-2.0-flash-exp:free',
        name: 'Gemini 2.0 Flash',
        priority: 1,
        free: true
      },
      fallback: {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        priority: 2,
        free: false
      }
    },
    TIMEOUT_MS: 30000,
    MAX_RETRIES: 2,
    RETRY_DELAY_MS: 1000,
    DEBUG: true  // Enable debug logging
  };
  
  // ==================== STATE ====================
  let apiKey = null;
  let cache = new Map();
  let debugLog = [];
  let lastError = null;
  let requestCount = 0;
  let successCount = 0;
  
  // ==================== DEBUGGING UTILITIES ====================
  function log(message, level = 'info', data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, data };
    debugLog.push(logEntry);
    
    // Keep only last 100 logs
    if (debugLog.length > 100) debugLog.shift();
    
    if (CONFIG.DEBUG) {
      const logFn = level === 'error' ? console.error : 
                   level === 'warn' ? console.warn : 
                   console.log;
      logFn(`[AI_ANALYSIS] ${message}`, data || '');
    }
  }
  
  function error(message, error = null) {
    lastError = { message, error: error?.message || error, timestamp: new Date().toISOString() };
    log(message, 'error', error);
    return message;
  }
  
  // ==================== CORE FUNCTIONS ====================
  function setApiKey(key) {
    if (!key || typeof key !== 'string') {
      error('Invalid API key provided');
      return false;
    }
    
    const trimmedKey = key.trim();
    if (trimmedKey.length < 10) {
      error('API key too short');
      return false;
    }
    
    apiKey = trimmedKey;
    localStorage.setItem('openrouter_api_key', apiKey);
    log(`API key set successfully (length: ${apiKey.length})`, 'info');
    return true;
  }
  
  function isConfigured() {
    const configured = !!(apiKey && apiKey.length > 10);
    log(`isConfigured: ${configured}`, 'debug');
    return configured;
  }
  
  function getApiKey() {
    return apiKey;
  }
  
  // ==================== OPENROUTER API CALL ====================
  async function callOpenRouter(base64Image, prompt, modelId, attempt = 1) {
    const requestId = ++requestCount;
    log(`Request #${requestId}: Calling ${modelId} (attempt ${attempt})`, 'info');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      log(`Request #${requestId}: Timeout after ${CONFIG.TIMEOUT_MS}ms`, 'warn');
      controller.abort();
    }, CONFIG.TIMEOUT_MS);
    
    try {
      // Validate image data
      if (!base64Image || base64Image.length < 100) {
        throw new Error(`Invalid image data (length: ${base64Image?.length || 0})`);
      }
      
      // Prepare request body
      const requestBody = {
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
      };
      
      log(`Request #${requestId}: Sending to ${modelId}`, 'debug', { 
        promptLength: prompt.length, 
        imageSize: base64Image.length,
        model: modelId 
      });
      
      const response = await fetch(CONFIG.OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'VERITAS Damage Assessment'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      log(`Request #${requestId}: Response status ${response.status}`, 'debug');
      
      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.error?.message || JSON.stringify(errorData);
        } catch {
          errorDetail = await response.text();
        }
        throw new Error(`HTTP ${response.status}: ${errorDetail.substring(0, 200)}`);
      }
      
      const data = await response.json();
      log(`Request #${requestId}: Response received`, 'debug');
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from API');
      }
      
      const content = data.choices[0].message.content;
      log(`Request #${requestId}: AI response content length: ${content.length}`, 'debug');
      log(`Request #${requestId}: AI response preview: ${content.substring(0, 200)}`, 'debug');
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in AI response');
      }
      
      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
        log(`Request #${requestId}: Successfully parsed JSON`, 'debug', parsed);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON: ${parseError.message}\nRaw: ${jsonMatch[0].substring(0, 200)}`);
      }
      
      // Validate and normalize response
      const validLevels = ['minimal', 'partial', 'complete'];
      if (!parsed.damage_level || !validLevels.includes(parsed.damage_level)) {
        log(`Request #${requestId}: Invalid damage_level "${parsed.damage_level}", defaulting to partial`, 'warn');
        parsed.damage_level = 'partial';
      }
      
      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
        log(`Request #${requestId}: Invalid confidence "${parsed.confidence}", defaulting to 0.7`, 'warn');
        parsed.confidence = 0.7;
      }
      
      successCount++;
      log(`Request #${requestId}: Success! Success rate: ${(successCount/requestCount*100).toFixed(1)}%`, 'info');
      
      return parsed;
      
    } catch (err) {
      clearTimeout(timeoutId);
      log(`Request #${requestId}: Failed - ${err.message}`, 'error', err);
      
      if (attempt < CONFIG.MAX_RETRIES) {
        log(`Request #${requestId}: Retrying in ${CONFIG.RETRY_DELAY_MS}ms...`, 'warn');
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS));
        return callOpenRouter(base64Image, prompt, modelId, attempt + 1);
      }
      
      throw err;
    }
  }
  
  // ==================== PROMPT CONSTRUCTION ====================
  function buildPrompt(infrastructureType = null) {
    return `You are a disaster damage assessment expert. Analyze this photo and provide a damage assessment.

IMPORTANT: Respond with ONLY a valid JSON object. No other text, no markdown, just the JSON.

{
  "damage_level": "minimal" OR "partial" OR "complete",
  "confidence": number between 0 and 1 (0 = very uncertain, 1 = very certain),
  "description": "brief 1-2 sentence description of what you see"
}

Definitions:
- "minimal": Little or no visible damage. Structure appears intact and functional.
- "partial": Significant visible damage but structure still standing. Cracks, broken windows, partial collapse.
- "complete": Structure destroyed, total collapse, or completely unsafe.

Be honest about confidence. Blurry photos, far distance, or unclear views = low confidence.

Infrastructure type (for context): ${infrastructureType || 'unknown'}

Now analyze the image and respond with ONLY the JSON object.`;
  }
  
  // ==================== RESPONSE PARSING ====================
  function parseResponse(assessment, modelUsed) {
    const damageMap = {
      minimal: 'Minimal / No damage',
      partial: 'Partially damaged',
      complete: 'Completely damaged'
    };
    
    const tierMap = {
      minimal: 'minimal',
      partial: 'partial',
      complete: 'complete'
    };
    
    const scoreMap = {
      minimal: 0.25 + (Math.random() * 0.15),
      partial: 0.55 + (Math.random() * 0.2),
      complete: 0.85 + (Math.random() * 0.1)
    };
    
    return {
      success: true,
      damage_level: damageMap[assessment.damage_level] || 'Unknown',
      internal_tier: tierMap[assessment.damage_level] || null,
      score: scoreMap[assessment.damage_level] || 0.5,
      confidence: Math.min(0.95, Math.max(0.3, assessment.confidence)),
      description: assessment.description || 'Damage assessment completed',
      model_used: modelUsed,
      timestamp: new Date().toISOString(),
      is_mock: false,
      raw_response: assessment
    };
  }
  
  // ==================== FALLBACK RESPONSE ====================
  function getFallbackResponse(errorMessage = null) {
    const randomScore = 0.4 + (Math.random() * 0.4);
    const randomConfidence = 0.3 + (Math.random() * 0.4);
    
    return {
      success: false,
      damage_level: 'Unknown',
      internal_tier: null,
      score: randomScore,
      confidence: randomConfidence,
      description: errorMessage || 'AI analysis unavailable (offline/error mode)',
      notes: 'Using fallback scoring. Check API key and internet connection.',
      model_used: 'fallback',
      timestamp: new Date().toISOString(),
      is_mock: true,
      error: errorMessage
    };
  }
  
  // ==================== MAIN ANALYSIS FUNCTION ====================
  async function analyzePhoto(imageDataUrl, infrastructureType = null) {
    log(`analyzePhoto called - infrastructure: ${infrastructureType}`, 'info');
    
    // Step 1: Check configuration
    if (!isConfigured()) {
      log('Not configured, attempting to load from localStorage', 'warn');
      const savedKey = localStorage.getItem('openrouter_api_key');
      if (savedKey && savedKey.length > 10) {
        setApiKey(savedKey);
        log('Loaded API key from localStorage', 'info');
      } else {
        log('No valid API key found', 'error');
        return getFallbackResponse('No API key configured. Please enter your OpenRouter API key.');
      }
    }
    
    // Step 2: Validate image
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      log('Invalid image data provided', 'error');
      return getFallbackResponse('Invalid image data');
    }
    
    if (!imageDataUrl.startsWith('data:image')) {
      log('Image data does not appear to be a valid data URL', 'warn');
    }
    
    // Step 3: Extract base64
    let base64Image;
    try {
      base64Image = imageDataUrl.split(',')[1];
      if (!base64Image || base64Image.length < 100) {
        throw new Error('Failed to extract base64 data from image');
      }
      log(`Image extracted - size: ${(base64Image.length / 1024).toFixed(1)} KB`, 'debug');
    } catch (err) {
      log('Failed to process image data', 'error', err);
      return getFallbackResponse(`Image processing error: ${err.message}`);
    }
    
    // Step 4: Check cache
    const cacheKey = `${infrastructureType || 'none'}_${base64Image.substring(0, 200)}`;
    if (cache.has(cacheKey)) {
      log('Using cached result', 'info');
      return cache.get(cacheKey);
    }
    
    // Step 5: Build prompt
    const prompt = buildPrompt(infrastructureType);
    log('Prompt built', 'debug', { promptLength: prompt.length });
    
    // Step 6: Try models
    let result = null;
    let modelUsed = null;
    let lastModelError = null;
    
    // Try primary model
    log(`Trying primary model: ${CONFIG.MODELS.primary.name} (${CONFIG.MODELS.primary.id})`, 'info');
    try {
      result = await callOpenRouter(base64Image, prompt, CONFIG.MODELS.primary.id);
      modelUsed = CONFIG.MODELS.primary.id;
      log(`Primary model succeeded: ${CONFIG.MODELS.primary.name}`, 'info');
    } catch (err) {
      lastModelError = err;
      log(`Primary model failed: ${err.message}`, 'warn');
      
      // Try fallback model
      log(`Trying fallback model: ${CONFIG.MODELS.fallback.name} (${CONFIG.MODELS.fallback.id})`, 'info');
      try {
        result = await callOpenRouter(base64Image, prompt, CONFIG.MODELS.fallback.id);
        modelUsed = CONFIG.MODELS.fallback.id;
        log(`Fallback model succeeded: ${CONFIG.MODELS.fallback.name}`, 'info');
      } catch (fallbackErr) {
        log(`Fallback model also failed: ${fallbackErr.message}`, 'error');
        lastModelError = fallbackErr;
      }
    }
    
    // Step 7: Process result or fallback
    let assessment;
    if (result) {
      assessment = parseResponse(result, modelUsed);
      log('Assessment parsed successfully', 'info', assessment);
    } else {
      assessment = getFallbackResponse(lastModelError?.message || 'All models failed');
      log('Using fallback assessment', 'warn', assessment);
    }
    
    // Step 8: Cache result
    if (!assessment.is_mock) {
      cache.set(cacheKey, assessment);
      log('Result cached', 'debug');
    }
    
    return assessment;
  }
  
  // ==================== DEBUGGING FUNCTIONS ====================
  async function testApiKey() {
    log('Testing API key...', 'info');
    
    if (!isConfigured()) {
      return { success: false, error: 'No API key configured' };
    }
    
    try {
      const response = await fetch(CONFIG.OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: CONFIG.MODELS.fallback.id,
          messages: [{ role: 'user', content: 'Say "OK" if this works' }],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        log('API key test successful', 'info');
        return { success: true, message: 'API key is valid and working' };
      } else {
        const error = await response.text();
        log(`API key test failed: ${response.status} - ${error}`, 'error');
        return { success: false, error: `API returned ${response.status}: ${error.substring(0, 100)}` };
      }
    } catch (err) {
      log(`API key test error: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  }
  
  function getDebugInfo() {
    return {
      configured: isConfigured(),
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
      cacheSize: cache.size,
      requestCount,
      successCount,
      successRate: requestCount > 0 ? (successCount / requestCount * 100).toFixed(1) + '%' : '0%',
      lastError,
      recentLogs: debugLog.slice(-20),
      config: CONFIG,
      models: CONFIG.MODELS,
      timestamp: new Date().toISOString()
    };
  }
  
  function clearCache() {
    const size = cache.size;
    cache.clear();
    log(`Cache cleared (${size} items)`, 'info');
    return { cleared: size };
  }
  
  function resetStats() {
    requestCount = 0;
    successCount = 0;
    debugLog = [];
    lastError = null;
    log('Statistics reset', 'info');
    return { reset: true };
  }
  
  // ==================== INITIALIZATION ====================
  function init() {
    log('Initializing AI_ANALYSIS module', 'info');
    
    // Try to load saved key
    const savedKey = localStorage.getItem('openrouter_api_key');
    if (savedKey && savedKey.length > 10) {
      apiKey = savedKey;
      log(`Loaded saved API key (length: ${apiKey.length})`, 'info');
    } else {
      log('No saved API key found', 'warn');
    }
    
    log('Module initialized', 'info', { configured: isConfigured() });
  }
  
  // ==================== EXPORTED API ====================
  const publicAPI = {
    // Core functions
    setApiKey,
    isConfigured,
    getApiKey,
    analyzePhoto,
    testApiKey,
    
    // Debug functions
    getDebugInfo,
    clearCache,
    resetStats,
    
    // Utility
    version: '2.5.1-debug',
    config: CONFIG
  };
  
  // Auto-initialize
  init();
  
  return publicAPI;
})();

// ==================== GLOBAL EXPOSURE ====================
if (typeof window !== 'undefined') {
  window.AI_ANALYSIS = AI_ANALYSIS;
  window.__AI_ANALYSIS_DEBUG = AI_ANALYSIS.getDebugInfo;
  
  // Auto-debug on load
  window.addEventListener('load', () => {
    console.log('[VERITAS] AI_ANALYSIS module loaded');
    console.log('[VERITAS] Status:', AI_ANALYSIS.getDebugInfo());
  });
}

// ==================== MODULE EXPORTS ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AI_ANALYSIS;
}