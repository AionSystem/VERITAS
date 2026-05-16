// ==================== AI ANALYSIS MODULE v3.2.1 ====================
// Integrated with CERTUS Engine v3.2.1
// Backend: Vercel serverless function (OpenRouter API)
// API URL should be set to your deployed Vercel function

const AI_ANALYSIS = (() => {
  // ─── CONFIGURATION ─────────────────────────────────────────────────────
  // Replace with your actual Vercel deployment URL
  let API_URL = 'https://veritas-flax-eta.vercel.app/api/analyze';

  // Optional HMAC secret (set via environment variable in production)
  let HMAC_SECRET = null;

  // ─── INTERNAL HELPERS ─────────────────────────────────────────────────
  // Generate HMAC‑SHA‑256 signature using Web Crypto API
  async function _generateHMAC(message, secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ─── PUBLIC API ────────────────────────────────────────────────────────
  return {
    // Getter / setter for API endpoint (allows runtime reconfiguration)
    getApiUrl() {
      return API_URL;
    },
    setApiUrl(url) {
      API_URL = url;
      console.log(`AI analysis endpoint set to: ${API_URL}`);
    },

    // Set HMAC secret (optional, used for request signing)
    setHmacSecret(secret) {
      HMAC_SECRET = secret;
      console.log('HMAC secret configured for AI analysis requests');
    },

    // Analyse a photo by calling the Vercel backend
    async analyzePhoto(imageDataUrl, infrastructureType = null) {
      console.log('📤 Sending to Vercel backend:', API_URL);

      try {
        // Extract base64 image data (remove the data:image/...;base64, prefix)
        const base64Image = imageDataUrl.split(',')[1];
        if (!base64Image || base64Image.length < 100) {
          throw new Error('Invalid or empty image data');
        }

        // Prepare request payload
        const payload = {
          image: base64Image,
          infrastructureType: infrastructureType,
          timestamp: new Date().toISOString()
        };
        const body = JSON.stringify(payload);

        // Build request headers
        const headers = { 'Content-Type': 'application/json' };
        let timestamp = null;

        // Add HMAC signature if secret is provided (matches CERTUS v3.2.1)
        if (HMAC_SECRET) {
          timestamp = Date.now().toString();
          const signature = await _generateHMAC(timestamp + body, HMAC_SECRET);
          headers['X-CERTUS-Timestamp'] = timestamp;
          headers['X-CERTUS-Signature'] = signature;
        }

        // Execute request
        const response = await fetch(API_URL, {
          method: 'POST',
          headers,
          body
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Backend error:', response.status, errorText);
          throw new Error(`Backend returned ${response.status}`);
        }

        const result = await response.json();
        console.log('📥 Backend response:', result);

        // Map damage level to display text (matches CERTUS expected values)
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

        // Extract and validate result fields
        const damageLevel = result.damage_level || 'partial';
        const confidence = Math.min(0.95, Math.max(0.3, result.confidence || 0.7));
        const score = result.score || (damageLevel === 'complete' ? 0.9 : damageLevel === 'partial' ? 0.6 : 0.3);

        return {
          success: true,
          damage_level: damageMap[damageLevel] || 'Unknown',
          internal_tier: tierMap[damageLevel] || null,
          score: Math.min(0.95, Math.max(0.1, score)),
          confidence,
          description: result.description || 'Analysis complete',
          model_used: result.model || 'veritas-backend',
          is_mock: false
        };
      } catch (error) {
        console.error('❌ AI analysis failed:', error.message);
        return this._fallback(error.message);
      }
    },

    // Fallback when backend is unreachable (always returns a valid structure)
    _fallback(errorMsg = null) {
      // Deterministic pseudo‑random choice (not for cryptography, just fallback)
      const random = Math.random();
      let damage = 'partial';
      if (random > 0.7) damage = 'complete';
      if (random < 0.3) damage = 'minimal';

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

      // Generate a plausible score based on chosen damage level
      let score = damage === 'complete' ? 0.85 : damage === 'partial' ? 0.55 : 0.25;
      const confidence = 0.5 + Math.random() * 0.3;

      return {
        success: false,
        damage_level: damageMap[damage],
        internal_tier: tierMap[damage],
        score,
        confidence,
        description: errorMsg || 'AI backend unavailable – using fallback scoring',
        model_used: 'fallback',
        is_mock: true,
        error: errorMsg
      };
    },

    // Check if the backend is reachable (also tests a minimal POST would be accepted)
    async testBackend() {
      console.log('Testing backend connectivity at:', API_URL);

      try {
        // First check OPTIONS (CORS preflight)
        const optionsRes = await fetch(API_URL, { method: 'OPTIONS' });
        if (optionsRes.ok || optionsRes.status === 405) {
          console.log('✅ Backend reachable (OPTIONS)');
        }

        // Then test with a minimal valid POST
        const testPayload = { test: true, timestamp: Date.now() };
        const testRes = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });

        if (testRes.ok || testRes.status === 400) {
          console.log('✅ Backend accepts POST requests');
          return { success: true, message: 'Backend is online and accepting requests' };
        } else {
          return { success: false, error: `Unexpected status: ${testRes.status}` };
        }
      } catch (err) {
        console.error('❌ Backend unreachable:', err.message);
        return { success: false, error: err.message };
      }
    },

    // Compatibility stubs (API key managed on backend)
    setApiKey() {
      console.log('API key is managed on Vercel backend; no action needed.');
      return true;
    },
    isConfigured() {
      return true;
    }
  };
})();

// Initialisation log
console.log('✅ AI Analysis module v3.2.1 loaded');
console.log('📡 Backend URL:', AI_ANALYSIS.getApiUrl());

// Optional: set HMAC secret if available (from environment)
// if (typeof ENV !== 'undefined' && ENV.AI_HMAC_SECRET) {
//   AI_ANALYSIS.setHmacSecret(ENV.AI_HMAC_SECRET);
// }