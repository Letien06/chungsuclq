const config = require('../config');
const { normalizeChungSucCode } = require('./chungSucCode');
const TERMINAL = new Set(['completed', 'stopped', 'interrupted']);
async function request(path, options = {}) {
  if (!config.qvtool.apiKey) throw new Error('QVTOOL_API_KEY is not configured');
  const response = await fetch(`${config.qvtool.baseUrl}${path}`, { ...options, headers: { Authorization: `Bearer ${config.qvtool.apiKey}`, Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || body.error || `QVTool HTTP ${response.status}`);
  return body;
}
async function createBatch({ code, accounts, perCode = 1, source = 'own' }) { const normalizedCode = normalizeChungSucCode(code); if (!normalizedCode) { const error = new Error('Mã Chung Sức phải có đúng 10 ký tự chữ/số.'); error.status = 400; throw error; } const payload = { source, codes: normalizedCode, per_code: perCode, proxy_mode: 'server' }; if (source === 'own') payload.accounts = accounts.map((a) => `${a.username}|${a.password}`).join('\n'); return request('/assistance/batches', { method: 'POST', body: JSON.stringify(payload) }); }
async function getBatch(id) { return request(`/assistance/batches/${encodeURIComponent(id)}`); }
async function waitForBatch(id) { const started = Date.now(); let batch = await getBatch(id); while (!TERMINAL.has(batch.status)) { if (Date.now() - started >= config.qvtool.resultTimeout) return { ...batch, timedOut: true }; await new Promise((resolve) => setTimeout(resolve, config.qvtool.resultPollInterval)); batch = await getBatch(id); } return batch; }
function normalizeResults(batch) { const rows = Array.isArray(batch.rows) ? batch.rows : []; const success = rows.filter((r) => r.status === 'success').map((r) => ({ username: r.username, biEarned: Number(r.result?.reward || r.reward || 0), raw: r })); const failed = rows.filter((r) => r.status !== 'success').map((r) => ({ username: r.username, reason: r.status || 'unknown', raw: r })); return { batchId: batch.id, status: batch.status, success, failed, rows, totalBi: success.reduce((sum, r) => sum + r.biEarned, 0), charged: Number(batch.charged || 0), timedOut: Boolean(batch.timedOut), raw: batch }; }
module.exports = { createBatch, getBatch, waitForBatch, normalizeResults, isTerminal: (status) => TERMINAL.has(status) };
