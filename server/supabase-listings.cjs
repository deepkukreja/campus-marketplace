/**
 * Optional third-evaluation Express -> Supabase REST CRUD.
 * No service-role key is used; authenticated writes require a normal user JWT.
 * Supabase Row-Level Security makes the final authorization decision.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Both values below are public browser settings (not secret API keys).
const publicConfig = fs.readFileSync(path.join(__dirname, '..', 'js', 'supabase-config.js'), 'utf8');
const url = process.env.SUPABASE_URL || publicConfig.match(/url:\s*["'](https:\/\/[^"']+)["']/)?.[1];
const key = process.env.SUPABASE_PUBLISHABLE_KEY || publicConfig.match(/publishableKey:\s*["']([^"']+)["']/)?.[1];
if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY or update browser public config.');

function bearer(req) {
  const authorization = String(req.get('authorization') || '');
  return /^Bearer [A-Za-z0-9_\-\.]+$/i.test(authorization) ? authorization : null;
}
function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}
const allowed = new Set(['owner_id','title','category','transaction_type','price','condition','location','description','status']);
function sanitize(raw, create = false) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const result = Object.fromEntries(Object.entries(raw).filter(([field]) => allowed.has(field)));
  if (create && (!isUUID(result.owner_id) || typeof result.title !== 'string' || !result.title.trim())) return null;
  if ('owner_id' in result && !isUUID(result.owner_id)) return null;
  if ('title' in result && (typeof result.title !== 'string' || !result.title.trim() || result.title.length > 100)) return null;
  if ('price' in result && (!Number.isFinite(result.price) || result.price < 0)) return null;
  if ('transaction_type' in result && !['sell','rent','swap','free'].includes(result.transaction_type)) return null;
  if ('status' in result && !['Available','Reserved','Sold'].includes(result.status)) return null;
  if (typeof result.description === 'string' && result.description.length > 2000) return null;
  if (Object.keys(result).length === 0) return null;
  return result;
}
async function requestSupabase(req, method, id, payload) {
  const endpoint = new URL(`${url}/rest/v1/listings`);
  if (id) endpoint.searchParams.set('id', `eq.${id}`);
  const headers = {
    apikey: key,
    Accept: 'application/json',
    Prefer: 'return=representation',
    ...(payload ? { 'Content-Type': 'application/json' } : {}),
    ...(bearer(req) ? { Authorization: bearer(req) } : {})
  };
  const response = await fetch(endpoint, { method, headers, ...(payload ? {body:JSON.stringify(payload)} : {}) });
  const body = await response.text();
  let parsed;
  try { parsed = body ? JSON.parse(body) : null; } catch { parsed = { error: 'Invalid database response.' }; }
  return { status:response.status, ok:response.ok, data:parsed };
}
function applyListingsRoutes(app) {
  // RLS exposes only available listings to anonymous users.
  app.get('/api/listings', async (req,res,next) => {
    try {
      const result = await requestSupabase(req,'GET');
      res.status(result.status).json(result.data);
    } catch(error) { next(error); }
  });
  app.post('/api/listings', async (req,res,next) => {
    if (!bearer(req)) return res.status(401).json({error:'Bearer access token required.'});
    const payload = sanitize(req.body,true);
    if (!payload) return res.status(400).json({error:'Invalid listing fields or missing owner_id/title.'});
    try {
      const result = await requestSupabase(req,'POST',null,payload);
      res.status(result.ok ? 201 : result.status).json(result.data);
    } catch(error) { next(error); }
  });
  app.patch('/api/listings/:id', async (req,res,next) => {
    if (!bearer(req)) return res.status(401).json({error:'Bearer access token required.'});
    if (!isUUID(req.params.id)) return res.status(400).json({error:'Invalid listing ID.'});
    const payload = sanitize(req.body);
    if (!payload || Object.hasOwn(payload, 'owner_id')) return res.status(400).json({error:'Invalid fields; owner_id cannot be changed.'});
    try {
      const result = await requestSupabase(req,'PATCH',req.params.id,payload);
      if (result.ok && !result.data?.length) return res.status(404).json({error:'Listing not found or not owned by this user.'});
      res.status(result.status).json(result.data);
    } catch(error) { next(error); }
  });
  app.delete('/api/listings/:id', async (req,res,next) => {
    if (!bearer(req)) return res.status(401).json({error:'Bearer access token required.'});
    if (!isUUID(req.params.id)) return res.status(400).json({error:'Invalid listing ID.'});
    try {
      const result = await requestSupabase(req,'DELETE',req.params.id);
      if (result.ok && !result.data?.length) return res.status(404).json({error:'Listing not found or not owned by this user.'});
      res.status(result.status).json(result.data);
    } catch(error) { next(error); }
  });
}
module.exports = {applyListingsRoutes};
