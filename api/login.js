'use strict';
const { checkPassword, makeToken, setCookie, TTL } = require('../lib/auth');
const { send, readJson, isJson } = require('../lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'POST' || !isJson(req)) return send(res, 405, { error: 'Méthode non autorisée' });
  if (!process.env.ADMIN_PASSWORD) return send(res, 503, { error: "ADMIN_PASSWORD n'est pas défini dans les variables d'environnement." });
  let body; try { body = await readJson(req); } catch { return send(res, 400, { error: 'Requête invalide' }); }
  if (!checkPassword(body.password)) { await new Promise((r) => setTimeout(r, 700)); return send(res, 401, { error: 'Mot de passe incorrect' }); }
  setCookie(res, req, makeToken(), TTL);
  send(res, 200, { ok: true }, { 'Cache-Control': 'no-store' });
};
