'use strict';
const { load, save, persistent } = require('../lib/store');
const { sanitize, resolveTheme, THEMES } = require('../lib/model');
const { isAdmin } = require('../lib/auth');
const { send, readJson, isJson } = require('../lib/http');

module.exports = async (req, res) => {
  const h = { 'Cache-Control': 'no-store' };
  if (!isAdmin(req)) return send(res, 401, { error: 'Non connecté' }, h);
  try {
    if (req.method === 'GET') {
      const data = await load();
      return send(res, 200, { data, themes: THEMES, persistent, now: Date.now(), effective: resolveTheme(data, Date.now()) }, h);
    }
    if (req.method === 'PUT') {
      if (!isJson(req)) return send(res, 415, { error: 'JSON requis' }, h);
      const data = sanitize(await readJson(req));
      await save(data);
      return send(res, 200, { ok: true, data, effective: resolveTheme(data, Date.now()) }, h);
    }
    send(res, 405, { error: 'Méthode non autorisée' }, h);
  } catch (e) { send(res, 500, { error: 'Erreur serveur' }, h); }
};
