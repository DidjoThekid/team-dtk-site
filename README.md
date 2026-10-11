# Team DTK — site + panneau admin

Site vitrine (style sportswear) avec un panneau `/admin` pour :

- **ajouter / modifier / retirer des articles** (nom, prix, unité, badge, image, ordre, visibilité) ;
- **choisir la version du site** : Classique, Noël, Nouvel An, Saint-Valentin, Pâques, Halloween, Aïd, Anniversaire (couleurs + petits effets) ;
- **mode Automatique** : le thème change tout seul pendant les fêtes programmées ;
- **chronomètres** : compte à rebours vers la prochaine fête (bandeau en haut du site) et vers la **sortie d'un article** (caché, ou affiché en « Bientôt disponible » avec son chronomètre, puis commandable automatiquement).

Aucune dépendance npm : fichiers statiques (`public/`) + fonctions Vercel (`api/`).

## Mise en ligne (≈ 10 min)

1. **GitHub** : crée un dépôt (privé de préférence) et envoie-y le contenu de ce dossier.
2. **Vercel** : *Add New → Project* → importe le dépôt → *Deploy* (aucun réglage de build nécessaire).
3. **Base de données** (obligatoire pour que l'admin garde les modifications) : dans Vercel, onglet *Storage* (ou *Marketplace*) → **Upstash Redis** → crée la base gratuite et connecte-la au projet. Vercel ajoute les variables `KV_REST_API_URL` / `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) : les deux noms sont gérés.
4. **Mot de passe admin** : *Settings → Environment Variables* → ajoute `ADMIN_PASSWORD` (long et unique). Optionnel : `SESSION_SECRET` (chaîne aléatoire).
5. **Redéploie** (Deployments → ⋯ → Redeploy) pour que les variables soient prises en compte.
6. Va sur `https://ton-site.vercel.app/admin`. Pour ton propre domaine : *Settings → Domains*.

## Essayer en local

```bash
ADMIN_PASSWORD=monmotdepasse npm run dev   # http://localhost:3000 — admin : /admin
```

En local, les données sont enregistrées dans `.data/dev.json`.

## Utilisation

- **Enregistrer & publier** : rien n'est en ligne tant que tu n'as pas cliqué (le site se met à jour en quelques secondes).
- **Article à venir** : renseigne « Sortie le ». Case d'aperçu décochée = article invisible jusqu'à la date. Case cochée = carte « Bientôt disponible » + chronomètre.
- **Fêtes** : « Date de la fête » = cible du chronomètre ; « actif dès / jusqu'au » = période où le thème s'applique en mode Automatique. Des fêtes d'exemple sont préremplies (Halloween, Noël, Nouvel An, Saint-Valentin, Pâques) : ajoute l'Aïd, les anniversaires, etc. avec leurs dates.
- Les dates sont saisies à l'heure de ton navigateur.

## Sécurité

- Session par cookie signé (HttpOnly, SameSite=Strict, Secure), 7 jours, mot de passe comparé en temps constant.
- Toutes les données saisies sont nettoyées côté serveur (longueurs, dates, thèmes, images en `https://` uniquement) et affichées en texte brut (pas d'injection HTML).
- Le public ne reçoit jamais les articles masqués ni les articles « à venir » sans aperçu.

## À savoir

- Le bouton **Commander** ouvre un e-mail pré-rempli vers team-dtk@outlook.com (comme ton site actuel : paiement SumUp sur contact). Pas de panier ni de compte client.
- Structure : `api/` (data, login, logout, admin) · `lib/` (modèle, stockage, auth) · `public/` (site + admin).
