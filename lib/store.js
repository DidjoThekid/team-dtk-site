'use strict';
// Stockage : Upstash Redis (REST) en production, fichier local en dev.
const fs = require('fs');
const path = require('path');
const { DEFAULTS, sanitize } = require('./model');

const KEY = 'dtk:data:v1';
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const persistent = !!(URL_ && TOKEN);
const DEV_FILE = path.join(__dirname, '..', '.data', 'dev.json');
let mem = null;

async function redis(cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error(`Redis ${r.status}`);
  return (await r.json()).result;
}

async function load() {
  let raw = null;
  if (persistent) raw = await redis(['GET', KEY]);
  else if (!process.env.VERCEL && fs.existsSync(DEV_FILE)) raw = fs.readFileSync(DEV_FILE, 'utf8');
  else raw = mem;
  if (!raw) return sanitize(DEFAULTS);
  try { return sanitize(typeof raw === 'string' ? JSON.parse(raw) : raw); } catch { return sanitize(DEFAULTS); }
}

async function save(data) {
  const s = JSON.stringify(data);
  if (persistent) return redis(['SET', KEY, s]);
  if (!process.env.VERCEL) { fs.mkdirSync(path.dirname(DEV_FILE), { recursive: true }); fs.writeFileSync(DEV_FILE, s); }
  mem = s;
}

module.exports = { load, save, persistent };
