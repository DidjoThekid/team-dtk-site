(() => {
  'use strict';
  const FX = { noel: ['❄️', '❄️', '🎄'], 'nouvel-an': ['✨', '🎆', '🥂'], 'saint-valentin': ['❤️', '💖', '💗'], paques: ['🥚', '🐣', '🌷'], halloween: ['🎃', '🦇', '👻'], aid: ['🌙', '⭐', '✨'], anniversaire: ['🎈', '🎉', '🎊'] };
  const $ = (id) => document.getElementById(id);
  let offset = 0, countdowns = [], reloaded = false;

  const eur = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const fmt = (ms) => {
    if (ms < 0) ms = 0; const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    const p = (x) => String(x).padStart(2, '0');
    return (d ? `${d} j ` : '') + `${p(h)} h ${p(m)} min ${p(sec)} s`;
  };

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const fx = $('fx'); fx.textContent = '';
    const list = FX[theme]; if (!list) return;
    for (let i = 0; i < 22; i++) {
      const it = document.createElement('i');
      it.textContent = list[i % list.length];
      it.style.left = Math.random() * 100 + 'vw';
      it.style.fontSize = 12 + Math.random() * 18 + 'px';
      it.style.animationDuration = 9 + Math.random() * 10 + 's';
      it.style.animationDelay = -Math.random() * 18 + 's';
      it.style.setProperty('--dx', (Math.random() * 20 - 10) + 'vw');
      it.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg');
      fx.append(it);
    }
  }

  function renderArticles(list) {
    const box = $('articles'); box.textContent = '';
    countdowns = countdowns.filter((c) => c.kind !== 'article');
    if (!list.length) box.append(el('p', 'muted', 'Aucun article disponible pour le moment.'));
    for (const a of list) {
      const c = el('article', 'card');
      if (a.image) { const im = el('img'); im.src = a.image; im.alt = a.name; im.loading = 'lazy'; c.append(im); }
      if (a.badge) c.append(el('span', 'badge', a.badge));
      c.append(el('h3', '', a.name), el('p', '', a.desc));
      const pr = el('div', 'price'); pr.append(el('b', '', eur(a.price))); if (a.unit) pr.append(el('small', '', a.unit)); c.append(pr);
      if (a.releaseAt) {
        const soon = el('div', 'soon'); const t = el('b', '', '…'); soon.append(el('small', '', 'Disponible dans'), t); c.append(soon);
        const b = el('button', 'btn off', 'Bientôt disponible'); b.disabled = true; c.append(b);
        countdowns.push({ kind: 'article', target: Date.parse(a.releaseAt), node: t });
      } else {
        const b = el('a', 'btn', 'Commander');
        b.href = 'mailto:team-dtk@outlook.com?subject=' + encodeURIComponent('Commande : ' + a.name) + '&body=' + encodeURIComponent('Bonjour Team DTK,\n\nJe souhaite commander : ' + a.name + ' (' + eur(a.price) + (a.unit ? ' ' + a.unit : '') + ').\n\nMerci !');
        c.append(b);
      }
      box.append(c);
    }
    const pl = $('prices'); pl.textContent = '';
    for (const a of list) { const li = el('li'); li.append(el('div', '', a.name), el('span', '', a.releaseAt ? 'Bientôt' : eur(a.price) + (a.unit ? ' · ' + a.unit : ''))); pl.append(li); }
  }

  function renderBar(cd, themes) {
    countdowns = countdowns.filter((c) => c.kind !== 'event');
    const bar = $('countdown-bar'); bar.hidden = !cd;
    if (!cd) return;
    $('cd-emoji').textContent = (themes[cd.theme] || {}).emoji || '⏳';
    $('cd-label').textContent = cd.label;
    countdowns.push({ kind: 'event', target: Date.parse(cd.targetAt), node: $('cd-time') });
  }

  function tick() {
    const now = Date.now() + offset;
    let expired = false;
    for (const c of countdowns) { const left = c.target - now; c.node.textContent = fmt(left); if (left <= 0) expired = true; }
    if (expired && !reloaded) { reloaded = true; setTimeout(load, 1500); }
  }

  async function load() {
    try {
      const r = await fetch('/api/data', { cache: 'no-store' }); if (!r.ok) throw new Error();
      const d = await r.json(); offset = d.now - Date.now(); reloaded = false;
      applyTheme(d.theme); renderArticles(d.articles); renderBar(d.countdown, d.themes); tick();
    } catch { $('articles').textContent = 'Impossible de charger les articles pour le moment.'; }
  }
  load(); setInterval(tick, 1000);
})();
