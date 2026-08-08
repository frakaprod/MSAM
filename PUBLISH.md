# Publier une mise à jour MSAM

Notes internes (pas pour l'utilisateur final) : comment publier une nouvelle
version pour que les MSAM déjà installés la détectent automatiquement.

Le système de mise à jour utilise le provider "generic" d'electron-updater,
qui lit un fichier `latest.yml` + l'installeur sur une simple URL HTTP — pas
besoin de l'API GitHub (Releases), qui n'est pas accessible depuis certains
environnements. On sert ces fichiers directement depuis le dépôt Git, via
`raw.githubusercontent.com`, sur une branche dédiée `releases` (pour ne pas
faire grossir l'historique de `main` avec de gros binaires).

## Étapes

1. Mettre à jour `version` dans `package.json` (obligatoire : electron-updater
   compare les numéros de version, pas les dates).
2. `npm run package:win` → génère `release/MSAM Setup <version>.exe`,
   `release/latest.yml`, `release/*.blockmap`.
3. Publier sur la branche `releases` (réécrite à chaque fois, un seul commit,
   pour ne jamais accumuler les anciens binaires dans l'historique) :

   ```bash
   rm -rf /tmp/msam-releases-branch
   git worktree add /tmp/msam-releases-branch --detach
   cd /tmp/msam-releases-branch
   git checkout --orphan releases
   git rm -rf . >/dev/null 2>&1 || true
   mkdir -p updates
   cp "/home/claude/msam/release/MSAM Setup <version>.exe" updates/
   cp /home/claude/msam/release/latest.yml updates/
   cp /home/claude/msam/release/*.blockmap updates/
   git add updates
   git commit -m "Release <version>"
   git push --force origin releases
   cd /home/claude/msam
   git worktree remove /tmp/msam-releases-branch --force
   ```

4. Committer et pousser le code source correspondant sur `main` comme
   d'habitude (`git push origin main`).
5. Lien de téléchargement direct pour une installation manuelle :
   `https://raw.githubusercontent.com/frakaprod/msam/releases/updates/MSAM%20Setup%20<version>.exe`

Les MSAM déjà installés détecteront automatiquement la nouvelle version au
prochain lancement (ils comparent leur version locale à celle indiquée dans
`updates/latest.yml`).

## Limite à surveiller

GitHub refuse les fichiers de plus de 100 Mio dans un push classique.
L'installeur actuel fait ~95 Mio — encore sous la limite, mais à surveiller
si l'appli grossit. Le jour où ça dépasse, il faudra passer par Git LFS ou
un autre hébergeur pour les binaires.
