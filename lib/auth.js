'use strict';
const crypto = require('crypto');

const COOKIE = 'dtk_admin';
const TTL = 7 * 24 * 3600; // 7 jours
const password = () => process.env.ADMIN_PASSWORD || '';
const secret = () => process.env.SESSION_SECRET || crypto.createHash('sha256').update('dtk:' + password()).digest('hex');
const mac = (p) => crypto.createHmac('sha256', secret()).update(p).digest('base64url');

function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
const checkPassword = (p) => !!password() && safeEqual(p || '', password());

function makeToken() {
  const p = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + TTL })).toString('base64url');
  return `${p}.${mac(p)}`;
}
function verifyToken(t) {
  if (!password() || typeof t !== 'string') return false;
  const [p, m] = t.split('.');
  if (!p || !m || !safeEqual(m, mac(p))) return false;
  try { return JSON.parse(Buffer.from(p, 'base64url').toString()).exp > Date.now() / 1000; } catch { return false; }
}
function cookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) { const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); }
  return out;
}
const isAdmin = (req) => verifyToken(cookies(req)[COOKIE]);
function setCookie(res, req, token, maxAge) {
  const local = /^(localhost|127\.0\.0\.1)/.test(req.headers.host || '');
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${local ? '' : '; Secure'}`);
}

module.exports = { checkPassword, makeToken, isAdmin, setCookie, TTL };
