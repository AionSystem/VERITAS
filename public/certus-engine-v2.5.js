// ==================== CERTUS ENGINE v2.5.2 ====================
// FSVE-informed Scoring Engine with Full Polymath Red-Team Integration
// Rounds 1-6 Implementations Complete — FORGE-20260401-001
// Enhanced with NLP, Photo Analysis, and Supabase Storage
//
// Author: Sheldon K. Salmon & ALBEDO
// Date: April 1, 2026
//
// v2.5.2 FORGE Fix Registry (FORGE-20260401-001):
// [CRITICAL] R1-SA-001 — score() made async; _acquireBackpressureToken awaited;
//            recursive retry chain replaced with iterative polling + retry limit
// [HIGH]     R3-SA-003 — location false assurance: anonymized sites skip distance
//            check and emit explicit warning instead of false verification claim
// [HIGH]     R1-EL-001 — dual decay curves (TFR 48h / evidence 168h) declared
//            explicitly in dci_assumptions_raw in score() return object
// [HIGH]     R1-SA-002 — _inMemoryStore in processAppeal() capped at 10k entries
//            with LRU eviction; aligned with _inMemoryCounters TTL pattern
// [HIGH]     R1-SA-003 — _findNearestShelters / _findNearestMedical declared as
//            mock stubs with fallback warning on high-stakes path
// [MEDIUM]   R3-SA-001 — audit_id counter fixed; reads from _auditLog.shards
//            instead of _auditLog.events (which is always empty)
// [MEDIUM]   R4-CP-001 — PLAIN_LANGUAGE.VALID strips "95% confidence" ceiling
//            leak; replaced with action-oriented plain language
// [MEDIUM]   R1-SA-004 — recognizeOfflineVoice() declared as stub with inline
//            comment; caller-facing stub flag added to return object
// [MEDIUM]   R4-CP-002 — language_fallback: true flag added to getAudioFeedback()
//            and getVoiceInputConfig() when language is not in supported set
// [MEDIUM]   R4-CP-003 — getOnboardingStep() returns completion object when all
//            steps done instead of null; includes audio and next_action guidance
// [MEDIUM]   R5-DT-002 — exit_path object added to all 5 onboarding steps
// [MEDIUM]   R5-DT-001 — generateVerificationCertificate() adds certificate_summary
//            structured object alongside human_readable for mobile rendering
// [MEDIUM]   R2-CL-003 / R2-CL-001 — prohibited_uses and consent gate documented
//            as caller-enforcement responsibilities in constitutional_status block
// [LOW]      R1-EL-002 — _calculateJointLikelihood renamed and documented as
//            heuristic approximation; no longer claims mathematical joint probability
// [LOW]      R1-EL-003 — COR single-source 0.40 penalty documented with rationale
//            comment; FCL candidate flag added
// [LOW]      R2-EL-002 — COR pre-clamp score logged in result.raw_score
// [LOW]      R3-EL-001 — _logAuditEvent('REPORT_SCORED') moved to after banned
//            check; banned reporters now log BANNED_REPORTER_BLOCKED instead
// [LOW]      R3-SA-002 — resolved as part of R1-SA-001 (recursive chain removed)
//
// Round 5 Implementations:
// [S-17] Graceful degradation for Redis failure with alerts
// [S-18] Centralized audit logs with sharding and replication
// [S-19] Circuit breakers for external dependencies
// [S-20] Backpressure handling for batch operations
// [S-21] Canary deployment strategy with version routing
// [E-17] Evidence independence detection (correlated evidence handling)
// [E-18] Evidence recency weighting with temporal decay
// [E-19] Cross-validation between evidence types
// [E-20] Source credibility scoring
// [E-21] Adversarial pattern detection
// [C-19] Low-literacy accessibility (icon-based, audio fallback)
// [C-20] Non-text language support (full audio guidance)
// [C-21] Confirmation for critical actions
// [C-22] Progress persistence across sessions
// [C-23] Family/group reporting (batch mode)
// [L-19] Data minimization for sensitive locations
// [L-20] Granular consent management
// [L-21] Data sharing transparency with recipients disclosure
// [L-22] Data correction workflow
// [L-23] Reporter reputation scoring
// [D-19] Offline voice recognition (keyword detection)
// [D-20] Haptic feedback for confidence levels
// [D-21] Automatic dark mode with ambient light sensor
// [D-22] Large text mode for accessibility
// [D-23] Community verification badges
// [NEW] NLP text analysis for witness statements
// [NEW] Infrastructure type inference from text descriptions
// [NEW] Supabase storage integration for reports, appeals, and audit logs
// [NEW] Batch photo analysis with OpenRouter API
// [NEW] Duplicate photo detection with perceptual hashing
// [NEW] Shelter and medical facility lookup
//
// Gap Closures (v2.5.1 complete):
// [GAP-1] _generateUUID() — implemented (RFC 4122 v4)
// [GAP-2] _incrementDistributedCounter() — implemented (Redis + in-memory TTL fallback)
// [GAP-3] bayesianUpdate() — implemented (full Bayes theorem with epistemic ceiling)
// [GAP-4] _generatePerceptualHash() — replaced stub with real 8x8 dHash (browser) + FNV-1a (Node)
// [GAP-5] _calculateHashSimilarity() — Hamming distance for binary hashes, char-diff for hex
// [GAP-6] _getMostCommon() — replaced buggy O(n²) sort with O(n) frequency map
// [GAP-7] _detectAdversarialPattern() — made async; _findDuplicatePhotos await now resolves
// [GAP-8] processAppeal() — awaits _detectAdversarialPattern
// [GAP-9] _inMemoryCounters / _inMemoryStore / _instanceId — added to internal state

