# xthreem.ch

Sito di lancio della xthreem 24 (MTB biammortizzata per ragazzi), pubblicato con GitHub Pages.

- `src/template.html` – la pagina (testi in 4 lingue nell'oggetto `T`).
- `src/build.js` – genera `index.html` (IT), `de/`, `fr/`, `en/` per i motori di ricerca: `node src/build.js` dopo ogni modifica al modello.
- `config.js` – **unico file da cambiare per l'edizione di lancio**: `sold` = bici pagate (0-10). Non serve ricompilare.
- `sitemap.xml`, `robots.txt`, `favicon.svg`, `CNAME`.
