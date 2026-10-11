(() => {
  'use strict';
  const root = document.getElementById('root');
  let state = null, themes = {}, meta = {}, dirty = false;

  // --- petit helper DOM (aucun innerHTML : tout passe par textContent) ---
  function h(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const x of kids.flat()) if (x != null && x !== false) e.append(x instanceof Node ? x : document.createTextNode(x));
    return e;
  }
  const api = async (url, opts = {}) => {
    const r = await fetch(url, { credentials: 'same-origin', ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
    let body = {}; try { body = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(body.error || 'Erreur ' + r.status); e.status = r.status; throw e; }
    return body;
  };
  const toLocal = (iso) => { if (!iso) return ''; const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
  const mark = () => { dirty = true; const s = document.getElementById('status'); if (s) { s.className = ''; s.textContent = 'Modifications non enregistrées'; } };

  function field(label, obj, key, o = {}) {
    const i = h(o.area ? 'textarea' : 'input', o.area ? { placeholder: o.ph || '' } : { type: o.type || 'text', placeholder: o.ph || '', step: o.step, min: o.min, maxlength: o.max });
    i.value = obj[key] ?? '';
    i.addEventListener('input', () => { obj[key] = o.num ? (i.value === '' ? 0 : Number(i.value)) : i.value; mark(); });
    return h('label', { class: 'f' + (o.wide ? ' wide' : '') }, h('span', {}, label), i);
  }
  function dateField(label, obj, key, hint) {
    const i = h('input', { type: 'datetime-local' }); i.value = toLocal(obj[key]);
    i.addEventListener('input', () => { obj[key] = i.value ? new Date(i.value).toISOString() : null; mark(); });
    return h('label', { class: 'f' }, h('span', {}, label + (hint ? ' — ' + hint : '')), i);
  }
  function check(label, obj, key, def = false) {
    const i = h('input', { type: 'checkbox' }); i.checked = obj[key] === undefined ? def : !!obj[key];
    i.addEventListener('change', () => { obj[key] = i.checked; mark(); });
    return h('label', { class: 'chk' }, i, label);
  }
  function themeSelect(label, obj, key) {
    const s = h('select', {}, Object.entries(themes).map(([id, t]) => h('option', { value: id }, `${t.emoji} ${t.label}`)));
    s.value = obj[key] || 'default'; s.addEventListener('change', () => { obj[key] = s.value; mark(); });
    return h('label', { class: 'f' }, h('span', {}, label), s);
  }

  // ------------------------------------------------------------------ login
  function renderLogin(msg) {
    root.textContent = '';
    const pw = h('input', { type: 'password', autocomplete: 'current-password', autofocus: true });
    const err = h('p', { id: 'status', class: 'err' }, msg || '');
    const go = async () => {
      try { await api('/api/login', { method: 'POST', body: JSON.stringify({ password: pw.value }) }); boot(); }
      catch (e) { err.textContent = e.message; pw.select(); }
    };
    pw.addEventListener('keydown', (e) => e.key === 'Enter' && go());
    root.append(h('div', { class: 'login' }, h('h1', {}, 'TEAM ', h('span', {}, 'DTK')), h('p', { class: 'hint' }, 'Panneau d\'administration'), h('label', { class: 'f' }, h('span', {}, 'Mot de passe'), pw), h('button', { class: 'pri', onclick: go }, 'Se connecter'), err));
  }

  // ------------------------------------------------------------------ éditeur
  async function save(btn) {
    const s = document.getElementById('status'); btn.disabled = true; s.className = ''; s.textContent = 'Enregistrement…';
    try {
      const r = await api('/api/admin', { method: 'PUT', body: JSON.stringify(state) });
      state = r.data; meta.effective = r.effective; dirty = false; render();
      const s2 = document.getElementById('status'); s2.className = 'ok'; s2.textContent = '✓ Publié sur le site (visible dans quelques secondes)';
    } catch (e) { if (e.status === 401) return renderLogin('Session expirée'); s.className = 'err'; s.textContent = e.message; btn.disabled = false; }
  }

  function move(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; mark(); render(); }

  function articleCard(a, i) {
    const future = a.releaseAt && Date.parse(a.releaseAt) > Date.now();
    return h('div', { class: 'card' },
      h('div', { class: 'row' },
        field('Nom', a, 'name', { max: 80 }), field('Prix (€)', a, 'price', { type: 'number', num: true, step: '0.01', min: '0' }),
        field('Unité', a, 'unit', { ph: "l'unité / par mois" }), field('Badge', a, 'badge', { ph: 'Best-seller, Nouveau…' }),
        field('Description', a, 'desc', { area: true, wide: true, max: 500 }),
        field('Image (lien https, optionnel)', a, 'image', { wide: true, ph: 'https://…' }),
        dateField('Sortie le', a, 'releaseAt', 'vide = disponible tout de suite')),
      h('div', { class: 'tools' }, check('Visible sur le site', a, 'visible', true), check('Montrer l\'aperçu avec chronomètre avant la sortie', a, 'teaser'),
        future ? h('span', { class: 'pill live' }, 'sortie programmée') : null,
        h('span', { class: 'sp' }), h('button', { class: 'sm', onclick: () => move(state.articles, i, -1) }, '↑'), h('button', { class: 'sm', onclick: () => move(state.articles, i, 1) }, '↓'),
        h('button', { class: 'sm del', onclick: () => { if (confirm('Retirer « ' + (a.name || 'cet article') + ' » ?')) { state.articles.splice(i, 1); mark(); render(); } } }, 'Retirer')));
  }
  function eventCard(e, i) {
    const now = Date.now(); const live = e.startAt && e.endAt && Date.parse(e.startAt) <= now && now < Date.parse(e.endAt);
    return h('div', { class: 'card' },
      h('div', { class: 'row' }, field('Nom de la fête', e, 'name', { max: 60 }), themeSelect('Thème appliqué', e, 'theme'),
        dateField('Date de la fête', e, 'targetAt', 'cible du chronomètre'), dateField('Thème actif dès le', e, 'startAt'), dateField('Thème actif jusqu\'au', e, 'endAt')),
      h('div', { class: 'tools' }, check('Afficher le chronomètre sur le site', e, 'countdown', true), live ? h('span', { class: 'pill live' }, 'en cours') : null,
        h('span', { class: 'sp' }), h('button', { class: 'sm del', onclick: () => { if (confirm('Retirer « ' + (e.name || 'cette fête') + ' » ?')) { state.events.splice(i, 1); mark(); render(); } } }, 'Retirer')));
  }

  function render() {
    root.textContent = '';
    const btn = h('button', { class: 'pri', onclick: () => save(btn) }, 'Enregistrer & publier');
    const eff = meta.effective || {};
    const srcTxt = { manual: 'choisi à la main', event: 'fête en cours : ' + eff.event, default: 'thème par défaut' }[eff.source] || '';
    root.append(
      h('div', { class: 'bar' }, h('div', { class: 'wrap' }, h('h1', {}, 'TEAM ', h('span', {}, 'DTK'), ' · Admin'), h('span', { id: 'status' }, dirty ? 'Modifications non enregistrées' : ''),
        h('a', { class: 'lnk', href: '/', target: '_blank', rel: 'noopener' }, 'Voir le site'), h('button', { onclick: async () => { await api('/api/logout', { method: 'POST', body: '{}' }); renderLogin(); } }, 'Déconnexion'), btn)),
      h('div', { class: 'wrap' },
        meta.persistent ? null : h('div', { class: 'warn' }, '⚠️ Aucune base de données connectée : sur Vercel, tes modifications seraient perdues. Ajoute Upstash Redis dans Vercel (Storage) — voir le README.'),
        // thème
        h('section', {}, h('h2', {}, 'Version du site'), h('p', { class: 'hint' }, 'Actuellement affiché : ', h('b', {}, (themes[eff.theme] || {}).label || '—'), ' (' + srcTxt + ').'),
          (() => {
            const mode = (v, t, d) => h('label', {}, h('input', { type: 'radio', name: 'mode', value: v, checked: state.settings.mode === v, onchange: () => { state.settings.mode = v; mark(); render(); } }), h('b', {}, t), h('span', {}, d));
            return h('div', { class: 'seg' }, mode('auto', 'Automatique', 'Le thème change tout seul pendant les fêtes programmées ci-dessous.'), mode('manual', 'Manuel', 'Je force un thème précis, tout le temps.'));
          })(),
          h('p', { class: 'hint' }, state.settings.mode === 'manual' ? 'Thème forcé :' : 'Thème en dehors des fêtes :'),
          h('div', { class: 'themes' }, Object.entries(themes).map(([id, t]) => h('label', {}, h('input', { type: 'radio', name: 'theme', value: id, checked: state.settings.theme === id, onchange: () => { state.settings.theme = id; mark(); } }), `${t.emoji} ${t.label}`)))),
        // articles
        h('section', {}, h('h2', {}, 'Articles'), h('p', { class: 'hint' }, 'Ajoute, modifie ou retire des articles. Avec une date de sortie, l\'article reste caché — ou s\'affiche avec un chronomètre si tu coches l\'aperçu — puis devient commandable automatiquement.'),
          state.articles.map(articleCard),
          h('button', { onclick: () => { state.articles.unshift({ name: 'Nouvel article', desc: '', price: 0, unit: "l'unité", badge: 'Nouveau', image: '', releaseAt: null, teaser: false, visible: true }); mark(); render(); } }, '+ Ajouter un article')),
        // fêtes
        h('section', {}, h('h2', {}, 'Fêtes & chronomètres'), h('p', { class: 'hint' }, 'Le chronomètre du site compte vers la prochaine fête programmée. Le thème s\'applique seul entre « actif dès » et « actif jusqu\'à » (mode Automatique).'),
          state.events.map(eventCard),
          h('button', { onclick: () => { state.events.push({ name: 'Nouvelle fête', theme: 'anniversaire', targetAt: null, startAt: null, endAt: null, countdown: true }); mark(); render(); } }, '+ Ajouter une fête')),
        h('p', { class: 'hint' }, 'Les dates sont à l\'heure de ton navigateur. Pense à cliquer sur « Enregistrer & publier ».')));
  }

  async function boot() {
    try {
      const r = await api('/api/admin'); state = r.data; themes = r.themes; meta = { persistent: r.persistent, effective: r.effective }; dirty = false; render();
    } catch (e) { renderLogin(e.status === 401 ? '' : e.message); }
  }
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  boot();
})();