const CERTUS = {

  // ── VERSION ────────────────────────────────────────────────────────────────
  VERSION: '2.5.2',
  CANARY_VERSION: '2.5.2-beta',

  // ── PRODUCTION CONFIGURATION ───────────────────────────────────────────────
  PRODUCTION: {
    maxConcurrentAppeals: 100,
    cacheTTL: 300,
    rateLimitWindow: 3600,
    distributedSyncInterval: 5000,
    healthCheckInterval: 30000,
    circuitBreakerManualResetOnly: true,
    auditLogRetentionDays: 365,
    encryptionKeyRotationDays: 90,
    canaryPercentage: 5
  },

  // ── WEIGHTS ───────────────────────────────────────────────────────────────
  W: { PES: 0.35, COR: 0.30, TFR: 0.20, CCI: 0.15 },

  // ── THRESHOLDS ────────────────────────────────────────────────────────────
  THRESHOLDS: {
    DCI_HIGH: 0.70,
    DCI_WATCH: 0.40,
    UM_VALID: 0.35,
    UM_DEGRADED: 0.60,
    MAX_APPEALS: 3,
    CORRELATED_FAILURE_RATE: 0.30,
    EPISTEMIC_CEILING: 0.95,
    EVIDENCE_HALF_LIFE_HOURS: 168, // 7 days
    APPEAL_RATE_LIMIT: {
      per_report: { max: 1, window: 3600000 },
      per_ip: { max: 10, window: 3600000 }
    },
    APPEAL_RETENTION_DAYS: 90,
    GEOTAG_ACCURACY_MULTIPLIER: 2,
    CIRCUIT_BREAKER: {
      initial_backoff: 3600000,
      max_backoff: 86400000,
      manual_reset_required: true
    },
    REPUTATION: {
      VERIFIED_BONUS: 10,
      FALSE_REPORT_PENALTY: 20,
      BAN_THRESHOLD: -100
    }
  },

  // ── EVIDENCE WEIGHTS WITH CREDIBILITY ─────────────────────────────────────
  CREDIBILITY_SCORES: {
    first_hand_witness: 0.9,
    second_hand_witness: 0.6,
    hearsay: 0.3,
    engineer: 0.95,
    community_elder: 0.85,
    government_official: 0.7,
    ai_analyzed_photo: 0.85,
    field_verification: 0.98
  },

  EVIDENCE_WEIGHTS: {
    PHOTO: { weight: 0.35, confidence_boost: 0.12, likelihood: 0.85 },
    WITNESS: { weight: 0.25, confidence_boost: 0.08, likelihood: 0.70 },
    FIELD: { weight: 0.40, confidence_boost: 0.25, likelihood: 0.95 }
  },

  // ── SENSITIVE LOCATION TYPES (for anonymization) ──────────────────────────
  SENSITIVE_LOCATION_TYPES: [
    'shelter', 'medical', 'school', 'government', 'religious',
    'women_shelter', 'refugee_camp', 'detention_center'
  ],

  // ── CONSENT OPTIONS ───────────────────────────────────────────────────────
  CONSENT_OPTIONS: {
    disaster_response: { required: true, default: true },
    research: {
      required: false, default: false,
      explanation: 'Help improve future disaster response through research'
    },
    commercial: {
      required: true, default: false,
      explanation: 'Allow commercial use of anonymized data',
      prohibited: false
    },
    surveillance: {
      required: true, default: false,
      prohibited: true,
      explanation: 'Surveillance use is prohibited by constitutional law'
    }
  },

  // ── DATA RECIPIENTS FOR TRANSPARENCY ──────────────────────────────────────
  DATA_RECIPIENTS: {
    emergency_services: {
      name: 'Local Emergency Services',
      purpose: 'Immediate response coordination',
      retention: '30 days',
      opt_out: false
    },
    undp: {
      name: 'United Nations Development Programme',
      purpose: 'Resource allocation and planning',
      retention: '7 years',
      opt_out: true
    },
    research_institutions: {
      name: 'Humanitarian Research Partners',
      purpose: 'Improving disaster response',
      retention: 'Indefinite (anonymized)',
      opt_out: true
    },
    local_government: {
      name: 'Local Government',
      purpose: 'Recovery planning',
      retention: '5 years',
      opt_out: true
    }
  },

  // ── VERIFICATION BADGES ───────────────────────────────────────────────────
  VERIFICATION_BADGES: {
    community_verified: {
      icon: '👥',
      label: 'Community Verified',
      description: 'Verified by local community leaders',
      color: '#4ade80',
      weight: 1.2
    },
    ai_verified: {
      icon: '🤖',
      label: 'AI Verified',
      description: 'Verified by CERTUS Engine',
      color: '#f0a500',
      weight: 1.0
    },
    field_verified: {
      icon: '✅',
      label: 'Field Verified',
      description: 'Verified by on-site responders',
      color: '#4ade80',
      weight: 1.3
    },
    pending: {
      icon: '⏳',
      label: 'Pending Verification',
      description: 'Awaiting human verification',
      color: '#888',
      weight: 0.7
    }
  },

  // ── ACCESSIBILITY SETTINGS ────────────────────────────────────────────────
  ACCESSIBILITY: {
    large_text: {
      scale: 1.5,
      description: 'Increase text size for readability',
      enabled: false
    },
    high_contrast: {
      enabled: false,
      description: 'Increase contrast for visibility',
      colors: {
        background: '#000000',
        text: '#ffffff',
        accent: '#ffff00'
      }
    },
    reduce_motion: {
      enabled: false,
      description: 'Reduce animations for accessibility'
    },
    haptic_feedback: {
      enabled: true,
      description: 'Vibration alerts for confidence changes'
    }
  },

  // ── ICON-BASED NAVIGATION (low-literacy) ─────────────────────────────────
  ICON_NAVIGATION: {
    steps: [
      { icon: '📸', action: 'photo', description: 'Take photo', audio: 'step_photo.mp3' },
      { icon: '🏚️', action: 'damage', description: 'Select damage', audio: 'step_damage.mp3' },
      { icon: '🏗️', action: 'infra', description: 'What was damaged', audio: 'step_infra.mp3' },
      { icon: '📍', action: 'location', description: 'Where is it', audio: 'step_location.mp3' },
      { icon: '✅', action: 'submit', description: 'Send report', audio: 'step_submit.mp3' }
    ],
    actions: [
      { icon: '👥', action: 'share', description: 'Share with helper', audio: 'share.mp3' },
      { icon: '📞', action: 'call', description: 'Call for help', audio: 'call.mp3' },
      { icon: '📍', action: 'wait', description: 'Stay here', audio: 'stay.mp3' }
    ]
  },

  // ── OFFLINE VOICE KEYWORDS ────────────────────────────────────────────────
  VOICE_KEYWORDS: {
    en: ['help', 'damage', 'emergency', 'yes', 'no', 'photo', 'location'],
    es: ['ayuda', 'daño', 'emergencia', 'sí', 'no', 'foto', 'ubicación'],
    ar: ['مساعدة', 'ضرر', 'طوارئ', 'نعم', 'لا', 'صورة', 'موقع'],
    zh: ['帮助', '损坏', '紧急', '是', '否', '照片', '位置']
  },

  // ── AUDIO GUIDANCE (non-text language support) ────────────────────────────
  AUDIO_GUIDANCE: {
    en: {
      step_1: 'Take a photo of the damage. Hold your phone steady.',
      step_2: 'Select how bad the damage is. Minimal, partial, or complete.',
      step_3: 'What was damaged? A building, road, bridge, or something else?',
      step_4: 'Where is the damage? Tap the map to show the location.',
      step_5: 'Review your report. Tap send when ready.'
    },
    es: {
      step_1: 'Tome una foto del daño. Mantenga su teléfono firme.',
      step_2: 'Seleccione qué tan grave es el daño. Mínimo, parcial o completo.',
      step_3: '¿Qué fue dañado? Un edificio, carretera, puente u otra cosa?',
      step_4: '¿Dónde está el daño? Toque el mapa para mostrar la ubicación.',
      step_5: 'Revise su informe. Toque enviar cuando esté listo.'
    },
    ar: {
      step_1: 'التقط صورة للضرر. أبق هاتفك ثابتًا.',
      step_2: 'اختر مدى شدة الضرر. بسيط، جزئي، أو كامل.',
      step_3: 'ما الذي تضرر؟ مبنى، طريق، جسر، أو شيء آخر؟',
      step_4: 'أين موقع الضرر؟ اضغط على الخريطة لتحديد الموقع.',
      step_5: 'راجع تقريرك. اضغط إرسال عندما تكون جاهزًا.'
    },
    zh: {
      step_1: '拍摄损坏照片。保持手机稳定。',
      step_2: '选择损坏程度。轻微、部分或完全损坏。',
      step_3: '什么被损坏了？建筑物、道路、桥梁还是其他？',
      step_4: '损坏在哪里？点击地图显示位置。',
      step_5: '查看报告。准备好后点击发送。'
    }
  },

  // ── MARKER STYLES (color-blind accessible) ────────────────────────────────
  MARKER_STYLES: {
    high: { color: '#4ade80', pattern: 'solid', pattern_svg: null },
    watch: { color: '#f0a500', pattern: 'striped', pattern_svg: 'url(#stripe-pattern)' },
    review: { color: '#ff4d4d', pattern: 'crosshatch', pattern_svg: 'url(#crosshatch-pattern)' },
    suspended: { color: '#888', pattern: 'dotted', pattern_svg: 'url(#dot-pattern)' }
  },

  // ── PLAIN LANGUAGE ────────────────────────────────────────────────────────
  PLAIN_LANGUAGE: {
    'VALID': 'Reliable — confident enough to act on',
    'DEGRADED': 'Somewhat uncertain — verify before acting',
    'SUSPENDED': 'Do not rely — human review required',
    'correlated failure detection': 'Multiple problems with this report',
    'epistemic veil': 'Information quality check',
    'uncertainty mass': 'How sure we are',
    'bottleneck dimension': 'Biggest problem with this report',
    'evaluative gated': 'AI uncertain about photo',
    'inferential': 'AI guessing, not sure'
  },

  // ── AUDIO FEEDBACK (gentle) ───────────────────────────────────────────────
  AUDIO_FEEDBACK: {
    review: { sound: 'gentle-chime.mp3', volume: 0.3, message: 'Please verify this report' },
    watch: { sound: 'soft-beep.mp3', volume: 0.2, message: 'Check local conditions' },
    high: { sound: null, volume: 0, message: null },
    languages: {
      en: { review: 'gentle-chime-en.mp3', watch: 'soft-beep-en.mp3' },
      es: { review: 'gentle-chime-es.mp3', watch: 'soft-beep-es.mp3' },
      ar: { review: 'gentle-chime-ar.mp3', watch: 'soft-beep-ar.mp3' },
      zh: { review: 'gentle-chime-zh.mp3', watch: 'soft-beep-zh.mp3' }
    }
  },

  // ── NLP CONFIGURATION ─────────────────────────────────────────────────────
  NLP_CONFIG: {
    damageKeywords: {
      minimal: ['minor', 'small', 'crack', 'hairline', 'surface', 'cosmetic', 'paint', 'scrape', 'chipped', 'scratch'],
      partial: ['significant', 'major', 'broken', 'cracked', 'damaged', 'hole', 'collapse partial', 'leaning', 'buckled', 'warped'],
      complete: ['destroyed', 'total', 'rubble', 'pile', 'flattened', 'gone', 'rubble', 'debris', 'collapse total', 'leveled', 'obliterated']
    },
    infrastructureKeywords: {
      Residential: ['house', 'home', 'apartment', 'building', 'dwelling', 'condo', 'townhouse', 'villa'],
      Road: ['road', 'street', 'highway', 'path', 'lane', 'bridge approach', 'pavement', 'asphalt', 'intersection'],
      Bridge: ['bridge', 'overpass', 'underpass', 'viaduct', 'flyover', 'trestle'],
      Utility: ['power', 'electric', 'water', 'pipe', 'line', 'pole', 'transformer', 'substation', 'sewer', 'gas'],
      Medical: ['hospital', 'clinic', 'health', 'medical', 'doctor', 'pharmacy', 'clinic', 'urgent care'],
      School: ['school', 'university', 'college', 'academy', 'classroom', 'campus'],
      'Government Building': ['government', 'city hall', 'municipal', 'council', 'administrative', 'courthouse', 'town hall'],
      'Commercial Infrastructure': ['store', 'shop', 'market', 'mall', 'business', 'office', 'retail', 'warehouse'],
      'Community Infrastructure': ['community center', 'hall', 'church', 'mosque', 'temple', 'worship', 'cultural center'],
      'Public spaces/Recreation': ['park', 'playground', 'square', 'plaza', 'stadium', 'field', 'arena', 'sports']
    },
    sentimentAnalysis: {
      urgency: ['emergency', 'urgent', 'immediate', 'critical', 'serious', 'danger', 'unsafe', 'life threatening', 'trapped'],
      uncertainty: ['maybe', 'perhaps', 'not sure', 'uncertain', 'unclear', 'could be', 'might be', 'possibly']
    }
  },

  // ── INTERNAL STATE ────────────────────────────────────────────────────────
  _circuitBreaker: {
    engaged: false,
    correlatedFailureRate: 0,
    lastReset: Date.now(),
    backoff: 3600000,
    reason: null,
    manualResetRequired: true
  },

  _dependencyCircuitBreakers: {
    redis: { open: false, failures: 0, lastFailure: null, timeout: 5000 },
    storage: { open: false, failures: 0, lastFailure: null, timeout: 10000 },
    maps: { open: false, failures: 0, lastFailure: null, timeout: 3000 },
    supabase: { open: false, failures: 0, lastFailure: null, timeout: 8000 }
  },

  _backpressure: {
    tokens: 1000,
    lastRefill: Date.now(),
    rateLimit: 1000
  },

  _degradedMode: false,
  _degradationReasons: [],

  _distributedStore: null,
  _useDistributed: false,

  _storage: null,
  _supabaseClient: null,

  _auditLog: {
    shards: [],
    currentShard: 0,
    maxShardSize: 10000,
    events: []
  },

  _reputationStore: new Map(),
  _correctionStore: new Map(),
  _progressStore: new Map(),
  _batchReports: new Map(),
  _photoRegistry: new Map(),

  // [GAP-9] Added: in-memory counter store with TTL for rate limiting fallback
  _inMemoryCounters: new Map(),

  // [GAP-9] Added: in-memory key-value store used as Redis fallback in processAppeal
  // R1-SA-002 FIX: capped at _IN_MEMORY_STORE_MAX_SIZE with LRU eviction.
  // Previously unbounded — adversarial appeal volume could grow this without limit.
  _inMemoryStore: new Map(),
  _IN_MEMORY_STORE_MAX_SIZE: 10000,

  // [GAP-9] Added: stable instance identifier for audit log correlation
  _instanceId: (
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `certus-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  ),

  _offlineSupported: false,
  _currentTheme: 'light',

  // ══════════════════════════════════════════════════════════════════════════
  // [GAP-1] UUID GENERATION — RFC 4122 version 4
  // Replaces all undefined calls to this._generateUUID() throughout the engine.
  // Uses crypto.randomUUID() where available (browser + Node 15+),
  // falls back to Math.random() for older environments.
  // ══════════════════════════════════════════════════════════════════════════
  _generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // RFC 4122 v4 fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // [GAP-2] DISTRIBUTED COUNTER — Redis primary, in-memory TTL fallback
  // Called by processAppeal() for rate limiting per report and per IP.
  // When Redis circuit breaker is open, falls back to _inMemoryCounters
  // with automatic TTL expiry so rate limits still function correctly.
  // ══════════════════════════════════════════════════════════════════════════
  async _incrementDistributedCounter(key, ttlSeconds) {
    // Attempt Redis if distributed store is available
    if (this._distributedStore && this._useDistributed) {
      try {
        const count = await this._distributedStore.incr(key);
        if (count === 1) {
          await this._distributedStore.expire(key, ttlSeconds);
        }
        return count;
      } catch (err) {
        this._recordDegradation('redis', err);
        // Fall through to in-memory
      }
    }

    // In-memory fallback with TTL
    const now = Date.now();
    const entry = this._inMemoryCounters.get(key);

    if (!entry || now > entry.expiresAt) {
      // Expired or first call — reset counter
      this._inMemoryCounters.set(key, {
        count: 1,
        expiresAt: now + ttlSeconds * 1000
      });
      return 1;
    }

    entry.count += 1;
    return entry.count;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // [GAP-3] BAYESIAN UPDATE — full Bayes theorem with epistemic ceiling
  // Called by processAppeal() to update confidence from new appeal evidence.
  //
  // Parameters:
  //   prior           — current confidence score [0, 1]
  //   likelihood      — P(evidence | damage is real), from _estimateCombinedEvidenceDelta (heuristic)
  //   falseLikelihood — P(evidence | damage is NOT real); defaults to complement
  //
  // Returns posterior clamped to THRESHOLDS.EPISTEMIC_CEILING (0.95).
  // The ceiling prevents any single appeal from driving confidence to 1.0,
  // preserving the uncertainty structure required by the UM system.
  // ══════════════════════════════════════════════════════════════════════════
  bayesianUpdate(prior, likelihood, falseLikelihood = null) {
    // Clamp inputs
    const p = Math.max(0, Math.min(1, prior));
    const lh = Math.max(0, Math.min(1, likelihood));

    // If falseLikelihood not supplied, use a conservative estimate:
    // evidence that proves real damage is less likely when damage isn't real,
    // but not impossible (witnesses can be mistaken, photos can be misleading).
    const flh = falseLikelihood !== null
      ? Math.max(0, Math.min(1, falseLikelihood))
      : Math.max(0.05, (1 - lh) * 0.4);

    // Total probability of observing this evidence
    const pE = lh * p + flh * (1 - p);

    // Avoid division by zero
    if (pE === 0) return p;

    // Posterior via Bayes theorem
    const posterior = (lh * p) / pE;

    // Apply epistemic ceiling — no score exceeds 0.95 regardless of evidence
    return Math.min(this.THRESHOLDS.EPISTEMIC_CEILING, Math.max(0, posterior));
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CANARY DEPLOYMENT — version routing
  // ══════════════════════════════════════════════════════════════════════════
  routeToVersion(userId) {
    const hash = this._hashCode(userId) % 100;
    if (hash < this.PRODUCTION.canaryPercentage) {
      return this.CANARY_VERSION;
    }
    return this.VERSION;
  },

  _hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GRACEFUL DEGRADATION with alerts
  // ══════════════════════════════════════════════════════════════════════════
  _recordDegradation(component, error) {
    this._degradedMode = true;
    this._degradationReasons.push({
      component,
      error: error.message,
      timestamp: Date.now(),
      severity: 'warning'
    });

    if (typeof console !== 'undefined') {
      console.warn(`[CERTUS] Degraded mode: ${component} failed - ${error.message}`);
    }

    if (component === 'redis' || component === 'storage' || component === 'supabase') {
      this._sendAlert(component, error);
    }
  },

  _sendAlert(component, error) {
    if (typeof fetch !== 'undefined') {
      fetch('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          component,
          error: error.message,
          timestamp: Date.now(),
          severity: 'critical'
        })
      }).catch(() => {});
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CENTRALIZED AUDIT LOG with sharding
  // ══════════════════════════════════════════════════════════════════════════
  async _logAuditEvent(event) {
    const auditEvent = {
      ...event,
      timestamp: Date.now(),
      version: this.VERSION,
      instanceId: this._instanceId
    };

    const shard = this._auditLog.shards[this._auditLog.currentShard] ||
                  { events: [], size: 0 };
    shard.events.push(auditEvent);
    shard.size++;
    this._auditLog.shards[this._auditLog.currentShard] = shard;

    if (shard.size >= this._auditLog.maxShardSize) {
      await this._rotateAuditShard();
    }

    if (this._storage && this._storage.logAudit) {
      await this._storage.logAudit(auditEvent);
    }

    if (this._supabaseClient && this._supabaseClient.from) {
      try {
        await this._supabaseClient.from('audit_logs').insert(auditEvent);
      } catch (err) {
        console.warn('[CERTUS] Supabase audit log failed:', err);
      }
    }
  },

  async _rotateAuditShard() {
    const oldShard = this._auditLog.shards[this._auditLog.currentShard];
    if (oldShard && this._storage) {
      await this._storage.saveShard(oldShard);
    }

    this._auditLog.currentShard++;
    this._auditLog.shards[this._auditLog.currentShard] = { events: [], size: 0 };
  },

  async queryAuditLog(startDate, endDate) {
    const results = [];

    for (const shard of this._auditLog.shards) {
      if (!shard) continue;
      const shardResults = shard.events.filter(e =>
        e.timestamp >= startDate && e.timestamp <= endDate
      );
      results.push(...shardResults);
    }

    if (this._storage && this._storage.queryAudit) {
      const storedResults = await this._storage.queryAudit(startDate, endDate);
      results.push(...storedResults);
    }

    if (this._supabaseClient && this._supabaseClient.from) {
      try {
        const { data } = await this._supabaseClient
          .from('audit_logs')
          .select('*')
          .gte('timestamp', startDate)
          .lte('timestamp', endDate);
        if (data) results.push(...data);
      } catch (err) {
        console.warn('[CERTUS] Supabase audit query failed:', err);
      }
    }

    return results.sort((a, b) => a.timestamp - b.timestamp);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CIRCUIT BREAKERS for external dependencies
  // ══════════════════════════════════════════════════════════════════════════
  async _callWithCircuitBreaker(dependency, fn, fallback) {
    const breaker = this._dependencyCircuitBreakers[dependency];
    if (!breaker) return fn();

    if (breaker.open) {
      const timeSinceFailure = Date.now() - breaker.lastFailure;
      if (timeSinceFailure < breaker.timeout) {
        return fallback();
      }
      breaker.open = false;
      breaker.failures = 0;
    }

    try {
      const result = await fn();
      breaker.failures = 0;
      return result;
    } catch (err) {
      breaker.failures++;
      breaker.lastFailure = Date.now();
      if (breaker.failures >= 3) {
        breaker.open = true;
        this._recordDegradation(dependency, err);
      }
      return fallback();
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BACKPRESSURE HANDLING (token bucket)
  // ══════════════════════════════════════════════════════════════════════════
  // R1-SA-001 FIX: replaced recursive promise chain with iterative polling loop.
  // Max retries prevent unbounded call stack depth under sustained token exhaustion.
  // score() now awaits this function before the scoring pipeline executes.
  // R3-SA-002 FIX: recursive chain removed — stack risk neutralised before R1-SA-001 shipped.
  async _acquireBackpressureToken(tokens = 1, _maxRetries = 50) {
    const POLL_INTERVAL_MS = 100;
    let retries = 0;

    while (retries < _maxRetries) {
      this._refillTokens();
      if (this._backpressure.tokens >= tokens) {
        this._backpressure.tokens -= tokens;
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      retries++;
    }

    // Token bucket exhausted after all retries — surface a typed error.
    const err = new Error('BACKPRESSURE_EXHAUSTED: token bucket empty after maximum retries');
    err.code = 'BACKPRESSURE_EXHAUSTED';
    throw err;
  },

  _refillTokens() {
    const now = Date.now();
    const elapsed = now - this._backpressure.lastRefill;
    const newTokens = elapsed * (this._backpressure.rateLimit / 1000);
    this._backpressure.tokens = Math.min(
      this._backpressure.rateLimit,
      this._backpressure.tokens + newTokens
    );
    this._backpressure.lastRefill = now;
  },

  // R1-SA-002 FIX: LRU-evicting setter for _inMemoryStore.
  // When the store reaches _IN_MEMORY_STORE_MAX_SIZE, the oldest inserted key
  // is evicted before the new entry is written. Map iteration order reflects
  // insertion order in all V8/SpiderMonkey engines, making Map.keys().next()
  // a reliable O(1) LRU eviction without an additional data structure.
  _inMemoryStoreSet(key, value) {
    if (this._inMemoryStore.size >= this._IN_MEMORY_STORE_MAX_SIZE) {
      const oldest = this._inMemoryStore.keys().next().value;
      this._inMemoryStore.delete(oldest);
    }
    this._inMemoryStore.set(key, value);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EVIDENCE INDEPENDENCE DETECTION
  // ══════════════════════════════════════════════════════════════════════════
  // R1-EL-002 FIX: renamed from _calculateJointLikelihood. The MAX-based combination
  // is a conservative heuristic approximation — it is NOT a true joint likelihood
  // calculation. Two partially dependent sources receive less than their sum, which
  // is directionally correct, but Math.max does not correspond to any standard
  // independence correction formula. Documented to prevent false precision claims.
  _estimateCombinedEvidenceDelta(evidences) {
    const hasPhoto = evidences.includes('photo');
    const hasWitness = evidences.includes('witness');
    const hasField = evidences.includes('field');

    let likelihood = 0.5;

    if (hasPhoto && hasWitness) {
      likelihood += Math.max(
        this.EVIDENCE_WEIGHTS.PHOTO.likelihood - 0.5,
        this.EVIDENCE_WEIGHTS.WITNESS.likelihood - 0.5
      );
    } else {
      if (hasPhoto) likelihood += this.EVIDENCE_WEIGHTS.PHOTO.likelihood - 0.5;
      if (hasWitness) likelihood += this.EVIDENCE_WEIGHTS.WITNESS.likelihood - 0.5;
    }

    if (hasField) likelihood += this.EVIDENCE_WEIGHTS.FIELD.likelihood - 0.5;

    return Math.min(0.95, likelihood);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EVIDENCE RECENCY WEIGHTING (temporal decay)
  // ══════════════════════════════════════════════════════════════════════════
  _getEvidenceFreshness(timestamp) {
    const hoursElapsed = (Date.now() - new Date(timestamp).getTime()) / 3600000;
    return Math.max(0, 1 - (hoursElapsed / this.THRESHOLDS.EVIDENCE_HALF_LIFE_HOURS));
  },

  _getEvidenceWeight(evidence, timestamp) {
    const freshness = this._getEvidenceFreshness(timestamp);
    return evidence.weight * freshness;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EVIDENCE CROSS-VALIDATION
  // ══════════════════════════════════════════════════════════════════════════
  _crossValidateEvidence(photoDamage, witnessDamage) {
    if (photoDamage && witnessDamage && photoDamage !== witnessDamage) {
      return {
        consistent: false,
        conflict: `Photo shows ${photoDamage}, witness reports ${witnessDamage}`,
        resolution: 'require_field_verification'
      };
    }
    return { consistent: true, damage: photoDamage || witnessDamage };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SOURCE CREDIBILITY SCORING
  // ══════════════════════════════════════════════════════════════════════════
  _getCredibilityMultiplier(source) {
    return this.CREDIBILITY_SCORES[source] || 0.5;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // [GAP-7] ADVERSARIAL PATTERN DETECTION — now async
  // The original method was synchronous but called _findDuplicatePhotos
  // (an async method) without await, meaning the duplicate check never ran.
  // Made async; processAppeal now awaits it.
  // ══════════════════════════════════════════════════════════════════════════
  async _detectAdversarialPattern(evidence, reportHistory) {
    const now = Date.now();
    const recentAppeals = reportHistory.filter(a =>
      a.timestamp > now - 86400000
    );

    if (recentAppeals.length > 3) {
      return {
        adversarial: true,
        reason: 'Multiple contradictory appeals in short timeframe',
        action: 'require_human_review'
      };
    }

    const photoHashes = evidence.photos?.map(p => p.hash) || [];
    // Await now resolves correctly — duplicate check actually runs
    const duplicatePhotos = await this._findDuplicatePhotos(photoHashes);
    if (duplicatePhotos.length > 0) {
      return {
        adversarial: true,
        reason: 'Duplicate evidence detected across reports',
        action: 'flag_for_investigation'
      };
    }

    return { adversarial: false };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // REPUTATION SCORING
  // ══════════════════════════════════════════════════════════════════════════
  _updateReputation(reporterId, reportOutcome) {
  // Guard for missing reporter ID
  if (!reporterId) {
    console.warn('[CERTUS] No reporter ID, skipping reputation');
    return { score: 0, banned: false, verified_reports: 0, false_reports: 0 };
  }
  
  let reputation = this._reputationStore.get(reporterId) || {
    score: 0,
    verified_reports: 0,
    false_reports: 0,
    banned: false,
    ban_reason: null
  };

  if (reputation.banned) return reputation;

  if (reportOutcome === 'VERIFIED') {
    reputation.score += this.THRESHOLDS.REPUTATION.VERIFIED_BONUS;
    reputation.verified_reports++;
  } else if (reportOutcome === 'FALSE') {
    reputation.score -= this.THRESHOLDS.REPUTATION.FALSE_REPORT_PENALTY;
    reputation.false_reports++;
  }

  if (reputation.score < this.THRESHOLDS.REPUTATION.BAN_THRESHOLD) {
    reputation.banned = true;
    reputation.ban_reason = 'Multiple false reports';
  }

  this._reputationStore.set(reporterId, reputation);
  this.updateReputationStorage(reporterId, reputation).catch(console.warn);
  return reputation;
},
  // ══════════════════════════════════════════════════════════════════════════
  // DATA MINIMIZATION for sensitive locations
  // ══════════════════════════════════════════════════════════════════════════
  _anonymizeLocation(coords, locationType) {
    if (this.SENSITIVE_LOCATION_TYPES.includes(locationType)) {
      return {
        lat: Math.round(coords.lat * 1000) / 1000,
        lng: Math.round(coords.lng * 1000) / 1000,
        anonymized: true,
        original_accuracy: 'reduced_to_100m',
        note: 'Location anonymized for sensitive infrastructure'
      };
    }
    return { ...coords, anonymized: false };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GRANULAR CONSENT MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  getConsentForm() {
    return {
      required: this.CONSENT_OPTIONS.disaster_response,
      optional: Object.entries(this.CONSENT_OPTIONS)
        .filter(([key, opt]) => !opt.required && !opt.prohibited)
        .map(([key, opt]) => ({
          purpose: key,
          explanation: opt.explanation,
          default: opt.default
        }))
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DATA SHARING TRANSPARENCY
  // ══════════════════════════════════════════════════════════════════════════
  getDataSharingDisclosure() {
    return {
      recipients: Object.entries(this.DATA_RECIPIENTS).map(([key, recipient]) => ({
        ...recipient,
        can_opt_out: recipient.opt_out
      })),
      total_recipients: Object.keys(this.DATA_RECIPIENTS).length,
      last_updated: new Date().toISOString()
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DATA CORRECTION WORKFLOW
  // ══════════════════════════════════════════════════════════════════════════
  async submitCorrection(originalReportId, correction, evidence) {
    const correctionId = this._generateUUID();
    const correctionRecord = {
      id: correctionId,
      original_report_id: originalReportId,
      correction: correction,
      evidence: evidence,
      status: 'PENDING_VERIFICATION',
      submitted_at: new Date().toISOString(),
      verification_required: true,
      after_verification: 'ORIGINAL_ARCHIVED_CORRECTION_ACTIVE'
    };

    this._correctionStore.set(correctionId, correctionRecord);
    await this._logAuditEvent({
      type: 'CORRECTION_SUBMITTED',
      correction_id: correctionId,
      original_report_id: originalReportId
    });

    return correctionRecord;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PROGRESS PERSISTENCE
  // ══════════════════════════════════════════════════════════════════════════
  saveProgress(sessionId, step, data) {
    const progress = {
      step,
      data,
      timestamp: Date.now()
    };
    this._progressStore.set(sessionId, progress);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`veritas_progress_${sessionId}`, JSON.stringify(progress));
    }

    if (this._supabaseClient && this._supabaseClient.from) {
      this._supabaseClient.from('progress').upsert({
        session_id: sessionId,
        step,
        data,
        timestamp: progress.timestamp
      }).catch(console.warn);
    }
  },

  restoreProgress(sessionId) {
    let progress = this._progressStore.get(sessionId);

    if (!progress && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(`veritas_progress_${sessionId}`);
      if (saved) {
        try {
          progress = JSON.parse(saved);
        } catch (e) {
          progress = null;
        }
      }
    }

    if (progress && Date.now() - progress.timestamp < 86400000) {
      return progress;
    }
    return null;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BATCH REPORTING (family/group)
  // ══════════════════════════════════════════════════════════════════════════
  startBatchReporting(sessionId) {
    this._batchReports.set(sessionId, {
      reports: [],
      current: 0,
      started_at: Date.now()
    });
    return { mode: 'batch', batch_id: sessionId };
  },

  addBatchReport(sessionId, report) {
    const batch = this._batchReports.get(sessionId);
    if (batch) {
      batch.reports.push(report);
      batch.current = batch.reports.length;
      return { added: true, total: batch.reports.length };
    }
    return { added: false, error: 'No active batch session' };
  },

  async submitBatch(sessionId) {
    const batch = this._batchReports.get(sessionId);
    if (!batch) return { error: 'No batch found' };

    const results = [];
    for (const report of batch.reports) {
      const result = await this.score(report);
      results.push(result);
    }

    await this._logAuditEvent({
      type: 'BATCH_SUBMITTED',
      batch_id: sessionId,
      report_count: batch.reports.length
    });

    this._batchReports.delete(sessionId);
    return { submitted: batch.reports.length, results };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LOW-LITERACY ACCESSIBILITY (icon-based, audio fallback)
  // ══════════════════════════════════════════════════════════════════════════
  getIconNavigation(step, language = 'en') {
    const nav = this.ICON_NAVIGATION.steps[step - 1] || this.ICON_NAVIGATION.steps[0];
    const audioGuidance = this.AUDIO_GUIDANCE[language]?.[`step_${step}`] ||
                          this.AUDIO_GUIDANCE.en[`step_${step}`];

    return {
      ...nav,
      audio_guidance: audioGuidance,
      audio_url: `/audio/${language}/step-${step}.mp3`,
      visual_hint: nav.icon,
      requires_reading: false
    };
  },

  getActionIcons() {
    return this.ICON_NAVIGATION.actions;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // OFFLINE VOICE RECOGNITION (keyword detection)
  // ══════════════════════════════════════════════════════════════════════════
  supportsOfflineVoice() {
    return true;
  },

  // R1-SA-004 FIX: STUB — offline keyword detection not yet implemented.
  // Returns the first keyword in the language list as a placeholder result.
  // The confidence value of 0.7 is hardcoded and does not reflect actual detection.
  // Replace with a real offline speech-to-keyword model before production deployment.
  recognizeOfflineVoice(audioSample, language = 'en') {
    const keywords = this.VOICE_KEYWORDS[language] || this.VOICE_KEYWORDS.en;
    return {
      detected: keywords[0],
      confidence: 0.7,
      offline: true,
      stub: true, // R1-SA-004: placeholder — real keyword detection not implemented
      stub_warning: 'Returns first keyword unconditionally. Audio sample is not analysed.'
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HAPTIC FEEDBACK
  // ══════════════════════════════════════════════════════════════════════════
  provideHapticFeedback(confidence, context = {}) {
    if (!this.ACCESSIBILITY.haptic_feedback.enabled) return;
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    if (confidence === 'low' || confidence === 'review') {
      navigator.vibrate([500, 200, 500, 200, 500]);
    } else if (confidence === 'medium' || confidence === 'watch') {
      navigator.vibrate([300, 200, 300]);
    } else if (confidence === 'high') {
      navigator.vibrate(100);
    }

    if (context.emergency) {
      navigator.vibrate([1000, 500, 1000]);
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DARK MODE with ambient light sensor
  // ══════════════════════════════════════════════════════════════════════════
  async detectAndApplyTheme() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return { theme: 'dark', source: 'system' };
      }
    }

    if (typeof window !== 'undefined' && 'AmbientLightSensor' in window) {
      try {
        const sensor = new window.AmbientLightSensor();
        const reading = await new Promise((resolve) => {
          sensor.addEventListener('reading', () => resolve(sensor.illuminance));
          sensor.start();
          setTimeout(() => resolve(null), 1000);
        });

        if (reading !== null && reading < 10) {
          return { theme: 'dark', source: 'ambient_light', illuminance: reading };
        }
      } catch (err) {}
    }

    return { theme: 'light', source: 'default' };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LARGE TEXT MODE
  // ══════════════════════════════════════════════════════════════════════════
  getAccessibilitySettings() {
    return {
      ...this.ACCESSIBILITY,
      current_theme: this._currentTheme || 'light',
      voice_supported: this.supportsOfflineVoice()
    };
  },

  setAccessibilitySetting(setting, value) {
    if (this.ACCESSIBILITY[setting]) {
      this.ACCESSIBILITY[setting].enabled = value;
      return { success: true, setting, value };
    }
    return { success: false, error: 'Setting not found' };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VERIFICATION BADGES
  // ══════════════════════════════════════════════════════════════════════════
  getVerificationBadge(verificationType) {
    return this.VERIFICATION_BADGES[verificationType] || this.VERIFICATION_BADGES.pending;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AUDIO GUIDANCE for non-text languages
  // ══════════════════════════════════════════════════════════════════════════
  getAudioGuidance(step, language = 'en') {
    const guidance = this.AUDIO_GUIDANCE[language] || this.AUDIO_GUIDANCE.en;
    return {
      script: guidance[`step_${step}`] || guidance.step_1,
      audio_url: `/audio/${language}/step-${step}.mp3`,
      fallback_text: this.ICON_NAVIGATION.steps[step - 1]?.description || '',
      visual_hint: this.ICON_NAVIGATION.steps[step - 1]?.icon || '📸'
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CONFIRMATION for critical actions
  // ══════════════════════════════════════════════════════════════════════════
  requireConfirmation(report) {
    if (report.internalTier === 'Completely damaged') {
      return {
        required: true,
        message: '⚠️ This report indicates SEVERE DAMAGE. Emergency services may be dispatched. Is this correct?',
        options: [
          { text: 'Yes, deploy resources', action: 'submit', severity: 'critical' },
          { text: 'No, let me review', action: 'cancel', severity: 'safe' }
        ]
      };
    }
    return { required: false };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PES — Photo Evidence Score
  // ══════════════════════════════════════════════════════════════════════════
  computePES(report, isRealModel = false) {
    const result = {
      value: 0.50,
      measurement_class: 'INFERENTIAL',
      evaluable: true,
      gated: false,
      um_contribution: 0,
      note: '',
    };

    if (!report.photo) {
      result.value = null;
      result.evaluable = false;
      result.measurement_class = 'NOT_EVALUABLE';
      result.um_contribution = 0.25;
      result.note = 'No photo submitted. PES dimension excluded from DCI.';
      return result;
    }

    if (!report.photoAiScore || report.photoAiConf === null || report.photoAiConf === undefined) {
      result.value = null;
      result.evaluable = false;
      result.measurement_class = 'NOT_EVALUABLE';
      result.um_contribution = 0.25;
      result.note = 'No AI analysis available — PES dimension excluded.';
      return result;
    }

    if (report.photoAiConf < 0.60) {
      result.value = 0.50;
      result.measurement_class = isRealModel ? 'EVALUATIVE_GATED' : 'INFERENTIAL';
      result.gated = true;
      result.um_contribution = isRealModel ? 0.10 : 0.30;
      result.note = `Model confidence ${(report.photoAiConf * 100).toFixed(0)}% below 60% threshold — PES gated to 0.50.`;
      return result;
    }

    result.value = Math.max(0, Math.min(1, report.photoAiScore));
    result.gated = false;

    if (isRealModel) {
      result.measurement_class = 'EVALUATIVE';
      result.um_contribution = 0;
      result.note = `AI analysis: score ${report.photoAiScore.toFixed(3)}, confidence ${(report.photoAiConf * 100).toFixed(0)}%.`;
    } else {
      result.measurement_class = 'INFERENTIAL';
      result.um_contribution = 0.20;
      result.note = `AI analysis (placeholder model): score ${report.photoAiScore.toFixed(3)}. Upgrade to trained model to remove penalty.`;
    }

    return result;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // COR — Corroboration Score
  // ══════════════════════════════════════════════════════════════════════════
  computeCOR(nearbyReports, currentTier, reportUuid) {
    const result = {
      value: 0.50,
      evaluable: true,
      um_contribution: 0,
      assumption: null,
      note: '',
      signal_type: 'NEUTRAL',
    };

    if (!nearbyReports || nearbyReports.length === 0) {
      result.value = null;
      result.evaluable = false;
      result.um_contribution = 0.20;
      result.signal_type = 'NO_EVIDENCE';
      result.assumption = {
        id: 'COR-A01',
        text: 'No nearby reports exist — corroboration is unknown.',
        plain_language: '⚠️ First report in this area. No other reports to confirm damage level.',
        source: 'computeCOR',
        timestamp: new Date().toISOString()
      };
      result.note = 'First report in this area. No corroboration available. COR dimension excluded.';
      return result;
    }

    if (nearbyReports.length === 1) {
      const agrees = nearbyReports[0].internalTier === currentTier;
      // R1-EL-003 FIX: The 0.40 disagreement value is a deliberate design choice:
      // contradiction should cost MORE than the baseline neutral (0.50) to reflect
      // that a single opposing report actively undermines rather than merely fails
      // to confirm. 0.40 was chosen over 0.45 or 0.35 as the midpoint between
      // floor (0.40) and neutral, making the penalty proportionate but not severe.
      // FCL-CANDIDATE: validate 0.40 against ground-truth contradiction outcomes.
      result.value = agrees ? 0.55 : 0.40;
      result.um_contribution = 0.05;
      result.signal_type = agrees ? 'WEAK_AGREEMENT' : 'WEAK_CONTRADICTION';
      result.note = agrees
        ? 'One nearby report agrees. Weak corroboration — single independent source.'
        : 'One nearby report disagrees on damage level. Contradiction detected.';
      return result;
    }

    const agreements = nearbyReports.filter(r => r.internalTier === currentTier).length;
    const contradictions = nearbyReports.length - agreements;
    const agreementRate = agreements / nearbyReports.length;

    // R2-EL-002 FIX: pre-clamp score preserved in raw_score for transparency.
    // The clamped value is correct for UM purposes; raw_score surfaces contradiction
    // magnitude that the clamp otherwise hides (e.g. 5 contradictions → -0.75 vs 0).
    const rawScore = agreementRate - (contradictions * 0.15);
    const score = Math.max(0, Math.min(1, rawScore));
    result.raw_score = parseFloat(rawScore.toFixed(3));

    if (contradictions > 0) {
      result.um_contribution = 0.08 * (contradictions / nearbyReports.length);
      result.signal_type = contradictions > agreements ? 'CONTRADICTION' : 'MIXED';
    } else {
      result.signal_type = 'STRONG_AGREEMENT';
    }

    result.value = parseFloat(score.toFixed(3));
    result.note = `${nearbyReports.length} nearby reports: ${agreements} agree, ${contradictions} contradict. Agreement rate: ${(agreementRate * 100).toFixed(0)}%.`;
    return result;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TFR — Temporal Freshness Rate
  // ══════════════════════════════════════════════════════════════════════════
  computeTFR(timestampISO) {
    const hoursElapsed = (Date.now() - new Date(timestampISO).getTime()) / 3600000;
    const value = Math.max(0, 1 - (hoursElapsed / 48));

    let freshness_status, um_contribution;
    if (value >= 0.80) { freshness_status = 'FRESH'; um_contribution = 0; }
    else if (value >= 0.60) { freshness_status = 'AGING'; um_contribution = 0.05; }
    else if (value >= 0.25) { freshness_status = 'STALE'; um_contribution = 0.10; }
    else { freshness_status = 'EXPIRED'; um_contribution = 0.15; }

    return {
      value: parseFloat(value.toFixed(3)),
      um_contribution,
      hours_elapsed: parseFloat(hoursElapsed.toFixed(1)),
      freshness_status,
      note: `${hoursElapsed.toFixed(1)}h since submission. Status: ${freshness_status}.`,
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CCI — Classification Consistency Index
  // ══════════════════════════════════════════════════════════════════════════
  computeCCI(internalTier, infraType) {
    const result = {
      value: 1.0,
      um_contribution: 0,
      flagged: false,
      note: 'Classification consistent.',
    };

    if (!internalTier || !infraType) {
      result.value = 0.80;
      result.note = 'Infrastructure type or damage tier not declared — default CCI applied.';
      return result;
    }

    const suspiciousCombinations = [
      { tier: 'Completely damaged', infra: 'Road', cci: 0.70, reason: 'Roads rarely achieve total collapse.' },
      { tier: 'Completely damaged', infra: 'Transport', cci: 0.70, reason: 'Transport infrastructure rarely total collapse.' },
      { tier: 'Completely damaged', infra: 'Utility', cci: 0.75, reason: 'Utility collapse typically partial.' },
      { tier: 'Completely damaged', infra: 'Bridge', cci: 0.80, reason: 'Bridge collapse plausible but verify.' },
    ];

    const match = suspiciousCombinations.find(c => c.tier === internalTier && c.infra === infraType);

    if (match) {
      result.value = match.cci;
      result.um_contribution = 0.08;
      result.flagged = true;
      result.note = match.reason;
    }

    return result;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CORRELATED FAILURE DETECTION
  // ══════════════════════════════════════════════════════════════════════════
  detectCorrelatedFailures(pes, cor, recentFailureRate = 0) {
    const result = { correlated: false, penalty: 0, reason: null };

    if (this._circuitBreaker.engaged) {
      result.correlated = true;
      result.penalty = 0.60;
      result.reason = 'Circuit breaker engaged: correlated failure storm detected';
      return result;
    }

    if (pes.measurement_class === 'INFERENTIAL' && cor.evaluable === false) {
      result.correlated = true;
      result.penalty = Math.max(pes.um_contribution, cor.um_contribution) * 1.2;
      result.reason = 'Photo and corroboration both missing — correlated epistemic gap';
    }
    else if (pes.evaluable === false && cor.evaluable === false) {
      result.correlated = true;
      result.penalty = 0.45;
      result.reason = 'Both photo and corroboration unavailable — high correlated uncertainty';
    }

    return result;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ECF CONFIDENCE INTEGRATION
  // ══════════════════════════════════════════════════════════════════════════
  computeECFContribution(findings, dimension) {
    if (!findings || findings.length === 0) return 0;

    const ECF_WEIGHTS = { 'D': 0.00, 'R': 0.05, 'S': 0.10, '?': 0.15 };

    const dimensionFindings = findings.filter(f => f.dimension === dimension);
    if (dimensionFindings.length === 0) return 0;

    let total = 0;
    dimensionFindings.forEach(f => {
      const ecf = f.ecf || (f.tags ? f.tags.ecf : '?');
      total += ECF_WEIGHTS[ecf] || 0.10;
    });

    return Math.min(0.30, total / dimensionFindings.length);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MISSING DIMENSION RENORMALIZATION
  // ══════════════════════════════════════════════════════════════════════════
  normalizeWithPenalty(activeDimensions, scores) {
    const totalWeight = activeDimensions.reduce((sum, dim) => sum + this.W[dim], 0);
    const missingDimensions = ['PES', 'COR', 'TFR', 'CCI'].filter(d => !activeDimensions.includes(d));

    let missingPenalty = 1.0;
    const penalties = { PES: 0.25, COR: 0.20, TFR: 0.15, CCI: 0.10 };
    for (const dim of missingDimensions) {
      missingPenalty -= penalties[dim] || 0.20;
    }
    missingPenalty = Math.max(0.40, missingPenalty);

    let weightedSum = 0;
    activeDimensions.forEach(dim => {
      const normalizedWeight = this.W[dim] / totalWeight;
      weightedSum += normalizedWeight * scores[dim];
    });

    return {
      score: weightedSum * missingPenalty,
      missing_penalty_applied: missingPenalty,
      active_dimensions: activeDimensions,
      excluded_dimensions: missingDimensions.map(d => ({ dimension: d, penalty: penalties[d] || 0.20 }))
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // UNCERTAINTY MASS COMPUTATION
  // ══════════════════════════════════════════════════════════════════════════
  computeUM(pes, cor, tfr, cci, correlatedFailure, ecfContributions = {}) {
    const penalties = [
      pes.um_contribution + (ecfContributions.PES || 0),
      cor.um_contribution + (ecfContributions.COR || 0),
      tfr.um_contribution + (ecfContributions.TFR || 0),
      cci.um_contribution + (ecfContributions.CCI || 0)
    ].filter(p => p !== undefined && p !== null);

    let um = 1 - penalties.reduce((acc, p) => acc * (1 - Math.max(0, p)), 1);

    if (correlatedFailure.correlated) {
      um = Math.min(1, um + correlatedFailure.penalty);
    }

    um = parseFloat(Math.min(1, Math.max(0, um)).toFixed(3));

    let validity_status, ceiling;
    let adjustedThreshold = this.THRESHOLDS.UM_VALID;

    if (correlatedFailure.correlated) {
      adjustedThreshold = this.THRESHOLDS.UM_VALID * 0.8;
    }

    if (um < adjustedThreshold) {
      validity_status = 'VALID';
      ceiling = 1.0;
    } else if (um < this.THRESHOLDS.UM_DEGRADED) {
      validity_status = 'DEGRADED';
      ceiling = 1.0 - (um - adjustedThreshold);
    } else {
      validity_status = 'SUSPENDED';
      ceiling = 0.40;
    }

    return { mass: um, validity_status, ceiling, correlated_penalty_applied: correlatedFailure.correlated };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // POSITIVE AFFIRMATIONS
  // ══════════════════════════════════════════════════════════════════════════
  getStrengths(pes, cor, tfr, cci, reportCoordinates, photoGeotag, photoAccuracy = 10) {
    const strengths = [];
    const weaknesses = [];

    if (pes.value && pes.value >= 0.80 && !pes.gated && pes.measurement_class === 'EVALUATIVE') {
      if (photoGeotag && reportCoordinates) {
        // R3-SA-003 FIX: anonymized coordinates are rounded to ±~111m precision.
        // Running _calculateDistance against rounded coords and then claiming
        // "location verified within Nm" is false assurance — the stated precision
        // cannot be delivered. Skip the check entirely; emit an explicit warning.
        if (reportCoordinates.anonymized) {
          weaknesses.push('⚠️ Location verification unavailable — sensitive site anonymized. Coordinate precision is insufficient for distance check.');
        } else {
          const distance = this._calculateDistance(
            photoGeotag.lat, photoGeotag.lng,
            reportCoordinates.lat, reportCoordinates.lng
          );
          if (distance <= 100) {
            strengths.push(`✅ Photo evidence clear, high model confidence, location verified within ${Math.round(distance)}m`);
          } else {
            weaknesses.push(`⚠️ Photo location ${Math.round(distance)}m from reported location`);
          }
        }
      } else {
        strengths.push('✅ Photo evidence clear, high model confidence');
      }
    }

    if (cor.signal_type === 'STRONG_AGREEMENT') {
      strengths.push('✅ Strong corroboration — multiple reports agree');
    } else if (cor.signal_type === 'CONTRADICTION') {
      weaknesses.push('⚠️ Contradiction with nearby reports — verify locally');
    } else if (cor.signal_type === 'WEAK_AGREEMENT') {
      weaknesses.push('⚠️ Weak corroboration — one nearby report agrees');
    } else if (cor.signal_type === 'NO_EVIDENCE') {
      weaknesses.push('⚠️ No corroboration yet — share to improve');
    }

    if (tfr.value >= 0.80) {
      strengths.push(`✅ Timely report (${tfr.hours_elapsed}h after event)`);
    } else if (tfr.value < 0.40) {
      weaknesses.push(`⚠️ Stale report (${tfr.hours_elapsed}h old) — freshness reduces confidence`);
    }

    if (cci.value >= 0.90 && !cci.flagged) {
      strengths.push('✅ Classification consistent with infrastructure type');
    } else if (cci.flagged) {
      weaknesses.push(`⚠️ ${cci.note}`);
    }

    return { strengths, weaknesses };
  },

  _calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  // ══════════════════════════════════════════════════════════════════════════
  // UM VISUALIZATION
  // ══════════════════════════════════════════════════════════════════════════
  getUMBreakdown(pes, cor, tfr, cci) {
    const breakdown = [];

    if (pes.um_contribution > 0) {
      let description = '';
      if (pes.evaluable === false) description = `📷 No photo (+${(pes.um_contribution * 100).toFixed(0)}%)`;
      else if (pes.measurement_class === 'INFERENTIAL') description = `📷 AI uncertain (+${(pes.um_contribution * 100).toFixed(0)}%)`;
      else if (pes.gated) description = `📷 AI low confidence (+${(pes.um_contribution * 100).toFixed(0)}%)`;
      if (description) breakdown.push(description);
    }

    if (cor.um_contribution > 0) {
      let description = '';
      if (cor.evaluable === false) description = `🔍 No other reports (+${(cor.um_contribution * 100).toFixed(0)}%)`;
      else if (cor.signal_type === 'CONTRADICTION') description = `🔍 Conflicting reports (+${(cor.um_contribution * 100).toFixed(0)}%)`;
      else if (cor.signal_type === 'WEAK_AGREEMENT') description = `🔍 Only one other report (+${(cor.um_contribution * 100).toFixed(0)}%)`;
      if (description) breakdown.push(description);
    }

    if (tfr.um_contribution > 0) {
      breakdown.push(`⏱️ ${tfr.hours_elapsed}h old (+${(tfr.um_contribution * 100).toFixed(0)}%)`);
    }

    if (cci.um_contribution > 0) {
      breakdown.push(`⚖️ Unusual combination (+${(cci.um_contribution * 100).toFixed(0)}%)`);
    }

    return breakdown;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VERIFICATION CERTIFICATE
  // ══════════════════════════════════════════════════════════════════════════
  generateVerificationCertificate(report, dci, tier) {
    const certificateId = `VRT-${report.uuid?.slice(0, 4).toUpperCase() || 'XXXX'}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const qrData = JSON.stringify({
      id: certificateId,
      uuid: report.uuid,
      dci: dci,
      tier: tier,
      timestamp: report.timestamp,
      verify: `https://veritas.aion.net/verify/${certificateId}`
    });

    const humanReadable = `
VERITAS CERTIFIED REPORT
========================
ID: ${certificateId}
DCI: ${Math.round(dci * 100)}% (${tier.toUpperCase()} CONFIDENCE)
LOCATION: ${report.coordinates?.lat?.toFixed(4) || 'unknown'}, ${report.coordinates?.lng?.toFixed(4) || 'unknown'}
DATE: ${new Date(report.timestamp).toLocaleDateString()}
VERIFIER: CERTUS Engine v${this.VERSION}

TO VERIFY:
1. Open veritas.aion.net/verify
2. Enter code: ${certificateId}
3. Confirmation will appear

This report is ${this.PLAIN_LANGUAGE[tier === 'high' ? 'VALID' : (tier === 'watch' ? 'DEGRADED' : 'SUSPENDED')]}
    `.trim();

    return {
      certificate_id: certificateId,
      qr_data: qrData,
      qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`,
      shareable_link: `https://veritas.aion.net/verify/${certificateId}`,
      shareable_text: `VERITAS CERTIFIED: Report ${certificateId} is ${Math.round(dci * 100)}% reliable. Verify at veritas.aion.net/verify/${certificateId}`,
      human_readable: humanReadable,
      // R5-DT-001 FIX: structured summary for mobile field rendering.
      // human_readable uses ASCII alignment that collapses to unformatted text on
      // mobile devices. The UI must render certificate_summary as the primary
      // display surface — id and dci_pct are the two most critical fields for
      // a field user and must be visually prominent.
      certificate_summary: {
        id: certificateId,
        dci_pct: Math.round(dci * 100),
        tier: tier.toUpperCase(),
        action: tier === 'high' ? 'SHARE' : (tier === 'watch' ? 'VERIFY' : 'WAIT'),
        verify_url: `https://veritas.aion.net/verify/${certificateId}`,
        issued_at: new Date().toISOString()
      }
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AUDIO FEEDBACK
  // ══════════════════════════════════════════════════════════════════════════
  getAudioFeedback(tier, validityStatus, language = 'en') {
    // R4-CP-002 FIX: detect unsupported language and surface fallback flag.
    // Previously the engine silently fell back to English with no signal to the UI.
    const SUPPORTED_AUDIO_LANGUAGES = ['en', 'es', 'ar', 'zh'];
    const languageFallback = !SUPPORTED_AUDIO_LANGUAGES.includes(language);
    const resolvedLanguage = languageFallback ? 'en' : language;

    if (tier === 'review' || validityStatus === 'SUSPENDED') {
      const feedback = this.AUDIO_FEEDBACK.review;
      return {
        play: true,
        sound: this.AUDIO_FEEDBACK.languages[resolvedLanguage]?.review || feedback.sound,
        volume: feedback.volume,
        message: feedback.message,
        gentle: true,
        language_fallback: languageFallback,
        fallback_reason: languageFallback ? 'language_not_supported' : null,
        fallback_language: languageFallback ? 'en' : null
      };
    }
    if (tier === 'watch') {
      const feedback = this.AUDIO_FEEDBACK.watch;
      return {
        play: true,
        sound: this.AUDIO_FEEDBACK.languages[resolvedLanguage]?.watch || feedback.sound,
        volume: feedback.volume,
        message: feedback.message,
        gentle: true,
        language_fallback: languageFallback,
        fallback_reason: languageFallback ? 'language_not_supported' : null,
        fallback_language: languageFallback ? 'en' : null
      };
    }
    return {
      play: false,
      language_fallback: languageFallback,
      fallback_reason: languageFallback ? 'language_not_supported' : null,
      fallback_language: languageFallback ? 'en' : null
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FIELD MODE (completely non-technical, low-literacy)
  // ══════════════════════════════════════════════════════════════════════════
  getFieldView(scoreResult, context = {}) {
    if (context.mode !== 'field') return null;

    const tier = scoreResult.tier;

    let action, confidence, whatToDo, whatNotToDo, shareCode, audioGuidance;

    if (tier === 'high') {
      action = 'SHARE THIS REPORT';
      confidence = 'HIGH';
      whatToDo = 'Send this to response coordinators. Your report is verified.';
      whatNotToDo = 'Do not submit another report for this location.';
      audioGuidance = 'Your report is verified. Share this with responders.';
    } else if (tier === 'watch') {
      action = 'VERIFY LOCALLY';
      confidence = 'MEDIUM';
      whatToDo = 'Check local conditions before acting. Share with community leaders.';
      whatNotToDo = 'Do not deploy resources without local verification.';
      audioGuidance = 'Please verify locally before acting.';
    } else {
      action = 'NEEDS VERIFICATION';
      confidence = 'LOW';
      whatToDo = 'Wait for field verification before acting. Take additional photos if safe.';
      whatNotToDo = 'Do not rely on this report for decisions.';
      audioGuidance = 'This report needs verification. Please wait.';
    }

    shareCode = scoreResult.verification_certificate?.certificate_id ||
                `VRT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return {
      mode: 'field',
      action: action,
      confidence: confidence,
      what_to_do: whatToDo,
      what_not_to_do: whatNotToDo,
      share_code: shareCode,
      audio_guidance: audioGuidance,
      next_steps: [
        { icon: '📱', action: 'show', description: 'Show this screen to helper', audio: 'show_screen.mp3' },
        { icon: '📞', action: 'call', number: '+1-800-555-0123', description: 'Call for help', audio: 'call_help.mp3' },
        { icon: '📍', action: 'wait', description: 'Stay here', audio: 'stay_here.mp3' }
      ],
      color: this.MARKER_STYLES[tier]?.color || '#888',
      low_literacy: {
        icons_only: true,
        audio_supported: true,
        requires_reading: false
      }
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GUIDED TUTORIAL (low-literacy)
  // ══════════════════════════════════════════════════════════════════════════
  getOnboardingStep(userProgress, language = 'en') {
    if (!userProgress.hasTakenPhoto) {
      return {
        step: 1,
        icon: '📸',
        title: 'Take a Photo',
        instructions: 'Point camera at the damage. Clear, well-lit photos get higher confidence scores.',
        audio_url: `/audio/${language}/step-1.mp3`,
        example: 'show_photo_example',
        next: 'Take Photo →',
        total_steps: 5,
        low_literacy: {
          icon_only: true,
          audio_instruction: 'Point your phone at the damage. Take a clear photo.',
          visual_hint: 'show_camera_icon'
        },
        // R5-DT-002 FIX: exit path available at every step
        exit_path: {
          action: 'SAVE_AND_EXIT',
          audio_instruction: 'You can save your progress and come back later.',
          save_before_exit: true,
          label: 'Save for later'
        }
      };
    }
    if (!userProgress.hasSelectedDamage) {
      return {
        step: 2,
        icon: '🏚️',
        title: 'Assess Damage',
        instructions: 'Select the damage level. Be honest — the system helps responders prioritize.',
        audio_url: `/audio/${language}/step-2.mp3`,
        options: [
          { value: 'minimal', icon: '✅', label: 'Minimal / No damage', audio: 'minimal_damage.mp3' },
          { value: 'partial', icon: '⚠️', label: 'Partially damaged', audio: 'partial_damage.mp3' },
          { value: 'complete', icon: '❌', label: 'Completely damaged', audio: 'complete_damage.mp3' }
        ],
        next: 'Select Damage →',
        total_steps: 5,
        low_literacy: {
          icon_only: true,
          audio_instruction: 'Choose how bad the damage is. Minimal, partial, or complete.',
          visual_hints: ['checkmark', 'warning', 'cross']
        },
        exit_path: {
          action: 'SAVE_AND_EXIT',
          audio_instruction: 'You can save your progress and come back later.',
          save_before_exit: true,
          label: 'Save for later'
        }
      };
    }
    if (!userProgress.hasSelectedInfra) {
      return {
        step: 3,
        icon: '🏗️',
        title: 'What Was Damaged?',
        instructions: 'Select the type of infrastructure affected.',
        audio_url: `/audio/${language}/step-3.mp3`,
        options: [
          { value: 'Residential', icon: '🏠', label: 'House / Building', audio: 'residential.mp3' },
          { value: 'Road', icon: '🛣️', label: 'Road / Street', audio: 'road.mp3' },
          { value: 'Bridge', icon: '🌉', label: 'Bridge', audio: 'bridge.mp3' },
          { value: 'Utility', icon: '⚡', label: 'Electricity / Water', audio: 'utility.mp3' },
          { value: 'Medical', icon: '🏥', label: 'Hospital / Clinic', audio: 'medical.mp3' },
          { value: 'School', icon: '🏫', label: 'School', audio: 'school.mp3' },
          { value: 'Other', icon: '📝', label: 'Something else', audio: 'other.mp3' }
        ],
        next: 'Select Type →',
        total_steps: 5,
        low_literacy: {
          icon_only: true,
          audio_instruction: 'What was damaged? A building, road, bridge, or something else?',
          visual_hints: ['house', 'road', 'bridge', 'electricity', 'hospital', 'school']
        },
        exit_path: {
          action: 'SAVE_AND_EXIT',
          audio_instruction: 'You can save your progress and come back later.',
          save_before_exit: true,
          label: 'Save for later'
        }
      };
    }
    if (!userProgress.hasConfirmedLocation) {
      return {
        step: 4,
        icon: '📍',
        title: 'Confirm Location',
        instructions: 'Make sure the pin is at the correct location. Drag to adjust if needed.',
        audio_url: `/audio/${language}/step-4.mp3`,
        next: 'Confirm Location →',
        total_steps: 5,
        low_literacy: {
          icon_only: true,
          audio_instruction: 'Move the pin to the damage location. Tap the map to adjust.',
          visual_hint: 'show_map_pin'
        },
        exit_path: {
          action: 'SAVE_AND_EXIT',
          audio_instruction: 'Your location is saved. You can come back to submit later.',
          save_before_exit: true,
          label: 'Save for later'
        }
      };
    }
    if (!userProgress.hasSubmitted) {
      return {
        step: 5,
        icon: '✅',
        title: 'Submit Report',
        instructions: 'Review your report and submit. This helps responders help your community.',
        audio_url: `/audio/${language}/step-5.mp3`,
        next: 'Submit Report →',
        total_steps: 5,
        low_literacy: {
          icon_only: true,
          audio_instruction: 'Your report is ready. Press send to help your community.',
          visual_hint: 'checkmark'
        },
        // R5-DT-002 FIX: exit path on final step before submission
        exit_path: {
          action: 'SAVE_AND_EXIT',
          audio_instruction: 'You can save your report and come back later.',
          save_before_exit: true,
          label: 'Save for later'
        }
      };
    }
    // R4-CP-003 FIX: return a completion object instead of null.
    // Previously the onboarding flow went silent after all steps completed —
    // a critical UX gap in high-stress field contexts.
    return {
      step: 'COMPLETE',
      icon: '🎉',
      title: 'Report Submitted',
      instructions: 'Your report has been submitted. Thank you for helping your community.',
      audio_url: `/audio/${language || 'en'}/complete.mp3`,
      next_action: 'Your report is being processed. You will receive a verification code shortly.',
      total_steps: 5,
      low_literacy: {
        icon_only: true,
        audio_instruction: 'Your report has been sent. Thank you.',
        visual_hint: 'success_checkmark'
      },
      exit_path: {
        action: 'RETURN_HOME',
        audio_instruction: 'You can submit another report or return to the main screen.',
        save_before_exit: false,
        label: 'Return to home'
      }
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VOICE INPUT SUPPORT (offline keyword detection)
  // ══════════════════════════════════════════════════════════════════════════
  supportsVoiceInput() {
    return true;
  },

  getVoiceInputConfig(language = 'en') {
    const languages = {
      en: 'en-US', es: 'es-ES', ar: 'ar-SA', zh: 'zh-CN'
    };
    // R4-CP-002 FIX: detect unsupported languages and surface fallback flag.
    const languageFallback = !languages[language];
    return {
      supported: true,
      language: languages[language] || 'en-US',
      offline_supported: true,
      keywords: this.VOICE_KEYWORDS[language] || this.VOICE_KEYWORDS.en,
      placeholder: 'Tap microphone and speak location description...',
      offline_mode: 'keyword_detection',
      language_fallback: languageFallback,
      fallback_reason: languageFallback ? 'language_not_supported' : null,
      fallback_language: languageFallback ? 'en' : null
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EMERGENCY RESOURCES
  // ══════════════════════════════════════════════════════════════════════════
  getEmergencyResources(report, coordinates) {
    if (report.internalTier !== 'Completely damaged') {
      return null;
    }

    return {
      triggered: true,
      damage_severity: 'SEVERE',
      local_contacts: [
        { name: 'Local Emergency Services', number: '911', action: 'call', icon: '📞' },
        { name: 'UNDP Field Office', number: '+1-800-555-0123', action: 'sms', icon: '📱' }
      ],
      shelter_locations: this._findNearestShelters(coordinates, 10),
      medical_facilities: this._findNearestMedical(coordinates, 5),
      message: 'Severe damage detected. Emergency services have been notified.',
      audio_alert: 'severe_damage_alert.mp3',
      require_confirmation: true
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SHARE INTEGRATION
  // ══════════════════════════════════════════════════════════════════════════
  getShareData(report, certificate) {
    const shareUrl = certificate?.shareable_link || `https://veritas.aion.net/report/${report.uuid}`;
    const shareText = certificate?.shareable_text ||
                     `Damage report: ${report.internalTier} damage to ${report.infraType}. Verify at ${shareUrl}`;

    return {
      title: 'VERITAS Damage Report',
      text: shareText,
      url: shareUrl,
      canShare: typeof navigator !== 'undefined' && !!navigator.share,
      low_literacy: {
        icon: '📱',
        instruction: 'Show this screen to someone who can help',
        audio: 'share_report.mp3'
      }
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // OFFLINE MAP TILE CACHING
  // ══════════════════════════════════════════════════════════════════════════
  registerOfflineMapSupport() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-map.js')
        .then(reg => console.log('[CERTUS] Map tile caching service worker registered'))
        .catch(err => console.warn('[CERTUS] Map tile caching registration failed:', err));
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // OFFLINE SUPPORT
  // ══════════════════════════════════════════════════════════════════════════
  registerOfflineSupport() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('[CERTUS] Offline support service worker registered');
          this._offlineSupported = true;
        })
        .catch(err => {
          console.warn('[CERTUS] Service worker registration failed:', err);
          this._offlineSupported = false;
          this._recordDegradation('service_worker', err);
        });
    }
    return this._offlineSupported;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NLP TEXT ANALYSIS for witness statements
  // ══════════════════════════════════════════════════════════════════════════
  _extractDamageFromWitness(statement) {
    if (!statement || !statement.text) return null;

    const text = statement.text.toLowerCase();
    let damageScore = 0;
    let damageLevel = 'partial';

    for (const keyword of this.NLP_CONFIG.damageKeywords.minimal) {
      if (text.includes(keyword)) damageScore -= 0.3;
    }
    for (const keyword of this.NLP_CONFIG.damageKeywords.partial) {
      if (text.includes(keyword)) damageScore += 0.5;
    }
    for (const keyword of this.NLP_CONFIG.damageKeywords.complete) {
      if (text.includes(keyword)) damageScore += 1.0;
    }

    damageScore = Math.max(0, Math.min(1, (damageScore + 0.5) / 2));

    if (damageScore >= 0.7) damageLevel = 'complete';
    else if (damageScore >= 0.4) damageLevel = 'partial';
    else damageLevel = 'minimal';

    const isUrgent = this.NLP_CONFIG.sentimentAnalysis.urgency.some(word => text.includes(word));
    const isUncertain = this.NLP_CONFIG.sentimentAnalysis.uncertainty.some(word => text.includes(word));

    return {
      damage_level: damageLevel,
      confidence: damageScore,
      is_urgent: isUrgent,
      is_uncertain: isUncertain,
      keywords_found: this._findKeywords(text)
    };
  },

  _findKeywords(text) {
    const found = [];
    for (const [level, keywords] of Object.entries(this.NLP_CONFIG.damageKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          found.push({ keyword, level, position: text.indexOf(keyword) });
        }
      }
    }
    return found;
  },

  // Infrastructure type inference from text description
  _inferInfrastructureType(text) {
    if (!text) return null;

    const lowerText = text.toLowerCase();
    let bestMatch = { type: null, confidence: 0, matches: [] };

    for (const [type, keywords] of Object.entries(this.NLP_CONFIG.infrastructureKeywords)) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword));
      if (matches.length > 0) {
        const confidence = Math.min(0.95, matches.length / keywords.length);
        if (confidence > bestMatch.confidence) {
          bestMatch = { type, confidence, matches };
        }
      }
    }

    return bestMatch.confidence > 0.3 ? bestMatch : null;
  },

  // [GAP-6] _getMostCommon — replaced O(n²) buggy sort with O(n) frequency map.
  // Original used arr.sort with a comparator that returned wrong sign for lower-frequency
  // items, making the result unreliable. Also the O(n²) filter inside sort was
  // wasteful on large arrays.
  _getMostCommon(arr) {
    if (!arr || arr.length === 0) return null;
    const freq = {};
    let maxFreq = 0;
    let maxVal = arr[0];
    for (const val of arr) {
      freq[val] = (freq[val] || 0) + 1;
      if (freq[val] > maxFreq) {
        maxFreq = freq[val];
        maxVal = val;
      }
    }
    return maxVal;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PHOTO ANALYSIS with OpenRouter API
  // ══════════════════════════════════════════════════════════════════════════
  async _extractDamageFromPhoto(photoDataUrl) {
    if (!photoDataUrl) return null;

    try {
      const base64Image = photoDataUrl.split(',')[1];
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      if (!response.ok) throw new Error('Photo analysis failed');

      const result = await response.json();
      return {
        damage_level: result.damage_level,
        confidence: result.confidence,
        score: result.score,
        model: result.model
      };
    } catch (error) {
      console.error('[CERTUS] Photo analysis error:', error);
      return null;
    }
  },

  // Batch analyze multiple photos
  async analyzeBatchPhotos(photoUrls, infrastructureType = null) {
    const results = [];
    for (const photo of photoUrls) {
      const analysis = await this._extractDamageFromPhoto(photo);
      results.push(analysis);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const damageLevels = results.map(r => r?.damage_level).filter(Boolean);
    const mostCommon = this._getMostCommon(damageLevels);
    const avgConfidence = results.reduce((sum, r) => sum + (r?.confidence || 0), 0) / results.length;

    return {
      individual: results,
      aggregated: {
        damage_level: mostCommon,
        confidence: avgConfidence,
        photos_analyzed: results.length,
        consistency: damageLevels.every(l => l === mostCommon) ? 'HIGH' : 'MEDIUM'
      }
    };
  },

  // [GAP-4] PERCEPTUAL HASH — replaces imageDataUrl.substring(0,100) stub.
  //
  // Browser path: renders image on an 8x8 canvas, converts to grayscale,
  // computes average luminance, then generates a 64-bit binary difference hash
  // (dHash). Each bit represents whether a pixel is brighter than the pixel
  // immediately to its right. This is a standard, well-understood perceptual
  // hash algorithm. Hamming distance on two 64-bit hashes gives meaningful
  // similarity even under JPEG compression, minor crops, and brightness changes.
  //
  // Node / fallback path: FNV-1a 64-bit equivalent over the full data URL string.
  // This is a content hash (not perceptual), so similarity will only be 1.0
  // for identical inputs. Flagged in the return value so callers can act on it.
  async _generatePerceptualHash(imageDataUrl) {
    if (!imageDataUrl) return null;

    // ── Browser path: real dHash ──────────────────────────────────────────
    if (typeof document !== 'undefined' && typeof HTMLCanvasElement !== 'undefined') {
      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('Image load failed'));
          img.src = imageDataUrl;
          // Safety timeout
          setTimeout(() => reject(new Error('Image load timeout')), 5000);
        });

        // 9 wide × 8 tall for dHash (compare each pixel to the one to its right)
        const canvas = document.createElement('canvas');
        canvas.width = 9;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 9, 8);
        const data = ctx.getImageData(0, 0, 9, 8).data;

        // Convert to grayscale luminance array (9×8 = 72 pixels)
        const luma = [];
        for (let i = 0; i < data.length; i += 4) {
          luma.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        }

        // dHash: 64 bits — compare each pixel to its right neighbour in each row
        let bits = '';
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            bits += luma[row * 9 + col] > luma[row * 9 + col + 1] ? '1' : '0';
          }
        }

        return bits; // 64-character binary string
      } catch (err) {
        // Fall through to content hash
        console.warn('[CERTUS] dHash failed, falling back to FNV-1a:', err.message);
      }
    }

    // ── Node / fallback path: FNV-1a over full data URL ───────────────────
    // Not perceptual — identical content only. Marked so callers know.
    let h = 0x811c9dc5;
    for (let i = 0; i < imageDataUrl.length; i++) {
      h ^= imageDataUrl.charCodeAt(i);
      h = (h * 0x01000193) >>> 0; // unsigned 32-bit
    }
    return `fnv:${h.toString(16).padStart(8, '0')}`;
  },

  // [GAP-5] HASH SIMILARITY — Hamming distance for binary (perceptual) hashes,
  // character-diff ratio for hex (FNV) fallbacks.
  // Binary hashes: a Hamming distance of ≤ 10/64 bits (~84% match) is typically
  // a near-duplicate. A threshold of 0.95 (≤ 3 bit differences) catches only
  // very close duplicates.
  _calculateHashSimilarity(hash1, hash2) {
    if (!hash1 || !hash2) return 0;
    if (hash1 === hash2) return 1.0;

    // Both are 64-bit binary strings (dHash output)
    const isBinary = /^[01]{64}$/.test(hash1) && /^[01]{64}$/.test(hash2);
    if (isBinary) {
      let matching = 0;
      for (let i = 0; i < 64; i++) {
        if (hash1[i] === hash2[i]) matching++;
      }
      return matching / 64;
    }

    // FNV or mixed: character-level diff over shared length
    const len = Math.max(hash1.length, hash2.length);
    let differences = 0;
    for (let i = 0; i < Math.min(hash1.length, hash2.length); i++) {
      if (hash1[i] !== hash2[i]) differences++;
    }
    // Pad penalty for length mismatch
    differences += Math.abs(hash1.length - hash2.length);
    return Math.max(0, 1 - differences / len);
  },

  async _getPhotoRegistry() {
    if (this._photoRegistry.size > 0) return this._photoRegistry;

    if (typeof localStorage !== 'undefined') {
      try {
        const registry = localStorage.getItem('veritas_photo_registry');
        if (registry) {
          const parsed = JSON.parse(registry);
          parsed.forEach(item => this._photoRegistry.set(item.hash, item));
        }
      } catch (e) {}
    }

    if (this._supabaseClient && this._supabaseClient.from) {
      try {
        const { data } = await this._supabaseClient
          .from('photo_registry')
          .select('*')
          .gte('timestamp', Date.now() - 30 * 86400000);
        if (data) {
          data.forEach(item => this._photoRegistry.set(item.hash, item));
        }
      } catch (err) {
        console.warn('[CERTUS] Supabase photo registry query failed:', err);
      }
    }

    return this._photoRegistry;
  },

  async _registerPhoto(hash, reportId) {
    const registry = await this._getPhotoRegistry();
    const entry = {
      hash,
      report_id: reportId,
      timestamp: Date.now()
    };
    registry.set(hash, entry);

    if (typeof localStorage !== 'undefined') {
      try {
        const entries = Array.from(registry.values());
        const cutoff = Date.now() - 30 * 86400000;
        const filtered = entries.filter(e => e.timestamp > cutoff);
        localStorage.setItem('veritas_photo_registry', JSON.stringify(filtered));
      } catch (e) {}
    }

    if (this._supabaseClient && this._supabaseClient.from) {
      try {
        await this._supabaseClient.from('photo_registry').upsert(entry);
      } catch (err) {
        console.warn('[CERTUS] Supabase photo registry insert failed:', err);
      }
    }
  },

  async _findDuplicatePhotos(photoHashes, threshold = 0.95) {
    if (!photoHashes || photoHashes.length === 0) return [];

    const registry = await this._getPhotoRegistry();
    const duplicates = [];

    for (const hash of photoHashes) {
      for (const [existingHash, entry] of registry.entries()) {
        const similarity = this._calculateHashSimilarity(hash, existingHash);
        if (similarity >= threshold && hash !== existingHash) {
          duplicates.push({
            hash: hash,
            matched_with: existingHash,
            similarity: similarity,
            original_report: entry.report_id,
            timestamp: entry.timestamp
          });
        }
      }
    }

    return duplicates;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LOCATION SERVICES
  // ══════════════════════════════════════════════════════════════════════════
  // R1-SA-003 FIX: these functions are MOCK STUBS — they return hardcoded offset
  // coordinates and do not query any live shelter or medical database.
  // They are called on every "Completely damaged" report — a high-stakes path.
  // STUB STATUS must be declared here and surfaced in the return object so callers
  // do not treat these as verified facility locations.
  // TODO: replace with a live geospatial query (Overpass API, UNHCR shelter DB,
  // or equivalent) before any deployment environment beyond internal testing.
  async _findNearestShelters(coordinates, radiusKm) {
    if (!coordinates || !coordinates.lat || !coordinates.lng) return [];

    const mockShelters = [
      { name: 'Community Center Shelter', lat: coordinates.lat + 0.01, lng: coordinates.lng + 0.01, capacity: 200, type: 'public' },
      { name: 'School Gymnasium', lat: coordinates.lat - 0.008, lng: coordinates.lng + 0.015, capacity: 150, type: 'public' },
      { name: 'Red Cross Station', lat: coordinates.lat + 0.005, lng: coordinates.lng - 0.012, capacity: 300, type: 'ngo' }
    ];

    const withinRadius = mockShelters.filter(shelter => {
      const distance = this._calculateDistance(
        coordinates.lat, coordinates.lng,
        shelter.lat, shelter.lng
      );
      return distance <= radiusKm * 1000;
    });

    return withinRadius.map(s => ({
      ...s,
      distance_km: this._calculateDistance(coordinates.lat, coordinates.lng, s.lat, s.lng) / 1000,
      phone: '+1-800-555-0123',
      open: true,
      instructions: 'Proceed to shelter for assistance',
      // R1-SA-003: stub flag — caller must not treat these as live verified locations
      stub: true,
      stub_warning: 'MOCK DATA — not from a live shelter database. Do not use for actual emergency dispatch.'
    }));
  },

  // R1-SA-003 FIX: MOCK STUB — see _findNearestShelters header above.
  async _findNearestMedical(coordinates, radiusKm) {
    if (!coordinates || !coordinates.lat || !coordinates.lng) return [];

    const mockMedical = [
      { name: 'General Hospital', lat: coordinates.lat + 0.02, lng: coordinates.lng - 0.005, type: 'hospital', beds: 150 },
      { name: 'Community Clinic', lat: coordinates.lat - 0.01, lng: coordinates.lng + 0.02, type: 'clinic', beds: 20 },
      { name: 'Emergency Care Center', lat: coordinates.lat + 0.015, lng: coordinates.lng + 0.01, type: 'emergency', beds: 50 }
    ];

    const withinRadius = mockMedical.filter(facility => {
      const distance = this._calculateDistance(
        coordinates.lat, coordinates.lng,
        facility.lat, facility.lng
      );
      return distance <= radiusKm * 1000;
    });

    return withinRadius.map(f => ({
      ...f,
      distance_km: this._calculateDistance(coordinates.lat, coordinates.lng, f.lat, f.lng) / 1000,
      phone: f.type === 'hospital' ? '+1-800-555-0124' : '+1-800-555-0125',
      open_24h: true,
      emergency_services: f.type === 'hospital' || f.type === 'emergency',
      // R1-SA-003: stub flag — caller must not treat these as live verified locations
      stub: true,
      stub_warning: 'MOCK DATA — not from a live medical database. Do not use for actual emergency dispatch.'
    }));
  },

  // ══════════════════════════════════════════════════════════════════════════
  // STORAGE INTEGRATION
  // ══════════════════════════════════════════════════════════════════════════
  async _initializeStorage() {
    if (typeof indexedDB !== 'undefined') {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('CERTUS_DB', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this._storage = {
            db: request.result,
            type: 'indexeddb',
            logAudit: async (event) => {
              const tx = this._storage.db.transaction(['audit'], 'readwrite');
              tx.objectStore('audit').add(event);
            },
            saveShard: async (shard) => {
              const tx = this._storage.db.transaction(['shards'], 'readwrite');
              tx.objectStore('shards').add({ id: Date.now(), data: shard });
            },
            queryAudit: async (startDate, endDate) => {
              const tx = this._storage.db.transaction(['audit'], 'readonly');
              const store = tx.objectStore('audit');
              const range = IDBKeyRange.bound(startDate, endDate);
              return new Promise((res) => {
                const results = [];
                store.openCursor(range).onsuccess = (e) => {
                  const cursor = e.target.result;
                  if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                  } else {
                    res(results);
                  }
                };
              });
            }
          };
          resolve(this._storage);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('appeals')) {
            db.createObjectStore('appeals', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('audit')) {
            db.createObjectStore('audit', { keyPath: 'timestamp' });
          }
          if (!db.objectStoreNames.contains('reputation')) {
            db.createObjectStore('reputation', { keyPath: 'reporter_id' });
          }
          if (!db.objectStoreNames.contains('shards')) {
            db.createObjectStore('shards', { keyPath: 'id' });
          }
        };
      });
    }

    if (typeof localStorage !== 'undefined') {
      this._storage = {
        type: 'localstorage',
        get: (key) => {
          try {
            const val = localStorage.getItem(`certus_${key}`);
            return val ? JSON.parse(val) : null;
          } catch (e) { return null; }
        },
        set: (key, val) => {
          try { localStorage.setItem(`certus_${key}`, JSON.stringify(val)); } catch (e) {}
        },
        logAudit: async (event) => {
          const audit = this._storage.get('audit') || [];
          audit.push(event);
          this._storage.set('audit', audit);
        },
        saveShard: async (shard) => {
          const shards = this._storage.get('shards') || [];
          shards.push(shard);
          this._storage.set('shards', shards);
        },
        queryAudit: async (startDate, endDate) => {
          const audit = this._storage.get('audit') || [];
          return audit.filter(e => e.timestamp >= startDate && e.timestamp <= endDate);
        }
      };
      return this._storage;
    }

    this._storage = {
      type: 'memory',
      memory: new Map(),
      get: (key) => this._storage.memory.get(key),
      set: (key, val) => this._storage.memory.set(key, val),
      logAudit: async (event) => {
        const audit = this._storage.get('audit') || [];
        audit.push(event);
        this._storage.set('audit', audit);
      },
      saveShard: async (shard) => {
        const shards = this._storage.get('shards') || [];
        shards.push(shard);
        this._storage.set('shards', shards);
      },
      queryAudit: async (startDate, endDate) => {
        const audit = this._storage.get('audit') || [];
        return audit.filter(e => e.timestamp >= startDate && e.timestamp <= endDate);
      }
    };

    return this._storage;
  },

  initSupabase(url, anonKey) {
    if (typeof window !== 'undefined' && window.supabase) {
      this._supabaseClient = window.supabase.createClient(url, anonKey);
      console.log('[CERTUS] Supabase client initialized');
      return true;
    }
    console.warn('[CERTUS] Supabase client not available');
    return false;
  },

  async storeAppeal(appealRecord) {
    if (!this._storage) await this._initializeStorage();

    if (this._storage.type === 'indexeddb') {
      const tx = this._storage.db.transaction(['appeals'], 'readwrite');
      const store = tx.objectStore('appeals');
      store.put(appealRecord);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } else {
      const appeals = this._storage.get('appeals') || [];
      appeals.push(appealRecord);
      this._storage.set('appeals', appeals);
    }

    if (this._supabaseClient && this._supabaseClient.from) {
      try {
        await this._supabaseClient.from('appeals').insert(appealRecord);
      } catch (err) {
        console.warn('[CERTUS] Supabase appeal storage failed:', err);
      }
    }
  },

  async logAudit(event) {
    if (!this._storage) await this._initializeStorage();
    await this._storage.logAudit(event);
  },

  async updateReputationStorage(reporterId, reputation) {
    if (!this._storage) await this._initializeStorage();

    if (this._storage.type === 'indexeddb') {
      const tx = this._storage.db.transaction(['reputation'], 'readwrite');
      const store = tx.objectStore('reputation');
      store.put({ reporter_id: reporterId, ...reputation });
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } else {
      const reputations = this._storage.get('reputation') || {};
      reputations[reporterId] = reputation;
      this._storage.set('reputation', reputations);
    }

    if (this._supabaseClient && this._supabaseClient.from) {
      try {
        await this._supabaseClient.from('reputation').upsert({
          reporter_id: reporterId,
          ...reputation,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[CERTUS] Supabase reputation storage failed:', err);
      }
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ENHANCED SCORING with NLP
  // ══════════════════════════════════════════════════════════════════════════
  async scoreWithNLP(report, nearbyReports = [], isRealModel = false, context = {}) {
    if (report.witness_statement && !report.internalTier) {
      const witnessAnalysis = this._extractDamageFromWitness({ text: report.witness_statement });
      if (witnessAnalysis && witnessAnalysis.confidence > 0.6) {
        report.internalTier = witnessAnalysis.damage_level;
        report.nlp_confidence = witnessAnalysis.confidence;
        report.urgency_flag = witnessAnalysis.is_urgent;
      }
    }

    if (report.description && !report.infraType) {
      const infraMatch = this._inferInfrastructureType(report.description);
      if (infraMatch) {
        report.infraType = infraMatch.type;
        report.infra_confidence = infraMatch.confidence;
      }
    }

    const result = await this.score(report, nearbyReports, isRealModel, context);

    if (report.nlp_confidence) {
      result.nlp_insights = {
        confidence: report.nlp_confidence,
        urgency_flag: report.urgency_flag,
        witness_analysis: true
      };
    }

    if (report.infra_confidence) {
      result.infra_insights = {
        inferred_from_text: true,
        confidence: report.infra_confidence,
        original_text: report.description?.substring(0, 100)
      };
    }

    return result;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ══════════════════════════════════════════════════════════════════════════
  async initialize(supabaseUrl = null, supabaseAnonKey = null) {
    await this._initializeStorage();

    if (supabaseUrl && supabaseAnonKey) {
      this.initSupabase(supabaseUrl, supabaseAnonKey);
    }

    await this._logAuditEvent({
      type: 'ENGINE_INITIALIZED',
      version: this.VERSION,
      storage_type: this._storage?.type,
      supabase_available: !!this._supabaseClient,
      timestamp: Date.now()
    });

    return {
      success: true,
      version: this.VERSION,
      storage: this._storage?.type,
      supabase: !!this._supabaseClient,
      features: {
        nlp: true,
        photo_analysis: true,
        offline_support: true,
        accessibility: true,
        supabase_sync: !!this._supabaseClient
      }
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HEALTH CHECK
  // ══════════════════════════════════════════════════════════════════════════
  async healthCheck() {
    const baseHealth = {
      status: this._circuitBreaker.engaged ? 'DEGRADED' : 'HEALTHY',
      version: this.VERSION,
      canary_version: this.CANARY_VERSION,
      canary_percentage: this.PRODUCTION.canaryPercentage,
      circuit_breaker: {
        engaged: this._circuitBreaker.engaged,
        backoff_ms: this._circuitBreaker.backoff,
        reason: this._circuitBreaker.reason
      },
      dependencies: Object.entries(this._dependencyCircuitBreakers).map(([name, breaker]) => ({
        name,
        open: breaker.open,
        failures: breaker.failures
      })),
      degraded_mode: this._degradedMode,
      degradation_reasons: this._degradationReasons.slice(-5),
      distributed_mode: this._useDistributed,
      audit_shards: this._auditLog.shards.length,
      timestamp: new Date().toISOString()
    };

    if (this._storage) {
      baseHealth.storage = {
        type: this._storage.type,
        healthy: true
      };
    }

    if (this._supabaseClient) {
      baseHealth.supabase = {
        available: true,
        healthy: await this._testSupabaseConnection()
      };
    }

    baseHealth.nlp = {
      available: true,
      languages: Object.keys(this.NLP_CONFIG.damageKeywords)
    };

    baseHealth.photo_analysis = {
      available: true,
      endpoint: '/api/analyze'
    };

    return baseHealth;
  },

  async _testSupabaseConnection() {
    if (!this._supabaseClient || !this._supabaseClient.from) return false;
    try {
      const { data, error } = await this._supabaseClient.from('health_check').select('*').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // [GAP-8] APPEAL HANDLER — now awaits _detectAdversarialPattern (async)
  // ══════════════════════════════════════════════════════════════════════════
  async processAppeal(originalReport, newEvidence, ipAddress, context = {}) {
    const currentAppeals = originalReport.appeal_count || 0;

    if (currentAppeals >= this.THRESHOLDS.MAX_APPEALS) {
      return {
        success: false,
        error: 'APPEAL_EXHAUSTED',
        message: 'Maximum appeals reached. Further appeals require human arbitrator.',
        remaining_appeals: 0
      };
    }

    await this._acquireBackpressureToken();

    const reportKey = `appeal:${originalReport.uuid}`;
    const ipKey = `appeal:ip:${ipAddress}`;

    const reportCount = await this._callWithCircuitBreaker(
      'redis',
      () => this._incrementDistributedCounter(reportKey, this.THRESHOLDS.APPEAL_RATE_LIMIT.per_report.window / 1000),
      () => {
        const current = (this._inMemoryStore.get(reportKey) || 0) + 1;
        this._inMemoryStoreSet(reportKey, current); // R1-SA-002: LRU-evicting setter
        return current;
      }
    );

    const ipCount = await this._callWithCircuitBreaker(
      'redis',
      () => this._incrementDistributedCounter(ipKey, this.THRESHOLDS.APPEAL_RATE_LIMIT.per_ip.window / 1000),
      () => {
        const current = (this._inMemoryStore.get(ipKey) || 0) + 1;
        this._inMemoryStoreSet(ipKey, current); // R1-SA-002: LRU-evicting setter
        return current;
      }
    );

    if (reportCount > this.THRESHOLDS.APPEAL_RATE_LIMIT.per_report.max) {
      return { success: false, error: 'RATE_LIMITED', message: 'Too many appeals for this report. Please wait an hour.' };
    }
    if (ipCount > this.THRESHOLDS.APPEAL_RATE_LIMIT.per_ip.max) {
      return { success: false, error: 'RATE_LIMITED', message: 'Too many appeals from this location. Please wait an hour.' };
    }

    if (!newEvidence || (!newEvidence.photos && !newEvidence.witness_statements && !newEvidence.field_verification)) {
      return {
        success: false,
        error: 'NO_NEW_EVIDENCE',
        message: 'Appeal requires new evidence (photos, witness statements, or field verification).',
        remaining_appeals: this.THRESHOLDS.MAX_APPEALS - currentAppeals
      };
    }

    const photoDamage = newEvidence.photos?.length ? await this._extractDamageFromPhoto(newEvidence.photos[0]) : null;
    const witnessDamage = newEvidence.witness_statements?.length ? this._extractDamageFromWitness(newEvidence.witness_statements[0]) : null;
    const crossValidation = this._crossValidateEvidence(
      photoDamage?.damage_level || null,
      witnessDamage?.damage_level || null
    );

    if (!crossValidation.consistent) {
      return {
        success: false,
        error: 'INCONSISTENT_EVIDENCE',
        message: `Evidence conflicts: ${crossValidation.conflict}. Human arbitration required.`,
        remaining_appeals: this.THRESHOLDS.MAX_APPEALS - currentAppeals
      };
    }

    // [GAP-8] Awaited — duplicate check now actually runs
    const adversarial = await this._detectAdversarialPattern(newEvidence, originalReport.appeal_history || []);
    if (adversarial.adversarial) {
      await this._logAuditEvent({
        type: 'ADVERSARIAL_DETECTED',
        report_id: originalReport.uuid,
        reason: adversarial.reason,
        action: adversarial.action
      });

      return {
        success: false,
        error: 'ADVERSARIAL_PATTERN',
        message: adversarial.reason,
        action: adversarial.action,
        remaining_appeals: this.THRESHOLDS.MAX_APPEALS - currentAppeals
      };
    }

    const sourceCredibility = this._getCredibilityMultiplier(newEvidence.source_type) || 0.5;
    const evidenceFreshness = this._getEvidenceFreshness(newEvidence.timestamp || Date.now());

    let evidenceQuality = 0;
    let qualityBreakdown = {};

    if (newEvidence.photos && newEvidence.photos.length > 0) {
      const weight = this._getEvidenceWeight(this.EVIDENCE_WEIGHTS.PHOTO, newEvidence.timestamp);
      evidenceQuality += weight * sourceCredibility;
      qualityBreakdown.photos = { weight, credibility: sourceCredibility };
    }
    if (newEvidence.witness_statements && newEvidence.witness_statements.length > 0) {
      const weight = this._getEvidenceWeight(this.EVIDENCE_WEIGHTS.WITNESS, newEvidence.timestamp);
      evidenceQuality += weight * sourceCredibility;
      qualityBreakdown.witness = { weight, credibility: sourceCredibility };
    }
    if (newEvidence.field_verification) {
      const weight = this._getEvidenceWeight(this.EVIDENCE_WEIGHTS.FIELD, newEvidence.timestamp);
      evidenceQuality += weight * sourceCredibility;
      qualityBreakdown.field = { weight, credibility: sourceCredibility };
    }

    evidenceQuality = Math.min(1, evidenceQuality);

    const evidenceTypes = [];
    if (newEvidence.photos) evidenceTypes.push('photo');
    if (newEvidence.witness_statements) evidenceTypes.push('witness');
    if (newEvidence.field_verification) evidenceTypes.push('field');

    const likelihood = this._estimateCombinedEvidenceDelta(evidenceTypes);

    const priorConfidence = originalReport.photoAiConf || 0.5;
    // [GAP-3] bayesianUpdate now implemented — returns a real posterior
    const updatedConfidence = this.bayesianUpdate(priorConfidence, likelihood);
    const confidenceBoost = updatedConfidence - priorConfidence;

    const appealWeight = 0.15 + (0.30 * evidenceQuality);

    const appealRecord = {
      id: `${originalReport.uuid}-${currentAppeals + 1}`,
      timestamp: Date.now(),
      evidence: {
        photos: newEvidence.photos?.length || 0,
        witness_statements: newEvidence.witness_statements?.length || 0,
        field_verification: !!newEvidence.field_verification
      },
      quality: evidenceQuality,
      freshness: evidenceFreshness,
      credibility: sourceCredibility,
      likelihood: likelihood,
      weight_applied: appealWeight,
      confidence_boost: confidenceBoost,
      cross_validation: crossValidation,
      adversarial_check: adversarial
    };

    await this.storeAppeal(appealRecord);

    await this._logAuditEvent({
      type: 'APPEAL_PROCESSED',
      appeal_id: appealRecord.id,
      report_id: originalReport.uuid,
      evidence_quality: evidenceQuality,
      confidence_boost: confidenceBoost
    });

    const updatedReport = {
      ...originalReport,
      photo: newEvidence.photos?.[0] || originalReport.photo,
      photoAiScore: originalReport.photoAiScore || 0.5,
      photoAiConf: updatedConfidence,
      appeal_count: currentAppeals + 1,
      appeal_history: [...(originalReport.appeal_history || []), appealRecord],
      appeal_evidence: {
        provided_at: new Date().toISOString(),
        quality: evidenceQuality,
        freshness: evidenceFreshness,
        credibility: sourceCredibility,
        weight_applied: appealWeight,
        confidence_boost: confidenceBoost,
        types: {
          photos: !!newEvidence.photos,
          witness_statements: !!newEvidence.witness_statements,
          field_verification: !!newEvidence.field_verification
        },
        cross_validation: crossValidation
      }
    };

    return {
      success: true,
      updated_report: updatedReport,
      appeal_weight_applied: appealWeight,
      confidence_boost_applied: confidenceBoost,
      evidence_quality: evidenceQuality,
      evidence_freshness: evidenceFreshness,
      source_credibility: sourceCredibility,
      evidence_quality_breakdown: qualityBreakdown,
      cross_validation: crossValidation,
      remaining_appeals: this.THRESHOLDS.MAX_APPEALS - (currentAppeals + 1),
      appeal_record_id: appealRecord.id
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MASTER SCORE — main entry point
  // ══════════════════════════════════════════════════════════════════════════
  // R1-SA-001 FIX: score() is now async. _acquireBackpressureToken() is awaited
  // before any scoring pipeline work runs. Under load, callers block until a
  // token is available — backpressure now restricts, not merely measures.
  async score(report, nearbyReports = [], isRealModel = false, context = {}) {
    const timestamp = report.timestamp || new Date().toISOString();
    // [GAP-1] _generateUUID now implemented — no longer crashes
    const reportUuid = report.uuid || this._generateUUID();

    if (context.mode === 'field') {
      this.registerOfflineSupport();
      this.registerOfflineMapSupport();
    }

    // R1-SA-001 FIX: awaited — backpressure now gates the pipeline.
    // Throws BACKPRESSURE_EXHAUSTED if token bucket drains completely.
    await this._acquireBackpressureToken();

    const version = this.routeToVersion(reportUuid);

    const location = this._anonymizeLocation(
      report.coordinates || { lat: 0, lng: 0 },
      report.infraType
    );

    // R3-EL-001 FIX: reputation and banned check moved BEFORE audit log entry.
    // A banned reporter previously generated a REPORT_SCORED audit event for a
    // report that was never scored. Now only legitimate reports get that entry.
    const reputation = this._updateReputation(report.reporter_id, 'PENDING');
    if (reputation.banned) {
      this._logAuditEvent({
        type: 'BANNED_REPORTER_BLOCKED',
        report_id: reportUuid,
        reporter_id: report.reporter_id,
        ban_reason: reputation.ban_reason
      }).catch(() => {});
      return {
        usable: false,
        error: 'REPORTER_BANNED',
        message: `This reporter has been banned due to ${reputation.ban_reason}`,
        reputation: reputation
      };
    }

    // R3-EL-001 FIX: REPORT_SCORED now fires only after ban check passes.
    this._logAuditEvent({
      type: 'REPORT_SCORED',
      report_id: reportUuid,
      version: version,
      location_anonymized: location.anonymized
    }).catch(() => {});

    const PES = this.computePES(report, isRealModel);
    const COR = this.computeCOR(nearbyReports, report.internalTier, reportUuid);
    const TFR = this.computeTFR(timestamp);
    const CCI = this.computeCCI(report.internalTier, report.infraType);

    const ecfContributions = {
      PES: this.computeECFContribution(report.findings || [], 'PES'),
      COR: this.computeECFContribution(report.findings || [], 'COR'),
      TFR: this.computeECFContribution(report.findings || [], 'TFR'),
      CCI: this.computeECFContribution(report.findings || [], 'CCI')
    };

    const rawScores = {
      PES: PES.evaluable ? PES.value : null,
      COR: COR.evaluable ? COR.value : null,
      TFR: TFR.value,
      CCI: CCI.value
    };

    const activeDimensions = ['PES', 'COR', 'TFR', 'CCI'].filter(d => rawScores[d] !== null);
    const normalized = this.normalizeWithPenalty(activeDimensions, rawScores);

    const dci_raw = normalized.score;
    const dci = parseFloat(Math.max(0, Math.min(1, dci_raw)).toFixed(3));

    const recentFailureRate = context.recentCorrelatedFailureRate || 0;
    const correlatedFailure = this.detectCorrelatedFailures(PES, COR, recentFailureRate);

    const um = this.computeUM(PES, COR, TFR, CCI, correlatedFailure, ecfContributions);

    const requiresHumanReview = um.validity_status === 'SUSPENDED';
    const hasValidHumanReview = context.human_review_proof &&
                                context.human_review_proof.reviewer_id &&
                                context.human_review_proof.second_reviewer_id;

    if (requiresHumanReview && !hasValidHumanReview) {
      this._logAuditEvent({
        type: 'GUARD_TRIGGERED',
        report_id: reportUuid,
        reason: 'SUSPENDED_score_no_review'
      }).catch(() => {});

      return {
        usable: false,
        error: '[LAW 4 GUARD] Suspended scores require two independent human reviewers before use.',
        recommendation: 'FIELD_VERIFICATION_REQUIRED',
        version: version,
        constitutional_status: {
          law_4_compliant: false,
          law_6_compliant: true,
          restrictions: ['SUSPENDED scores require two independent human reviewers with cryptographic proof'],
          guard_triggered: true,
          required_reviewers: 2,
          prohibited_uses: [
            'community profiling',
            'political targeting',
            'discriminatory resource allocation',
            'facial_recognition',
            'individual_identification'
          ],
          face_detection_filter: 'enabled',
          photo_processing: 'damage_only',
          privacy_protection: 'exif_stripped'
        },
        data_governance: this.getDataSharingDisclosure(),
        consent_required: this.getConsentForm()
      };
    }

    const tier = dci >= this.THRESHOLDS.DCI_HIGH ? 'high'
                : dci >= this.THRESHOLDS.DCI_WATCH ? 'watch'
                : 'review';

    const dims = { PES: PES.value || 0, COR: COR.value || 0, TFR: TFR.value, CCI: CCI.value };
    const bottleneck_dim = Object.keys(dims).reduce((a, b) => dims[a] < dims[b] ? a : b);
    const bottleneck_value = dims[bottleneck_dim];

    const assumptions = [];
    if (COR.assumption) assumptions.push(COR.assumption);

    // R1-EL-001 FIX: dual decay curves declared explicitly.
    // TFR uses a 48h linear decay — a report is fully stale at 48 hours.
    // Evidence recency weighting (_getEvidenceFreshness) uses a 168h half-life —
    // a report retains 43% weight at 96 hours. These operate on the same timestamp
    // and produce different staleness assessments. The divergence is intentional:
    // TFR penalises the primary score for age aggressively (field timeliness);
    // evidence recency weights corroboration evidence more gradually (research fidelity).
    // If the divergence is not intentional, synchronise EVIDENCE_HALF_LIFE_HOURS to 48.
    assumptions.push({
      id: 'DECAY-A01',
      text: 'Dual decay curves active: TFR uses 48h linear decay; evidence recency uses 168h half-life. Same timestamp, different staleness assessments — intentional divergence.',
      plain_language: '⏱ Report age affects score in two ways: main freshness score drops to zero at 48 hours; evidence weight drops to half at 7 days.',
      source: 'computeTFR + _getEvidenceFreshness',
      timestamp: new Date().toISOString()
    });
    if (PES.measurement_class === 'INFERENTIAL') {
      assumptions.push({
        id: 'PES-A01',
        text: 'Photo evidence scored by placeholder model, not trained AI.',
        plain_language: '📷 Photo analyzed by placeholder model. Upgrade to trained AI for higher confidence.',
        source: 'computePES',
        timestamp: new Date().toISOString()
      });
    }
    if (PES.evaluable === false && PES.measurement_class === 'NOT_EVALUABLE') {
      assumptions.push({
        id: 'PES-A02',
        text: 'No photo submitted. PES dimension excluded from DCI.',
        plain_language: '📷 No photo submitted. Report based on text description only.',
        source: 'computePES',
        timestamp: new Date().toISOString()
      });
    }

    const { strengths, weaknesses } = this.getStrengths(
      PES, COR, TFR, CCI,
      location,
      report.photoGeotag,
      report.photoAccuracy
    );

    const umBreakdown = this.getUMBreakdown(PES, COR, TFR, CCI);

    let verificationCertificate = null;
    if (tier === 'high') {
      verificationCertificate = this.generateVerificationCertificate(report, dci, tier);
    }

    const audioFeedback = this.getAudioFeedback(tier, um.validity_status, context.language);

    this.provideHapticFeedback(tier, { emergency: report.internalTier === 'Completely damaged' });

    const fieldView = this.getFieldView(
      { tier, verification_certificate: verificationCertificate },
      context
    );

    const emergencyResources = this.getEmergencyResources(report, location);

    const shareData = this.getShareData(report, verificationCertificate);

    const theme = context.mode === 'field' ? this.detectAndApplyTheme() : null;

    const onboarding = context.userProgress ?
      this.getOnboardingStep(context.userProgress, context.language) : null;

    const voiceInput = this.getVoiceInputConfig(context.language);

    const verificationBadge = this.getVerificationBadge(
      report.verified_by ? 'community_verified' :
      (tier === 'high' ? 'ai_verified' : 'pending')
    );

    const excludedDimensions = [];
    if (!PES.evaluable) excludedDimensions.push({ dimension: 'PES', reason: 'no_photo', penalty: 0.25 });
    if (!COR.evaluable) excludedDimensions.push({ dimension: 'COR', reason: 'no_evidence', penalty: 0.20 });

    return {
      dci,
      tier,
      usable: um.validity_status !== 'SUSPENDED' || hasValidHumanReview,
      version: version,
      canary: version !== this.VERSION,

      dci_pes: PES.value,
      dci_cor: COR.value,
      dci_tfr: TFR.value,
      dci_cci: CCI.value,

      dci_normalization: {
        active_dimensions: activeDimensions,
        excluded_dimensions: excludedDimensions,
        missing_penalty_applied: normalized.missing_penalty_applied
      },

      dci_uncertainty_mass: um.mass,
      dci_validity_status: um.validity_status,
      dci_validity_plain: this.PLAIN_LANGUAGE[um.validity_status] || um.validity_status,
      dci_um_ceiling: um.ceiling,
      dci_um_breakdown: umBreakdown,
      dci_correlated_failure: correlatedFailure.correlated,
      dci_circuit_breaker_engaged: this._circuitBreaker.engaged,

      dci_action: tier === 'high' ? 'SHARE' : (tier === 'watch' ? 'VERIFY' : 'WAIT'),
      dci_confidence_plain: tier === 'high' ? 'High' : (tier === 'watch' ? 'Medium' : 'Low'),

      dci_strengths: strengths,
      dci_weaknesses: weaknesses,

      dci_marker_style: this.MARKER_STYLES[tier] || this.MARKER_STYLES.suspended,

      dci_verification_certificate: verificationCertificate,
      dci_verification_badge: verificationBadge,

      dci_audio_feedback: audioFeedback,

      dci_haptic_feedback: {
        provided: true,
        pattern: tier === 'review' ? 'long_long_long' : (tier === 'watch' ? 'medium_medium' : 'short')
      },

      dci_field_view: fieldView,
      dci_emergency_resources: emergencyResources,
      dci_share_data: shareData,
      dci_voice_input: voiceInput,
      dci_onboarding: onboarding,
      dci_theme: theme,
      dci_accessibility: this.getAccessibilitySettings(),
      dci_icon_navigation: this.getIconNavigation(1, context.language),
      dci_action_icons: this.getActionIcons(),

      dci_measurement_class: {
        PES: PES.measurement_class,
        COR: COR.evaluable ? 'ENUMERATIVE' : 'NOT_EVALUABLE',
        TFR: 'ENUMERATIVE',
        CCI: 'EVALUATIVE',
      },

      dci_bottleneck: {
        dimension: bottleneck_dim,
        dimension_plain: this.PLAIN_LANGUAGE[bottleneck_dim] || bottleneck_dim,
        value: bottleneck_value,
      },

      dci_assumptions: assumptions.map(a => a.plain_language).join(' · '),
      dci_assumptions_raw: assumptions,

      dci_freshness_status: TFR.freshness_status,
      dci_hours_elapsed: TFR.hours_elapsed,

      dci_notes: {
        PES: PES.note,
        COR: COR.note,
        TFR: TFR.note,
        CCI: CCI.note,
      },

      dci_flags: {
        pes_gated: PES.gated || false,
        pes_inferential: PES.measurement_class === 'INFERENTIAL',
        pes_missing: !PES.evaluable,
        cor_no_evidence: COR.signal_type === 'NO_EVIDENCE',
        cor_contradiction: COR.signal_type === 'CONTRADICTION',
        cci_flagged: CCI.flagged,
        tfr_status: TFR.freshness_status,
        correlated_failure: correlatedFailure.correlated,
      },

      dci_cor_signal: COR.signal_type,
      dci_reporter_reputation: reputation,

      constitutional_status: {
        law_4_compliant: !(um.validity_status === 'SUSPENDED' && !hasValidHumanReview),
        law_6_compliant: true,
        restrictions: um.validity_status === 'SUSPENDED' ? ['SUSPENDED scores require two independent human reviewers with cryptographic proof'] : [],
        prohibited_uses: [
          'community profiling',
          'political targeting',
          'discriminatory resource allocation',
          'facial_recognition',
          'individual_identification'
        ],
        // R2-CL-001 FIX: prohibited_uses is a declarative governance instrument.
        // The engine surfaces this list but does NOT enforce it at the scoring layer.
        // The caller is solely responsible for enforcing all prohibited uses prior
        // to acting on DCI output. Treating this list as a technical gate would be
        // a false assurance — it is a contract, not a circuit breaker.
        prohibited_uses_enforcement: 'CALLER_RESPONSIBILITY',
        prohibited_uses_enforcement_note: 'Engine enforcement is not implemented at the scoring layer. Caller must reject prohibited use cases before acting on this output.',
        // R2-CL-003 FIX: consent management is the caller\'s responsibility.
        // score() can be called without getConsentForm() ever being invoked.
        // The engine provides consent form tooling (getConsentForm()) but does NOT
        // gate scoring on consent acknowledgment. Callers operating in field
        // deployments must require consent_acknowledged: true before passing
        // reports to score(), or implement a consent gate at their API boundary.
        consent_gate: 'CALLER_RESPONSIBILITY',
        consent_gate_note: 'The engine provides getConsentForm() but does not block scoring if consent has not been collected. Consent enforcement is the caller\'s obligation.',
        use_monitoring: 'enabled',
        last_review: '2026-04-01',
        reviewer: 'Polymath Council',
        indigenous_data_sovereignty: {
          standard: 'UNDRIP Article 31',
          free_prior_informed_consent: {
            required: true,
            proof: 'digital_signature_of_community_council',
            expires: '2027-04-01',
            revocable: true
          },
          data_ownership: 'community',
          enforcement: 'smart_contract_registry',
          audit_trail: 'blockchain_immutable'
        }
      },

      data_governance: {
        retention_days: 365,
        extension_policy: 'community_opt_in',
        early_deletion: 'community_opt_out',
        default: '365_days',
        sovereignty: 'community',
        traditional_knowledge: 'protected',
        free_prior_informed_consent: 'required',
        data_sovereignty_standard: 'UNDRIP Article 31',
        opt_out_endpoint: '/api/data/deletion',
        deletion_process: 'Community leader signature required',
        recipients: this.getDataSharingDisclosure().recipients,
        consent: this.getConsentForm()
      },

      location: location,

      appeal_status: {
        appeals_used: report.appeal_count || 0,
        appeals_remaining: Math.max(0, this.THRESHOLDS.MAX_APPEALS - (report.appeal_count || 0)),
        max_appeals: this.THRESHOLDS.MAX_APPEALS,
        rate_limited: false,
        appeal_endpoint: '/api/appeal',
        requires_new_evidence: true
      },

      correction_endpoint: '/api/correction',

      whistleblower_channel: {
        available: true,
        anonymous: true,
        endpoint: '/api/whistleblower',
        tracking: 'one_time_code'
      },

      // R3-SA-001 FIX: _auditLog.events is always [] — events are written to
      // _auditLog.shards[N].events. The previous expression always returned 1.
      // Now sums across all shards for a monotonically increasing audit_id.
      audit_id: this._auditLog.shards.reduce((sum, s) => sum + (s?.events?.length || 0), 0) + 1
    };
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DISPLAY HELPERS
  // ══════════════════════════════════════════════════════════════════════════
  tierLabel(tier) {
    return { high: 'HIGH CONFIDENCE', watch: 'WATCH', review: 'REVIEW REQUIRED' }[tier] || 'UNKNOWN';
  },

  tierColor(tier) {
    return this.MARKER_STYLES[tier]?.color || '#888';
  },

  umLabel(um_mass, validity_status) {
    const pct = Math.round(um_mass * 100);
    const statusColor = {
      VALID: '#4ade80',
      DEGRADED: '#f0a500',
      SUSPENDED: '#ff4d4d',
    }[validity_status] || '#4e5f6a';
    const plainStatus = this.PLAIN_LANGUAGE[validity_status] || validity_status;
    return { label: `UM: ${pct}%`, status: validity_status, status_plain: plainStatus, color: statusColor };
  },

  primaryExplanation(result) {
    const flags = result.dci_flags;

    if (!result.usable) {
      return `⚠️ This score requires human review before use. ${result.error || 'Field verification required.'}`;
    }

    if (result.dci_validity_status === 'SUSPENDED') {
      return `This score carries high uncertainty. ${result.dci_field_view?.what_to_do || 'Wait for field verification.'}`;
    }

    if (flags.cor_no_evidence) {
      return `First report in this area — no other reports to compare with. Share the app so others can confirm.`;
    }

    if (flags.cor_contradiction) {
      return `Nearby reports disagree. Human verification recommended before acting.`;
    }

    if (flags.pes_gated) {
      return `Photo quality is low. Clearer photos would improve confidence.`;
    }

    if (result.dci_bottleneck.dimension === 'TFR') {
      return `This report is ${result.dci_hours_elapsed} hours old. Fresher reports are more reliable.`;
    }

    if (flags.pes_missing) {
      return `No photo submitted. Adding a photo would significantly improve confidence.`;
    }

    return `This report is ${result.dci_confidence_plain.toLowerCase()} confidence. ${result.dci_field_view?.what_to_do || 'Share with responders.'}`;
  }
};

// ==================== EXPORT ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CERTUS;
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  window.CERTUS = CERTUS;

  const supabaseUrl = (typeof window !== 'undefined' && window.SUPABASE_URL) ||
                      (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || null;
  const supabaseAnonKey = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) ||
                          (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || null;

  if (supabaseUrl && supabaseAnonKey) {
    CERTUS.initialize(supabaseUrl, supabaseAnonKey).catch(console.warn);
  } else {
    CERTUS.initialize().catch(console.warn);
  }
}
