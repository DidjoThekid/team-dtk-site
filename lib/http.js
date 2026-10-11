'use strict';
function send(res, code, body, headers = {}) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}
async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = typeof req.body === 'string' ? req.body : '';
  if (!raw) { const chunks = []; let n = 0; for await (const c of req) { n += c.length; if (n > 512 * 1024) throw new Error('too large'); chunks.push(c); } raw = Buffer.concat(chunks).toString(); }
  return raw ? JSON.parse(raw) : {};
}
const isJson = (req) => /application\/json/i.test(req.headers['content-type'] || '');
module.exports = { send, readJson, isJson };
