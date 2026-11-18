/**
 * Third-evaluation Express demo, separate from the deployed Supabase frontend.
 * Intentionally binds localhost by default. Do not publish this unauthenticated
 * feedback API to the internet: production CRUD uses Supabase Auth + RLS.
 */
'use strict';

const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const app = express();
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
const jsonPath = path.join(__dirname, 'data', 'feedback.json');

app.disable('x-powered-by');
const { applyListingsRoutes } = require('./supabase-listings.cjs');
app.use(express.json({ limit: '16kb' }));
// Expose only deployable static files, not source files, migrations or JSON data.
const websiteRoot = path.resolve(__dirname, '..');
app.get('/', (_req, res) => res.sendFile(path.join(websiteRoot, 'index.html')));
app.get('/evaluation', (_req, res) => res.sendFile(path.join(__dirname, 'evaluation.html')));
for (const folder of ['pages', 'css', 'js', 'assets']) {
  app.use(`/${folder}`, express.static(path.join(websiteRoot, folder)));
}

let writeQueue = Promise.resolve();
async function readFeedback() {
  const entries = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  if (!Array.isArray(entries)) throw new Error('feedback.json must contain an array');
  return entries;
}
function updateFeedback(fn) {
  const task = writeQueue.then(async () => {
    const entries = await readFeedback();
    const result = fn(entries);
    const temporary = `${jsonPath}.${process.pid}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(entries, null, 2) + '\n');
    await fs.rename(temporary, jsonPath);
    return result;
  });
  writeQueue = task.catch(() => {});
  return task;
}
function isValidFeedback(value) {
  return typeof value?.name === 'string' && value.name.trim().length >= 2 && value.name.length <= 80 &&
    typeof value?.message === 'string' && value.message.trim().length >= 3 && value.message.length <= 1000;
}

applyListingsRoutes(app);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', mode: 'local-evaluation' }));
app.get('/api/feedback', async (_req, res, next) => {
  try { res.json(await readFeedback()); } catch (error) { next(error); }
});
app.post('/api/feedback', async (req, res, next) => {
  if (!isValidFeedback(req.body)) return res.status(400).json({ error: 'Provide name (2–80 chars) and message (3–1000 chars).' });
  try {
    const record = await updateFeedback(entries => {
      const value = {
        id: randomUUID(),
        name: req.body.name.trim(),
        message: req.body.message.trim(),
        created_at: new Date().toISOString()
      };
      entries.push(value);
      return value;
    });
    res.status(201).json(record);
  } catch (error) { next(error); }
});
app.patch('/api/feedback/:id', async (req, res, next) => {
  if (!isValidFeedback(req.body)) return res.status(400).json({ error: 'Provide valid name and message.' });
  try {
    const record = await updateFeedback(entries => {
      const entry = entries.find(x => x.id === req.params.id);
      if (entry) { entry.name = req.body.name.trim(); entry.message = req.body.message.trim(); }
      return entry || null;
    });
    if (!record) return res.status(404).json({ error: 'Feedback not found.' });
    res.json(record);
  } catch (error) { next(error); }
});
app.delete('/api/feedback/:id', async (req, res, next) => {
  try {
    const deleted = await updateFeedback(entries => {
      const index = entries.findIndex(x => x.id === req.params.id);
      if (index === -1) return false;
      entries.splice(index, 1);
      return true;
    });
    if (!deleted) return res.status(404).json({ error: 'Feedback not found.' });
    res.status(204).end();
  } catch (error) { next(error); }
});
app.use((err, _req, res, _next) => {
  console.error('Express evaluation API error:', err);
  res.status(err.type === 'entity.parse.failed' ? 400 : 500)
    .json({ error: err.type === 'entity.parse.failed' ? 'Invalid JSON body.' : 'Internal server error.' });
});
if (require.main === module) {
  app.listen(PORT, HOST, () => console.log(`Campus Marketplace evaluation: http://${HOST}:${PORT}/`));
}
module.exports = app;
