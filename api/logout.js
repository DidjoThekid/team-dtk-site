'use strict';
const { setCookie } = require('../lib/auth');
const { send } = require('../lib/http');
module.exports = (req, res) => { setCookie(res, req, '', 0); send(res, 200, { ok: true }); };
