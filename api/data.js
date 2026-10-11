'use strict';
const { load } = require('../lib/store');
const { publicView } = require('../lib/model');
const { send } = require('../lib/http');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { error: 'Méthode non autorisée' });
  try {
    const data = await load();
    send(res, 200, publicView(data, Date.now()), { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=20' });
  } catch (e) { send(res, 500, { error: 'Erreur serveur' }); }
};
