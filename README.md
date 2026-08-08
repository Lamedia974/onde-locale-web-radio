# Onde Locale - Web radio

Interface statique de web radio locale avec stations, lecteur live, favoris, recherche, grille de programmes et ajout de flux audio.

## Alerte Infos — La Réunion en chiffres

`alerte-infos/chiffres.html` : page de statistiques en temps réel façon Worldometers à l'échelle de La Réunion (population, naissances, économie, énergie, territoire). Les compteurs extrapolent des moyennes annuelles publiées (INSEE, etc.) — ce sont des estimations, pas des mesures. Design repris du bundle Claude Design `splashscreen-alerte-r-union/` (système Modernist : Archivo, accent #ec3013, zéro arrondi, règles 2px).

## Lancer en local

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Puis ouvrir `http://127.0.0.1:4173/`.

## Deploiement Netlify

Le projet est un site statique sans etape de build.

- Build command: vide
- Publish directory: `.`

