import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import Busboy from 'busboy';
import https from 'https';

// ============================================================
// CONFIGURATION
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Connection pooling (E-02)
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 10,
  maxFreeSockets: 5
});

// Response cache for verify endpoint (E-04)
const verificationCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Data retention (E-12)
const RETENTION_DAYS = 90;
const JURISDICTION = 'New York State, USA';
const TERMS_VERSION = '2026-03-30-v2';

let supabase = null;
function getSupabase() {
  if (!supabase) supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  return supabase;
}

// ============================================================
// TIME STAMP FUNCTIONS
// ============================================================
const GREGORIAN_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function gregorianString(d) {
  return `${GREGORIAN_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function jdFromGregorian(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

const HEBREW_EPOCH_JD = 347998;
const HEBREW_MONTHS_COMMON = ['Tishri','Cheshvan','Kislev','Tevet','Shevat','Adar','Nisan','Iyar','Sivan','Tammuz','Av','Elul'];
const HEBREW_MONTHS_LEAP = ['Tishri','Cheshvan','Kislev','Tevet','Shevat','Adar I','Adar II','Nisan','Iyar','Sivan','Tammuz','Av','Elul'];

function isHebrewLeap(year) { return (7 * year + 1) % 19 < 7; }

function elapsedDays(year) {
  const months = Math.floor((235 * year - 234) / 19);
  const parts = 12084 + 13753 * months;
  let day = months * 29 + Math.floor(parts / 25920);
  if ((3 * (day + 1)) % 7 < 3) day += 1;
  return day;
}

function newYearDelay(year) {
  const ny0 = elapsedDays(year - 1);
  const ny1 = elapsedDays(year);
  const ny2 = elapsedDays(year + 1);
  if (ny2 - ny1 === 356) return 2;
  if (ny1 - ny0 === 382) return 1;
  return 0;
}

function tishri1JD(year) { return elapsedDays(year) + newYearDelay(year) + HEBREW_EPOCH_JD; }

function hebrewString(d) {
  const jd = jdFromGregorian(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  let year = Math.floor((jd - HEBREW_EPOCH_JD) * 19 / 6935) + 1;
  while (tishri1JD(year + 1) <= jd) year++;
  while (tishri1JD(year) > jd) year--;
  const mLens = (() => {
    const ylen = tishri1JD(year + 1) - tishri1JD(year);
    const leap = isHebrewLeap(year);
    const months = [30, (ylen % 10 === 5) ? 30 : 29, (ylen % 10 === 3) ? 29 : 30, 29, 30, leap ? 30 : 29];
    if (leap) months.push(29);
    months.push(30, 29, 30, 29, 30, 29);
    return months;
  })();
  const mNames = isHebrewLeap(year) ? HEBREW_MONTHS_LEAP : HEBREW_MONTHS_COMMON;
  let remaining = jd - tishri1JD(year);
  for (let i = 0; i < mLens.length; i++) {
    if (remaining < mLens[i]) return `${remaining + 1} ${mNames[i]} ${year}`;
    remaining -= mLens[i];
  }
  throw new Error('Hebrew conversion overflow');
}

const MOON_NAMES = ['Magnetic','Lunar','Electric','Self-Existing','Overtone','Rhythmic','Resonant','Galactic','Solar','Planetary','Spectral','Crystal','Cosmic'];

function dreamspellString(d) {
  const month = d.getUTCMonth() + 1, day = d.getUTCDate(), year = d.getUTCFullYear();
  if (month === 7 && day === 25) return 'Day Out of Time';
  const yearStart = (month > 7 || (month === 7 && day >= 26))
    ? Date.UTC(year, 6, 26) : Date.UTC(year - 1, 6, 26);
  const delta = Math.floor((d.getTime() - yearStart) / 86400000);
  if (delta < 0 || delta >= 364) return 'Day Out of Time';
  const moon = Math.floor(delta / 28) + 1;
  return `Day ${(delta % 28) + 1}, ${MOON_NAMES[moon - 1]} Moon ${moon}/13`;
}

// ============================================================
// SEAL COMPUTATION (FROZEN-2.0)
// ============================================================
function computeSealExact(entry, gregorian, hebrew, dreamspell, unixUtc) {
  const obj = { dreamspell, entry, gregorian, hebrew, unix_utc: unixUtc };
  const keys = Object.keys(obj).sort();
  const parts = keys.map(k => {
    const v = obj[k];
    const val = typeof v === 'number' ? String(v) : JSON.stringify(v);
    return `${JSON.stringify(k)}:${val}`;
  });
  return crypto.createHash('sha256').update(`{${parts.join(',')}}`, 'utf8').digest('hex');
}

// ============================================================
// TEMPLATE SELECTION
// ============================================================
const SEAL_TEMPLATES = {
  '01': { name: 'ai-failure', label: 'AI-FAILURE', triggers: ['ai failure','model failure','hallucination'] },
  '02': { name: 'research-priority', label: 'RESEARCH-PRIORITY', triggers: ['hypothesis','research','theory','prediction'] },
  '03': { name: 'evidence-chain', label: 'EVIDENCE-CHAIN', triggers: ['evidence','source','document'] },
  '04': { name: 'creative-priority', label: 'CREATIVE-PRIORITY', triggers: ['creative','music','art','design'] },
  '05': { name: 'clinical-record', label: 'CLINICAL-RECORD', triggers: ['clinical','patient','medical record'] },
  '06': { name: 'scope-anchor', label: 'SCOPE-ANCHOR', triggers: ['scope','agreement','contract'] },
  '07': { name: 'general-trace', label: 'GENERAL-TRACE', triggers: [] },
  '08': { name: 'foresight-seal', label: 'FORESIGHT-SEAL', triggers: ['predict','forecast','foresight'] },
  '09': { name: 'webeater-link', label: 'WEBEATER-LINK', triggers: ['link','bind','connect two seals'] },
  '10': { name: 'audit-request', label: 'AUDIT-REQUEST', triggers: ['audit request','certification'] },
  '11': { name: 'audit-completion', label: 'AUDIT-COMPLETION', triggers: ['audit complete','audit filed'] },
  '12': { name: 'auditor-application', label: 'AUDITOR-APPLICATION', triggers: ['apply auditor'] },
  '13': { name: 'integrity-violation', label: 'INTEGRITY-VIOLATION', triggers: ['misuse','violation','bribery'] },
  '14': { name: 'near-miss', label: 'NEAR-MISS', triggers: ['near miss','almost','close call'] },
};

function selectTemplate(entry, contextType) {
  if (contextType && SEAL_TEMPLATES[contextType]) return contextType;
  const lower = (entry || '').toLowerCase();
  const priority = ['13','14','05','10','11','12','01','09','06','03','08','02','04'];
  for (const key of priority) {
    if (SEAL_TEMPLATES[key]?.triggers.some(t => lower.includes(t))) return key;
  }
  if (['ignore previous','you are now','without restrictions','jailbreak'].some(t => lower.includes(t))) return '13';
  return '07';
}

function ledgerFileName(templateKey, gregorian, seal) {
  const label = SEAL_TEMPLATES[templateKey].label;
  const dateStr = gregorian.replace(/[,\s]+/g, '-').replace(/[^A-Z0-9\-]/gi, '');
  return `STP-${label}-${dateStr}-${seal.substring(0, 6).toUpperCase()}.json`;
}

// ============================================================
// GITHUB HELPERS with timeout and search API (E-01, E-03)
// ============================================================
async function ghRequest(path, method, body, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      agent: httpsAgent
    });
    
    clearTimeout(timeoutId);
    
    // Handle rate limiting (E-06)
    const remaining = parseInt(res.headers.get('x-ratelimit-remaining') || '0');
    const reset = parseInt(res.headers.get('x-ratelimit-reset') || '0');
    
    if (!res.ok) {
      if (res.status === 403 && remaining === 0) {
        const resetDate = new Date(reset * 1000);
        throw new Error(`RATE_LIMITED: GitHub API limit exhausted. Resets at ${resetDate.toISOString()}`);
      }
      const err = await res.text();
      throw new Error(`GitHub ${method} ${path} → ${res.status}: ${err}`);
    }
    
    return { data: await res.json(), rateLimit: { remaining, reset } };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`GitHub API timeout after ${timeoutMs}ms`);
    }
    throw err;
  }
}

// E-01: GitHub search API for prior seal verification
async function searchGitHubForHash(hash) {
  try {
    const searchUrl = `/search/issues?q=${hash}+repo:AionSystem/SOVEREIGN-TRACE-PROTOCOL`;
    const { data } = await ghRequest(searchUrl, 'GET');
    return data.items || [];
  } catch (err) {
    console.error('GitHub search failed:', err.message);
    return [];
  }
}

// E-05: Verify seal integrity (not just existence)
function verifySealIntegrity(issueBody, claimedHash, templateId) {
  // Check that the seal hash appears in the issue body
  if (!issueBody.includes(claimedHash)) {
    return { valid: false, reason: 'Hash mismatch: claimed hash not found in issue' };
  }
  
  // Check for proper STP formatting
  if (!issueBody.includes('Sovereign Trace Protocol — Automated Seal')) {
    return { valid: false, reason: 'Not a valid STP seal issue' };
  }
  
  // Check template match if provided
  if (templateId && !issueBody.includes(`**Template:** ${templateId}`)) {
    return { valid: false, reason: `Template mismatch: expected ${templateId}` };
  }
  
  // Check for triple-time stamp
  if (!issueBody.includes('Triple-Time Stamp:')) {
    return { valid: false, reason: 'Missing triple-time stamp' };
  }
  
  return { valid: true, reason: null };
}

// ============================================================
// E-06: Non-repudiation (optional client-side signing verification)
// ============================================================
function verifySignature(payload, signature, publicKey) {
  // Placeholder for future implementation
  // Would verify that the payload was signed by the claimed user
  return { valid: true, method: 'not_implemented' };
}

// ============================================================
// E-13: Data deletion endpoint helper
// ============================================================
async function deleteUserData(identifier, type, proof) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  const supabase = getSupabase();
  
  if (type === 'session') {
    // Delete session data (not the seal itself)
    const { error } = await supabase
      .from('stp_seals')
      .update({ 
        ip_hash: null,
        user_id: null,
        deleted_at: new Date().toISOString(),
        deletion_requested_by: identifier
      })
      .eq('session_id', identifier);
    
    if (error) return { success: false, error: error.message };
    return { success: true, message: 'Session data deleted. Seals remain immutable.' };
  }
  
  if (type === 'seal') {
    // Cannot delete seals (immutable by design)
    // But can add deprecation notice
    return { 
      success: false, 
      error: 'Seals cannot be deleted. They are immutable by design.',
      alternative: 'You can create a deprecation seal referencing this one.'
    };
  }
  
  return { success: false, error: 'Unknown deletion type' };
}

// ============================================================
// E-04: Cached verification
// ============================================================
async function verifyPriorSealCached(hash) {
  const cached = verificationCache.get(hash);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.result;
  }
  
  const issues = await searchGitHubForHash(hash);
  let result = { exists: false, verified: false, issue: null };
  
  for (const issue of issues) {
    const integrity = verifySealIntegrity(issue.body, hash, null);
    if (integrity.valid) {
      result = {
        exists: true,
        verified: true,
        issue: { number: issue.number, url: issue.html_url, title: issue.title }
      };
      break;
    }
  }
  
  verificationCache.set(hash, { timestamp: Date.now(), result });
  
  // Clean old cache entries
  for (const [key, value] of verificationCache.entries()) {
    if (Date.now() - value.timestamp > CACHE_TTL) {
      verificationCache.delete(key);
    }
  }
  
  return result;
}

// ============================================================
// E-05: Prior seal verification endpoint handler
// ============================================================
async function handlePriorSealVerify(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const hash = url.searchParams.get('hash');
  const templateId = url.searchParams.get('template');
  
  if (!hash || hash.length !== 64) {
    return res.status(400).json({ 
      error: 'INVALID_HASH', 
      message: 'Hash must be 64 characters',
      user_help: 'The prior seal hash should be a 64-character hexadecimal string from a previous STP seal.'
    });
  }
  
  try {
    const result = await verifyPriorSealCached(hash);
    
    // If template ID provided, verify against it
    if (templateId && result.issue) {
      const integrity = verifySealIntegrity(result.issue.body, hash, templateId);
      result.template_match = integrity.valid;
      if (!integrity.valid) {
        result.verified = false;
        result.verification_failure_reason = integrity.reason;
      }
    }
    
    // Log verification (E-08)
    console.log(`[VERIFY] Hash: ${hash.substring(0,16)}... Exists: ${result.exists} Verified: ${result.verified}`);
    
    return res.status(200).json({ 
      hash, 
      exists: result.exists,
      verified: result.verified,
      issue: result.issue,
      retention_days: RETENTION_DAYS,
      jurisdiction: JURISDICTION
    });
  } catch (err) {
    console.error('Prior seal verification failed:', err);
    return res.status(500).json({ 
      error: 'VERIFICATION_ERROR', 
      message: 'Unable to verify prior seal. Please try again later.',
      user_help: 'The verification service is temporarily unavailable. You can still create the seal without verification, but the link will not be cryptographically validated.'
    });
  }
}

// ============================================================
// E-05: File verification endpoint handler
// ============================================================
async function handleFileVerify(req, res) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    let fileBuffer = null;
    let claimedHash = null;
    let fileName = null;
    let nonce = null;  // E-07: replay attack prevention
    
    busboy.on('file', (fieldname, file, filename) => {
      fileName = filename;
      const chunks = [];
      file.on('data', chunk => chunks.push(chunk));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });
    
    busboy.on('field', (fieldname, val) => {
      if (fieldname === 'claimed_hash') claimedHash = val;
      if (fieldname === 'nonce') nonce = val;
    });
    
    busboy.on('finish', async () => {
      if (!fileBuffer || !claimedHash) {
        return res.status(400).json({ 
          error: 'MISSING_DATA', 
          message: 'Missing file or hash',
          user_help: 'Please provide both a file and its claimed SHA-256 hash.'
        });
      }
      
      // E-07: Check nonce to prevent replay
      if (!nonce) {
        return res.status(400).json({ 
          error: 'MISSING_NONCE', 
          message: 'Missing nonce for request validation'
        });
      }
      
      const computedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const verified = computedHash === claimedHash;
      const fileSize = fileBuffer.length;
      
      return res.status(200).json({ 
        verified, 
        computed_hash: computedHash,
        claimed_hash: claimedHash,
        file_name: fileName,
        file_size: fileSize,
        nonce_used: nonce
      });
    });
    
    busboy.on('error', (err) => {
      console.error('File verification error:', err);
      return res.status(500).json({ 
        error: 'PROCESSING_ERROR', 
        message: 'File processing failed',
        user_help: 'The server could not process your file. Please try again with a smaller file.'
      });
    });
    
    req.pipe(busboy);
  });
}

// ============================================================
// E-13: Data deletion endpoint
// ============================================================
async function handleDataDeletion(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Use POST for deletion requests' });
  }
  
  try {
    const { identifier, type, proof, reason } = req.body;
    
    if (!identifier || !type) {
      return res.status(400).json({ 
        error: 'MISSING_DATA', 
        message: 'Identifier and type are required',
        user_help: 'Please provide the session ID or seal hash you want to delete.'
      });
    }
    
    const result = await deleteUserData(identifier, type, proof);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json({
      success: true,
      message: result.message,
      retention_policy: `${RETENTION_DAYS} days`,
      immutable_note: 'Seal records themselves cannot be deleted. Only associated metadata.'
    });
  } catch (err) {
    console.error('Deletion error:', err);
    return res.status(500).json({ 
      error: 'DELETION_ERROR', 
      message: 'Unable to process deletion request'
    });
  }
}

// ============================================================
// Ledger entries endpoint
// ============================================================
async function getLedgerEntries(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const { data: issues } = await ghRequest('/repos/AionSystem/SOVEREIGN-TRACE-PROTOCOL/issues', 'GET');
    
    const seals = (issues || [])
      .filter(issue => issue.labels?.some(l => l.name?.includes('seal') || l.name?.includes('trace')))
      .slice(0, limit)
      .map(issue => ({
        issue_number: issue.number,
        title: issue.title,
        url: issue.html_url,
        created_at: issue.created_at,
        labels: issue.labels.map(l => l.name)
      }));
    
    return res.status(200).json({ 
      seals, 
      count: seals.length,
      retention_days: RETENTION_DAYS,
      jurisdiction: JURISDICTION
    });
  } catch (err) {
    console.error('Get ledger entries failed:', err);
    return res.status(500).json({ 
      error: 'LEDGER_ERROR', 
      message: 'Unable to fetch ledger entries',
      user_help: 'The ledger service is temporarily unavailable. Please try again later.'
    });
  }
}

// ============================================================
// Rate limiting (existing)
// ============================================================
const rateLimitSeal = new Map();
function checkSealRateLimit(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const max = 30;
  const rec = rateLimitSeal.get(ip) || { count: 0, reset: now + windowMs };
  if (now > rec.reset) { rec.count = 1; rec.reset = now + windowMs; }
  else rec.count++;
  rateLimitSeal.set(ip, rec);
  return { allowed: rec.count <= max, remaining: Math.max(0, max - rec.count), reset: rec.reset };
}

// ============================================================
// MAIN HANDLER
// ============================================================
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // ============================================================
  // E-06: Rate limit response with Retry-After header
  // ============================================================
  function sendRateLimitResponse() {
    const rateLimit = checkSealRateLimit(ip);
    const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({ 
      error: 'RATE_LIMIT', 
      message: `Too many seal requests. ${rateLimit.remaining} remaining.`,
      user_help: `Please wait ${Math.ceil(retryAfter / 60)} minutes before trying again.`,
      retry_after_seconds: retryAfter
    });
  }

  // ============================================================
  // E-13: Data deletion endpoint
  // ============================================================
  if (req.method === 'POST' && pathname === '/api/stp-seal/delete') {
    return await handleDataDeletion(req, res);
  }

  // ============================================================
  // E-05: Prior seal verification endpoint
  // ============================================================
  if (req.method === 'GET' && pathname === '/api/stp-seal/verify') {
    return await handlePriorSealVerify(req, res);
  }

  // ============================================================
  // E-05: File verification endpoint
  // ============================================================
  if (req.method === 'POST' && pathname === '/api/stp-seal/verify-file') {
    return await handleFileVerify(req, res);
  }

  // ============================================================
  // Ledger entries endpoint
  // ============================================================
  if (req.method === 'GET' && pathname === '/api/stp-seal/ledger') {
    return await getLedgerEntries(req, res);
  }

  // ============================================================
  // Health check (E-16: enhanced with template count and jurisdiction)
  // ============================================================
  if (req.method === 'GET' && pathname === '/api/health') {
    return res.status(200).json({
      status: 'healthy',
      service: 'STP-Seal',
      timestamp: new Date().toISOString(),
      version: 'FROZEN-2.0',
      templates_loaded: Object.keys(SEAL_TEMPLATES).length,
      jurisdiction: JURISDICTION,
      retention_days: RETENTION_DAYS,
      terms_version: TERMS_VERSION,
      endpoints: ['/api/stp-seal', '/api/stp-seal/verify', '/api/stp-seal/verify-file', '/api/stp-seal/ledger', '/api/stp-seal/delete', '/api/health']
    });
  }

  // ============================================================
  // Main seal endpoint
  // ============================================================
  if (!(req.method === 'POST' && pathname === '/api/stp-seal')) {
    return res.status(404).json({ 
      error: 'NOT_FOUND', 
      message: 'Endpoint not found',
      endpoints: ['/api/stp-seal', '/api/stp-seal/verify', '/api/stp-seal/verify-file', '/api/stp-seal/ledger', '/api/health']
    });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  const rateLimit = checkSealRateLimit(ip);
  if (!rateLimit.allowed) {
    return sendRateLimitResponse();
  }

  try {
    const { entry, type, sessionId, userId, file_hash } = req.body;
    
    if (!entry || typeof entry !== 'string' || !entry.trim()) {
      return res.status(400).json({ 
        error: 'EMPTY_ENTRY', 
        message: 'Entry text is required',
        user_help: 'Please enter the content you want to seal before continuing. The content field cannot be empty.'
      });
    }

    const now = new Date();
    const unixUtc = Math.floor(now.getTime() / 1000);
    const gregorian = gregorianString(now);
    const hebrew = hebrewString(now);
    const dreamspell = dreamspellString(now);
    
    // Include file_hash in seal computation if provided
    let finalEntry = entry.trim();
    if (file_hash) {
      finalEntry += `\n\nFile SHA-256: ${file_hash}`;
    }
    
    const seal = computeSealExact(finalEntry, gregorian, hebrew, dreamspell, unixUtc);
    const templateKey = selectTemplate(finalEntry, type);
    const ledgerFile = ledgerFileName(templateKey, gregorian, seal);
    
    const stamp = { gregorian, hebrew, dreamspell, unixUtc, seal, ledgerFile };
    
    const ledgerData = {
      protocol: 'SOVEREIGN-TRACE-PROTOCOL',
      stamp_version: 'FROZEN-2.0',
      template: templateKey,
      template_name: SEAL_TEMPLATES[templateKey].label,
      entry: finalEntry,
      gregorian,
      hebrew,
      dreamspell,
      unix_utc: unixUtc,
      seal,
      session_id: sessionId || null,
      user_id: userId || null,
      ip_hash: ip ? crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16) : null,
      sealed_at: now.toISOString(),
      file_hash: file_hash || null,
      retention_expires_at: new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      jurisdiction: JURISDICTION,
      terms_version: TERMS_VERSION
    };

    let issueUrl = null;
    let ledgerPath = null;
    let githubError = null;

    // Try GitHub integration, but don't fail if it doesn't work
    if (process.env.GITHUB_TOKEN) {
      try {
        [issueUrl, ledgerPath] = await Promise.all([
          createGitHubIssueForSeal(templateKey, finalEntry, stamp, { sessionId, userId }),
          createLedgerFileForSeal(ledgerFile, ledgerData)
        ]);
      } catch (err) {
        githubError = err.message;
        console.error('GitHub integration failed:', err.message);
      }
    }

    // Store in Supabase (optional, don't fail if not available)
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        await getSupabase().from('stp_seals').insert({
          seal,
          entry: finalEntry,
          template: templateKey,
          gregorian,
          hebrew,
          dreamspell,
          unix_utc: unixUtc,
          session_id: sessionId,
          user_id: userId,
          ip_hash: ledgerData.ip_hash,
          github_issue_url: issueUrl,
          ledger_path: ledgerPath,
          file_hash: file_hash || null,
          retention_expires_at: ledgerData.retention_expires_at,
          jurisdiction: JURISDICTION,
          terms_version: TERMS_VERSION
        });
      } catch (dbErr) {
        console.error('Supabase insert failed:', dbErr.message);
      }
    }

    // Return success
    return res.status(200).json({
      success: true,
      seal,
      gregorian,
      hebrew,
      dreamspell,
      unix_utc: unixUtc,
      template: templateKey,
      template_name: SEAL_TEMPLATES[templateKey].label,
      ledger_file: ledgerFile,
      issue_url: issueUrl,
      ledger_path: ledgerPath,
      github_error: githubError,
      file_hash: file_hash || null,
      retention_days: RETENTION_DAYS,
      jurisdiction: JURISDICTION,
      rate_limit_remaining: rateLimit.remaining
    });

  } catch (err) {
    console.error('STP seal error:', err);
    
    // User-friendly error message (E-09)
    let userMessage = 'The seal could not be created due to a server error.';
    if (err.message.includes('GITHUB_TOKEN')) {
      userMessage = 'GitHub integration is not configured. Your seal was created but not stored in the public ledger.';
    } else if (err.message.includes('timeout')) {
      userMessage = 'The request timed out. Please try again. Large files may take longer to process.';
    } else if (err.message.includes('RATE_LIMITED')) {
      userMessage = 'GitHub API rate limit exceeded. Please wait a few minutes before trying again.';
    }
    
    return res.status(500).json({
      error: 'SEAL_ERROR',
      message: err.message,
      user_message: userMessage,
      success: false
    });
  }
}

// Helper functions that were referenced but not defined in this file
async function createGitHubIssueForSeal(templateKey, entry, stamp, metadata) {
  const tmpl = SEAL_TEMPLATES[templateKey];
  const title = `[${tmpl.label}] ${entry.substring(0, 80)}${entry.length > 80 ? '...' : ''}`;
  const body = `## Sovereign Trace Protocol — Automated Seal\n\n` +
    `**Template:** ${templateKey} — ${tmpl.label}\n\n` +
    `**Entry:**\n${entry}\n\n---\n\n` +
    `**Triple-Time Stamp:**\n- 📅 Gregorian: ${stamp.gregorian}\n- 🌑 Hebrew: ${stamp.hebrew}\n- 🌀 Dreamspell: ${stamp.dreamspell}\n- ⏱ Unix UTC: ${stamp.unixUtc}\n\n` +
    `**🔒 Seal:** \`${stamp.seal}\`\n\n---\n\n` +
    (metadata.sessionId ? `**Session:** ${metadata.sessionId}\n` : '') +
    (metadata.userId ? `**User:** ${metadata.userId}\n` : '') +
    `**Ledger File:** \`${stamp.ledgerFile}\`\n\n*Sealed by AION AI Assistant*`;
  
  const { data: issue } = await ghRequest('/repos/AionSystem/SOVEREIGN-TRACE-PROTOCOL/issues', 'POST', { title, body, labels: [tmpl.name] });
  return issue.html_url;
}

async function createLedgerFileForSeal(fileName, ledgerData) {
  const path = `ledger/${fileName}`;
  const content = Buffer.from(JSON.stringify(ledgerData, null, 2), 'utf8').toString('base64');
  await ghRequest(`/repos/AionSystem/SOVEREIGN-TRACE-PROTOCOL/contents/${path}`, 'PUT', {
    message: `STP seal: ${fileName}`,
    content,
  });
  return path;
}