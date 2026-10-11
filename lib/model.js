'use strict';
// Thèmes disponibles (les couleurs sont dans public/style.css)
const THEMES = {
  default: { label: 'Classique (Team DTK)', emoji: '⚡' },
  noel: { label: 'Noël', emoji: '🎄' },
  'nouvel-an': { label: 'Nouvel An', emoji: '🎆' },
  'saint-valentin': { label: 'Saint-Valentin', emoji: '💖' },
  paques: { label: 'Pâques', emoji: '🥚' },
  halloween: { label: 'Halloween', emoji: '🎃' },
  aid: { label: 'Aïd', emoji: '🌙' },
  anniversaire: { label: 'Anniversaire', emoji: '🎈' },
};

const DEFAULTS = {
  settings: { mode: 'auto', theme: 'default' },
  articles: [
    { id: 'enveloppe-team-dtk', name: 'Enveloppe Team DTK', desc: "Une enveloppe signature à l'image de la Team : logo, couleurs et finitions soignées. L'objet qui affirme votre appartenance.", price: 4.99, unit: "l'unité", badge: 'Best-seller', image: '', releaseAt: null, teaser: false, visible: true },
    { id: 'photo-de-profil', name: 'Photo de profil personnalisée', desc: 'Un avatar unique, retravaillé à votre image : cadrage, ambiance, détails. Parfait pour vos réseaux et vos espaces de jeu.', price: 1.99, unit: "l'unité", badge: 'Rapide', image: '', releaseAt: null, teaser: false, visible: true },
    { id: 'securite-web', name: 'Sécurité Web', desc: 'Surveillance, mises à jour et bonnes pratiques : votre présence en ligne reste propre et protégée, mois après mois.', price: 7.99, unit: 'par mois', badge: 'Abonnement', image: '', releaseAt: null, teaser: false, visible: true },
  ],
  // targetAt = date de la fête (compte à rebours) ; startAt/endAt = période où le thème s'applique tout seul
  events: [
    { id: 'halloween-2026', name: 'Halloween', theme: 'halloween', targetAt: '2026-10-31T00:00:00+01:00', startAt: '2026-10-24T00:00:00+02:00', endAt: '2026-11-02T00:00:00+01:00', countdown: true },
    { id: 'noel-2026', name: 'Noël', theme: 'noel', targetAt: '2026-12-25T00:00:00+01:00', startAt: '2026-12-01T00:00:00+01:00', endAt: '2026-12-27T00:00:00+01:00', countdown: true },
    { id: 'nouvel-an-2027', name: 'Nouvel An', theme: 'nouvel-an', targetAt: '2027-01-01T00:00:00+01:00', startAt: '2026-12-28T00:00:00+01:00', endAt: '2027-01-03T00:00:00+01:00', countdown: true },
    { id: 'saint-valentin-2027', name: 'Saint-Valentin', theme: 'saint-valentin', targetAt: '2027-02-14T00:00:00+01:00', startAt: '2027-02-07T00:00:00+01:00', endAt: '2027-02-15T00:00:00+01:00', countdown: true },
    { id: 'paques-2027', name: 'Pâques', theme: 'paques', targetAt: '2027-03-28T00:00:00+01:00', startAt: '2027-03-21T00:00:00+01:00', endAt: '2027-03-29T00:00:00+02:00', countdown: true },
  ],
};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const iso = (v) => { if (!v) return null; const t = Date.parse(v); return Number.isNaN(t) ? null : new Date(t).toISOString(); };
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const theme = (v) => (Object.prototype.hasOwnProperty.call(THEMES, v) ? v : 'default');
const httpsUrl = (v) => { const s = str(v, 500); return /^https:\/\/[^\s"'<>]+$/i.test(s) ? s : ''; };

function uniqueId(base, used) {
  let id = slug(base) || 'item'; let n = 2; const root = id;
  while (used.has(id)) id = `${root}-${n++}`;
  used.add(id); return id;
}

function sanitize(input) {
  const d = input && typeof input === 'object' ? input : {};
  const s = d.settings || {};
  const out = { settings: { mode: s.mode === 'manual' ? 'manual' : 'auto', theme: theme(s.theme) }, articles: [], events: [] };
  const used = new Set();
  for (const a of (Array.isArray(d.articles) ? d.articles : []).slice(0, 50)) {
    const name = str(a && a.name, 80); if (!name) continue;
    const price = Math.round(Math.max(0, Math.min(100000, Number(a.price) || 0)) * 100) / 100;
    out.articles.push({ id: uniqueId(str(a.id, 60) || name, used), name, desc: str(a.desc, 500), price, unit: str(a.unit, 30), badge: str(a.badge, 30), image: httpsUrl(a.image), releaseAt: iso(a.releaseAt), teaser: !!a.teaser, visible: a.visible !== false });
  }
  const used2 = new Set();
  for (const e of (Array.isArray(d.events) ? d.events : []).slice(0, 50)) {
    const name = str(e && e.name, 60); if (!name) continue;
    out.events.push({ id: uniqueId(str(e.id, 60) || name, used2), name, theme: theme(e.theme), targetAt: iso(e.targetAt), startAt: iso(e.startAt), endAt: iso(e.endAt), countdown: e.countdown !== false });
  }
  return out;
}

// Thème appliqué à l'instant `now` (ms)
function resolveTheme(data, now) {
  const s = data.settings;
  if (s.mode === 'manual') return { theme: s.theme, source: 'manual', event: null };
  const active = data.events
    .filter((e) => e.startAt && e.endAt && Date.parse(e.startAt) <= now && now < Date.parse(e.endAt))
    .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt))[0];
  if (active) return { theme: active.theme, source: 'event', event: active.name };
  return { theme: s.theme, source: 'default', event: null };
}

// Ce que voit le public (aucune info privée)
function publicView(data, now) {
  const r = resolveTheme(data, now);
  const articles = data.articles
    .filter((a) => a.visible)
    .filter((a) => !a.releaseAt || Date.parse(a.releaseAt) <= now || a.teaser)
    .map((a) => ({ id: a.id, name: a.name, desc: a.desc, price: a.price, unit: a.unit, badge: a.badge, image: a.image, releaseAt: a.releaseAt && Date.parse(a.releaseAt) > now ? a.releaseAt : null }));
  const next = data.events
    .filter((e) => e.countdown && e.targetAt && Date.parse(e.targetAt) > now)
    .sort((a, b) => Date.parse(a.targetAt) - Date.parse(b.targetAt))[0];
  return { now, theme: r.theme, themeSource: r.source, themeEvent: r.event, themes: THEMES, articles, countdown: next ? { label: next.name, theme: next.theme, targetAt: next.targetAt } : null };
}

module.exports = { THEMES, DEFAULTS, sanitize, resolveTheme, publicView };
