# Publier une mise à jour MSAM

Notes internes (pas pour l'utilisateur final) : comment publier une nouvelle
version pour que les MSAM déjà installés la détectent et se mettent à jour
automatiquement, avec un téléchargement partiel (pas tout l'installeur à
chaque fois).

Le système utilise le provider "generic" d'electron-updater, qui lit un
fichier `latest.yml` + l'installeur sur une simple URL HTTP — pas besoin de
l'API GitHub (Releases), qui n'est pas accessible depuis certains
environnements. On sert ces fichiers via **GitHub Pages**
(`https://frakaprod.github.io/msam/updates/`), activé une fois pour toutes
sur la branche `releases` (Settings > Pages > Source = branche "releases").
GitHub Pages supporte les requêtes HTTP Range (vérifié) — contrairement à
`raw.githubusercontent.com`, qui les ignore — ce qui permet à
electron-updater de ne télécharger que les blocs modifiés entre deux
versions plutôt que l'installeur en entier.

**Important** : pour que le téléchargement partiel fonctionne, il faut que
le `.blockmap` de la version PRÉCÉDENTE soit encore présent sur la branche
`releases` en même temps que celui de la nouvelle version (electron-updater
diffe les deux). Donc on garde toujours les 2 dernières versions dans
`updates/`, on ne repart pas de zéro à chaque fois (sauf la toute première
publication).

## Étapes

1. Mettre à jour `version` dans `package.json` (obligatoire : electron-updater
   compare les numéros de version, pas les dates).
2. `npm run package:win` → génère `release/MSAM Setup <version>.exe`,
   `release/latest.yml`, `release/*.blockmap`.
3. Publier sur la branche `releases`, en gardant la version précédente à côté
   de la nouvelle (pas de `git rm -rf` complet) :

   ```bash
   # Repartir d'un état propre : si un ancien worktree/branche locale
   # "releases" traîne d'une session précédente, le checkout --orphan échoue
   # sinon (piège déjà rencontré une fois).
   git worktree remove /tmp/msam-releases-branch --force 2>/dev/null || true
   git branch -D releases 2>/dev/null || true

   git worktree add /tmp/msam-releases-branch --detach
   cd /tmp/msam-releases-branch

   # Récupère le contenu actuel de la branche "releases" distante (contient
   # la version précédente) plutôt que de repartir d'un orphelin vide.
   git fetch origin releases
   git checkout -B releases origin/releases

   # Ne garder que la version précédente (celle qui vient d'être publiée) +
   # la nouvelle : supprime tout ce qui a plus d'un cran de retard.
   # (à faire à la main : lister updates/, virer les .exe/.blockmap dont la
   # version n'est ni l'actuelle (déjà en place) ni la précédente)

   cp "/home/claude/msam/release/MSAM Setup <version>.exe" updates/
   cp /home/claude/msam/release/latest.yml updates/
   cp /home/claude/msam/release/*.blockmap updates/
   git add updates
   git commit -m "Release <version>"
   git push origin releases
   cd /home/claude/msam
   git worktree remove /tmp/msam-releases-branch --force
   ```

4. Committer et pousser le code source correspondant sur `main` comme
   d'habitude (`git push origin main`).
5. Lien de téléchargement direct pour une installation manuelle :
   `https://frakaprod.github.io/msam/updates/MSAM%20Setup%20<version>.exe`
   (peut prendre 1-2 min après le push pour se mettre à jour, le temps que
   GitHub Pages rebuild).

Les MSAM déjà installés détecteront automatiquement la nouvelle version au
prochain lancement (ils comparent leur version locale à celle indiquée dans
`updates/latest.yml`).

## Limite à surveiller

GitHub refuse les fichiers de plus de 100 Mio dans un push classique.
L'installeur actuel fait ~95 Mio — encore sous la limite, mais à surveiller
si l'appli grossit. Le jour où ça dépasse, il faudra passer par Git LFS ou
un autre hébergeur pour les binaires. Garder seulement 2 versions dans
`updates/` limite aussi la taille de la branche `releases` dans le temps
(elle ne grossit pas indéfiniment, elle "glisse").
