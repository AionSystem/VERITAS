// api/reports.js
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const supabasePath = req.query.path || 'reports';
  const queryString = new URLSearchParams(
    Object.fromEntries(
      Object.entries(req.query).filter(([k]) => k !== 'path')
    )
  ).toString();

  const url = `${SUPABASE_URL}/rest/v1/${supabasePath}${queryString ? '?' + queryString : ''}`;

  const headers = {
    'apikey': SUPABASE_ANON,
    'Authorization': `Bearer ${SUPABASE_ANON}`,
    'Content-Type': 'application/json',
    'Prefer': req.headers['prefer'] || ''
  };

  const response = await fetch(url, {
    method: req.method,
    headers,
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
  });

  const data = await response.text();
  res.status(response.status)
    .setHeader('Content-Type', response.headers.get('content-type') || 'application/json')
    .send(data);
}