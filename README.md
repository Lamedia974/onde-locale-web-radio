# Onde Locale & Alerte Infos Réunion

Site statique sans étape de build, en deux univers reliés :

| Page | URL | Rôle |
| --- | --- | --- |
| Web radio Onde Locale | `/` | Stations péi, lecteur live, favoris, programmes |
| Accueil Alerte Infos | `/alerte-infos/` | Landing de l'appli : fonctionnalités, téléchargement, accès aux modules |
| La Réunion en chiffres | `/alerte-infos/chiffres.html` | Tableau de bord bento en temps réel (compteurs, odomètres, animations) |
| La carte du 974 | `/alerte-infos/carte.html` | Carte interactive open data (sentiers GR, toilettes, eau, équipements) |

La navigation est croisée : la radio pointe vers Alerte Infos (« Alerte Infos » dans le
menu), et chaque page Alerte Infos relie l'accueil, les chiffres, la carte et la radio.

## Lancer en local

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Puis ouvrir `http://127.0.0.1:4173/`. (La carte charge ses GeoJSON en `fetch` :
il faut un serveur HTTP, pas un simple `file://`.)

## Déploiement Netlify

Site statique sans build.

- Build command : vide
- Publish directory : `.`
- `netlify.toml` ajoute les en-têtes de sécurité et le cache des données/vendors.

## SEO

- `robots.txt` et `sitemap.xml` à la racine — **remplacer le domaine**
  `onde-locale-web-radio.netlify.app` par le domaine réel si différent.
- Chaque page porte title/description uniques, Open Graph, `theme-color` et des
  données structurées JSON-LD (RadioStation, SoftwareApplication, Dataset).
- Archivo est chargée via `preconnect` + `<link>` (pas d'`@import` bloquant).

## Données de la carte

`alerte-infos/data/*.geojson` (~390 Ko) : extraits d'OpenStreetMap (licence ODbL) via
l'API Overpass — 42 itinéraires `route=hiking` (dont GR R1/R2/R3, simplifiés
Douglas-Peucker ~9 m), toilettes publiques, eau potable, aires de pique-nique, mairies,
santé, écoles (bbox −21.42,55.20,−20.83,55.90), plus le littoral du département
(`ile.geojson`) qui sert de fond quand les tuiles OSM ne répondent pas.
Leaflet 1.9.4 et Leaflet.markercluster sont vendorisés dans `alerte-infos/vendor/`.

## Chiffres du tableau de bord

Les compteurs extrapolent des moyennes annuelles publiées (INSEE, douane, CAF,
Observatoire Énergie Réunion…) — estimations lissées, pas des mesures. Les taux sont
des attributs `data-rate-year` dans `alerte-infos/chiffres.html`, faciles à mettre à jour.

## Design

Design system « Modernist » du bundle Claude Design `splashscreen-alerte-r-union/`
(Archivo, accent #ec3013, règles 2 px), assoupli en grille bento arrondie. Le bundle
reste la référence maquette ; les pages de production vivent dans `alerte-infos/`.
