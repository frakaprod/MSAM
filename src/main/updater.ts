// Mise à jour automatique de MSAM via Git : au lancement, on compare le
// commit local au commit le plus récent du dépôt GitHub public
// (github.com/frakaprod/msam, branche "main"). S'ils diffèrent, on propose
// à l'utilisateur de mettre à jour ; s'il accepte, on récupère le nouveau
// code, on réinstalle les dépendances si besoin, on reconstruit l'appli et
// on la relance automatiquement.
//
// Ne s'active que si le dossier de l'appli est un vrai dépôt Git (donc pas
// pour une installation encore faite à partir d'un simple zip) et que Git
// est disponible sur la machine — sinon, silencieux (juste loggé), pour ne
// jamais bloquer un lancement normal.

import { app, BrowserWindow, dialog } from 'electron'
import { execFile } from 'child_process'

const GIT_REMOTE_URL = 'https://github.com/frakaprod/msam.git'
const GIT_BRANCH = 'main'

// NB : toute erreur de mise à jour est loguée via console.error, visible
// dans la fenêtre noire ouverte par "Lancer MSAM.bat".

function run(cmd: string, args: string[], cwd: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { cwd, timeout: timeoutMs, windowsHide: true, maxBuffer: 1024 * 1024 * 50, shell: true },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`${cmd} ${args.join(' ')} : ${stderr || err.message}`))
          return
        }
        resolve(stdout)
      }
    )
  })
}

async function isGitRepo(dir: string): Promise<boolean> {
  try {
    await run('git', ['rev-parse', '--is-inside-work-tree'], dir, 10_000)
    return true
  } catch {
    return false
  }
}

/**
 * Point d'entrée appelé au démarrage. Ne fait jamais planter/bloquer le
 * lancement de l'appli : toute erreur (pas de Git, pas de réseau, dépôt pas
 * encore migré...) est simplement loggée et on continue normalement.
 */
export async function checkForUpdates(): Promise<void> {
  const appPath = app.getAppPath()

  if (!(await isGitRepo(appPath))) {
    console.log('[MSAM] Dossier pas encore lié à Git, mise à jour automatique ignorée.')
    return
  }

  try {
    await run('git', ['remote', 'set-url', 'origin', GIT_REMOTE_URL], appPath, 10_000).catch(() => {})
    await run('git', ['fetch', 'origin', GIT_BRANCH, '--quiet'], appPath, 30_000)
  } catch (err) {
    console.error('[MSAM] Vérification des mises à jour impossible (pas de connexion ?) :', err)
    return
  }

  let local: string
  let remote: string
  try {
    local = (await run('git', ['rev-parse', 'HEAD'], appPath, 10_000)).trim()
    remote = (await run('git', ['rev-parse', `origin/${GIT_BRANCH}`], appPath, 10_000)).trim()
  } catch (err) {
    console.error('[MSAM] Impossible de comparer les versions :', err)
    return
  }

  if (local === remote) {
    console.log('[MSAM] Déjà à jour.')
    return
  }

  // Ne propose une mise à jour que si origin/main est réellement en avance
  // sur le commit local (fast-forward possible) — pas si le local a divergé
  // ou est lui-même en avance (ex : pendant le développement de MSAM), pour
  // ne jamais proposer un "reset" qui ferait perdre des commits locaux.
  try {
    await run('git', ['merge-base', '--is-ancestor', 'HEAD', `origin/${GIT_BRANCH}`], appPath, 10_000)
  } catch {
    console.log('[MSAM] Version locale différente mais pas "en retard" sur origin/main, on ignore.')
    return
  }

  const choice = await dialog.showMessageBox({
    type: 'info',
    title: 'MSAM',
    message: 'Une mise à jour est disponible',
    detail: 'Allez. Dépêches toi de la faire !',
    buttons: ['Mettre à jour', 'Plus tard'],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  })

  if (choice.response !== 0) {
    console.log('[MSAM] Mise à jour reportée par l\'utilisateur.')
    return
  }

  await applyUpdate(appPath)
}

async function applyUpdate(appPath: string): Promise<void> {
  const updateWin = new BrowserWindow({
    width: 420,
    height: 220,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'Mise à jour de MSAM',
    autoHideMenuBar: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  })
  await updateWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(UPDATE_HTML)}`)

  async function setStatus(text: string): Promise<void> {
    await updateWin.webContents
      .executeJavaScript(`document.getElementById('status').textContent = ${JSON.stringify(text)}`)
      .catch(() => {})
  }

  try {
    await setStatus('Téléchargement de la mise à jour...')
    // reset --hard plutôt que pull : le dossier de l'appli ne doit jamais
    // avoir de modifications locales (les données utilisateur vivent
    // ailleurs, dans AppData), donc pas de fusion à gérer, juste aligner sur
    // la dernière version publiée.
    await run('git', ['fetch', 'origin', GIT_BRANCH, '--quiet'], appPath, 30_000)
    await run('git', ['reset', '--hard', `origin/${GIT_BRANCH}`], appPath, 30_000)

    await setStatus('Installation des dépendances...')
    await run('npm', ['install'], appPath, 10 * 60_000)

    await setStatus("Construction de l'application...")
    await run('npm', ['run', 'build'], appPath, 5 * 60_000)

    await setStatus('Redémarrage de MSAM...')
    setTimeout(() => {
      app.relaunch()
      app.exit(0)
    }, 600)
  } catch (err) {
    console.error('[MSAM] Échec de la mise à jour :', err)
    await setStatus('Échec de la mise à jour. Vérifie ta connexion et relance MSAM.')
    setTimeout(() => {
      if (!updateWin.isDestroyed()) updateWin.close()
    }, 5000)
  }
}

const UPDATE_HTML = `<!doctype html>
<html>
<head><meta charset="utf-8" />
<style>
  body { font-family: system-ui, -apple-system, sans-serif; background:#0f172a; color:#e2e8f0; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
  .box { text-align:center; padding: 0 24px; }
  .spinner { width:32px;height:32px;border:3px solid #334155;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  p { font-size:14px; }
  small { color:#94a3b8; }
</style></head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <p id="status">Préparation de la mise à jour...</p>
    <small>Ne ferme pas cette fenêtre.</small>
  </div>
</body>
</html>`
