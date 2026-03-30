import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIGURATION
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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
// GITHUB HELPERS
// ============================================================
async function ghRequest(path, method, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub ${method} ${path} → ${res.status}: ${err}`);
  }
  return res.json();
}

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
  const issue = await ghRequest('/repos/AionSystem/SOVEREIGN-TRACE-PROTOCOL/issues', 'POST', { title, body, labels: [tmpl.name] });
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

// ============================================================
// RATE LIMITING
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
  return rec.count <= max;
}

// ============================================================
// MAIN HANDLER
// ============================================================
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Health check
  if (req.method === 'GET' && req.url === '/api/health') {
    return res.status(200).json({
      status: 'healthy',
      service: 'STP-Seal',
      timestamp: new Date().toISOString(),
      version: 'FROZEN-2.0'
    });
  }

  // Only handle POST to /api/stp-seal
  if (!(req.method === 'POST' && req.url === '/api/stp-seal')) {
    return res.status(404).json({ error: 'Not found', endpoints: ['/api/stp-seal', '/api/health'] });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  if (!checkSealRateLimit(ip)) {
    return res.status(429).json({ error: 'RATE_LIMIT', message: 'Too many seal requests. Max 30 per 15 minutes.' });
  }

  try {
    const { entry, type, sessionId, userId } = req.body;
    
    if (!entry || typeof entry !== 'string' || !entry.trim()) {
      return res.status(400).json({ error: 'EMPTY_ENTRY', message: 'Entry text is required' });
    }

    const now = new Date();
    const unixUtc = Math.floor(now.getTime() / 1000);
    const gregorian = gregorianString(now);
    const hebrew = hebrewString(now);
    const dreamspell = dreamspellString(now);
    const seal = computeSealExact(entry.trim(), gregorian, hebrew, dreamspell, unixUtc);
    const templateKey = selectTemplate(entry, type);
    const ledgerFile = ledgerFileName(templateKey, gregorian, seal);
    
    const stamp = { gregorian, hebrew, dreamspell, unixUtc, seal, ledgerFile };
    
    const ledgerData = {
      protocol: 'SOVEREIGN-TRACE-PROTOCOL',
      stamp_version: 'FROZEN-2.0',
      template: templateKey,
      template_name: SEAL_TEMPLATES[templateKey].label,
      entry: entry.trim(),
      gregorian,
      hebrew,
      dreamspell,
      unix_utc: unixUtc,
      seal,
      session_id: sessionId || null,
      user_id: userId || null,
      ip_hash: crypto.createHash('sha256').update(ip || '').digest('hex').substring(0, 16),
      sealed_at: now.toISOString()
    };

    let issueUrl = null;
    let ledgerPath = null;
    let githubError = null;

    // Try GitHub integration, but don't fail if it doesn't work
    if (process.env.GITHUB_TOKEN) {
      try {
        [issueUrl, ledgerPath] = await Promise.all([
          createGitHubIssueForSeal(templateKey, entry.trim(), stamp, { sessionId, userId }),
          createLedgerFileForSeal(ledgerFile, ledgerData)
        ]);
      } catch (err) {
        githubError = err.message;
        console.error('GitHub integration failed:', err.message);
        // Don't throw - seal is still valid
      }
    }

    // Store in Supabase (optional, don't fail if not available)
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        await getSupabase().from('stp_seals').insert({
          seal,
          entry: entry.trim(),
          template: templateKey,
          gregorian,
          hebrew,
          dreamspell,
          unix_utc: unixUtc,
          session_id: sessionId,
          user_id: userId,
          ip_hash: ledgerData.ip_hash,
          github_issue_url: issueUrl,
          ledger_path: ledgerPath
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
      github_error: githubError
    });

  } catch (err) {
    console.error('STP seal error:', err);
    return res.status(500).json({
      error: 'SEAL_ERROR',
      message: err.message,
      success: false
    });
  }
}
