// Mise à jour automatique de MSAM via les Releases GitHub (dépôt public
// github.com/frakaprod/msam). À chaque lancement, electron-updater compare la
// version installée à la dernière Release publiée ; si une nouvelle version
// existe, on propose à l'utilisateur de l'installer (téléchargement +
// installation silencieuse + redémarrage automatique).
//
// Le dépôt étant public, aucune authentification n'est nécessaire côté
// utilisateur : c'est un simple téléchargement, comme visiter une page web.
// Ne s'active que sur une version installée (via l'exécutable NSIS) — jamais
// en développement.

import { app, BrowserWindow, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'

let checking = false

/**
 * Point d'entrée appelé au démarrage. Ne fait jamais planter/bloquer le
 * lancement de l'appli : toute erreur (pas de réseau, dépôt inaccessible...)
 * est simplement loguée et on continue normalement.
 */
export function checkForUpdates(): void {
  if (checking) return
  checking = true

  // electron-updater ne fonctionne que sur une version "packagée" (installée
  // via le setup.exe, avec app-update.yml généré par electron-builder) — pas
  // en dev.
  if (!app.isPackaged) {
    console.log('[MSAM] Mise à jour automatique ignorée (appli non installée).')
    return
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('error', (err) => {
    console.error('[MSAM] Vérification des mises à jour impossible (pas de connexion ?) :', err)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[MSAM] Déjà à jour.')
  })

  autoUpdater.on('update-available', async (info) => {
    console.log('[MSAM] Mise à jour disponible :', info.version)
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
      console.log("[MSAM] Mise à jour reportée par l'utilisateur.")
      return
    }

    await applyUpdate()
  })

  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[MSAM] Vérification des mises à jour impossible :', err)
  })
}

async function applyUpdate(): Promise<void> {
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

  await setStatus('Téléchargement de la mise à jour...')

  autoUpdater.on('download-progress', (progress) => {
    setStatus(`Téléchargement de la mise à jour... ${Math.round(progress.percent)}%`)
  })

  autoUpdater.on('error', (err) => {
    console.error('[MSAM] Échec de la mise à jour :', err)
    setStatus('Échec de la mise à jour. Vérifie ta connexion et relance MSAM.')
    setTimeout(() => {
      if (!updateWin.isDestroyed()) updateWin.close()
    }, 5000)
  })

  autoUpdater.on('update-downloaded', () => {
    setStatus('Redémarrage de MSAM...')
    setTimeout(() => {
      // isSilent : installation sans fenêtre NSIS visible ;
      // isForceRunAfter : relance MSAM automatiquement une fois installé.
      autoUpdater.quitAndInstall(true, true)
    }, 600)
  })

  try {
    await autoUpdater.downloadUpdate()
  } catch (err) {
    console.error('[MSAM] Échec du téléchargement de la mise à jour :', err)
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
