# Onde Locale - Web radio

Interface statique de web radio locale avec stations, lecteur live, favoris, recherche, grille de programmes et ajout de flux audio.

## Lancer en local

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Puis ouvrir `http://127.0.0.1:4173/`.

## Deploiement Netlify

Le projet est un site statique sans etape de build.

- Build command: vide
- Publish directory: `.`

