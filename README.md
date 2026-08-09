# Onde Locale & Alerte Infos Réunion

Site statique sans étape de build, déployé sur **Netlify** :

**https://onde-locale-974.netlify.app/**

| Page | URL | Rôle |
| --- | --- | --- |
| Web radio Onde Locale | `/` | Stations péi, lecteur live, favoris, programmes |
| Accueil Alerte Infos | `/alerte-infos/` | Landing de l'appli : survol 3D de l'île, fonctionnalités, modules |
| La Réunion en chiffres | `/alerte-infos/chiffres.html` | Tableau de bord bento en temps réel (compteurs, odomètres, animations) |
| La carte du 974 | `/alerte-infos/carte.html` | Carte interactive open data (sentiers GR, toilettes, eau, équipements) |

La navigation est croisée entre toutes les pages (topbars et footers), en liens
relatifs — le site fonctionne aussi bien sous un sous-chemin que sur un domaine
racine.

## Déploiement

`netlify.toml` publie la racine du dépôt telle quelle (`publish = "."`, aucune
commande de build) : le dépôt **est** le site. Netlify sert aussi les URLs sans
extension (`/alerte-infos/chiffres` comme `/alerte-infos/chiffres.html`).

Pour un domaine personnalisé : Netlify → Domain management, puis mettre à jour
les URLs de `robots.txt` et `sitemap.xml`.

## Lancer en local

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Puis ouvrir `http://127.0.0.1:4173/`. (La carte et le survol 3D chargent des
fichiers en `fetch` : il faut un serveur HTTP, pas un simple `file://`.)

## SEO

- `robots.txt` et `sitemap.xml` à la racine, pointés sur l'URL Netlify.
- Chaque page porte title/description uniques, Open Graph, `theme-color` et des
  données structurées JSON-LD (RadioStation, SoftwareApplication, Dataset).
- Archivo est chargée via `preconnect` + `<link>` (pas d'`@import` bloquant).

## L'accueil Alerte Infos

Héro avec mockup téléphone incliné, **survol 3D de l'île au scroll** (Three.js
vendorisé, littoral réel + relief AWS avec repli procédural, 5 étapes, brouillard
côtier), sections qui glissent par-dessus l'île, cartes animées (icônes vivantes,
pluie de €, île qui se trace), révélations au scroll jusqu'au footer.

## Données de la carte

`alerte-infos/data/*.geojson` (~390 Ko) : extraits d'OpenStreetMap (licence ODbL)
via l'API Overpass — 42 itinéraires `route=hiking` (dont GR R1/R2/R3, simplifiés
Douglas-Peucker ~9 m), toilettes publiques, eau potable, aires de pique-nique,
mairies, santé, écoles (bbox −21.42,55.20,−20.83,55.90), plus le littoral du
département (`ile.geojson`) qui sert de fond de secours et de socle au relief 3D.
Leaflet 1.9.4, Leaflet.markercluster et Three sont vendorisés dans
`alerte-infos/vendor/`.

## Chiffres du tableau de bord

Les compteurs extrapolent des moyennes annuelles publiées (INSEE, douane, CAF,
Observatoire Énergie Réunion…) — estimations lissées, pas des mesures. Les taux
sont des attributs `data-rate-year` dans `alerte-infos/chiffres.html`.

## Design

Design system « Modernist » (Archivo, accent #ec3013), assoupli en grille bento
arrondie. Le bundle de maquettes d'origine (`splashscreen-alerte-r-union/`) a été
retiré du dépôt une fois implémenté — il reste disponible dans l'historique git.
