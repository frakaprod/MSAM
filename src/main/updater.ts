// Mise à jour automatique de MSAM via les Releases GitHub (dépôt public
// github.com/frakaprod/msam). À chaque lancement, electron-updater compare la
// version installée à la dernière version publiée ; si une nouvelle version
// existe, on propose à l'utilisateur de l'installer via une fenêtre habillée
// aux couleurs de MSAM (pas la boîte de dialogue grise de Windows), modale
// (bloque l'appli tant qu'on n'a pas choisi) et toujours au premier plan.
//
// Le dépôt étant public, aucune authentification n'est nécessaire côté
// utilisateur : c'est un simple téléchargement, comme visiter une page web.
// Ne s'active que sur une version installée (via le setup.exe) — jamais en
// développement.

import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { join } from 'path'
import pkg from 'electron-updater'
import { getPreferences } from './preferencesRepository'
const { autoUpdater } = pkg

let checking = false

function resolveEffectiveTheme(): 'clair' | 'sombre' {
  const { theme } = getPreferences()
  if (theme === 'systeme') return nativeTheme.shouldUseDarkColors ? 'sombre' : 'clair'
  return theme
}

// Palette reprise de src/renderer/src/assets/main.css (couleurs "brand" et
// "slate" de Tailwind) pour que ces fenêtres se fondent avec le reste de
// l'appli plutôt que d'avoir un style Windows générique.
function palette(theme: 'clair' | 'sombre'): {
  bg: string
  card: string
  text: string
  textMuted: string
  border: string
} {
  return theme === 'sombre'
    ? { bg: '#0f172a', card: '#1e293b', text: '#f1f5f9', textMuted: '#94a3b8', border: '#334155' }
    : { bg: '#f8fafc', card: '#ffffff', text: '#0f172a', textMuted: '#64748b', border: '#e2e8f0' }
}

const FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

function baseStyles(theme: 'clair' | 'sombre'): string {
  const p = palette(theme)
  return `
    * { box-sizing: border-box; }
    body {
      margin: 0; height: 100vh; display: flex; align-items: center; justify-content: center;
      font-family: ${FONT_STACK}; background: ${p.bg}; color: ${p.text};
      -webkit-user-select: none; user-select: none;
    }
    .card { text-align: center; padding: 28px 26px; width: 100%; }
    h1 { font-size: 16px; font-weight: 600; margin: 0 0 6px; }
    p { font-size: 13px; color: ${p.textMuted}; margin: 0 0 20px; line-height: 1.5; }
  `
}

/**
 * Point d'entrée appelé au démarrage. Ne fait jamais planter/bloquer le
 * lancement de l'appli : toute erreur (pas de connexion, dépôt inaccessible...)
 * est simplement loguée et on continue normalement.
 */
export function checkForUpdates(parentWindow: BrowserWindow | null): void {
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
    const choice = await showChoiceDialog(parentWindow)

    if (choice !== 'update') {
      console.log("[MSAM] Mise à jour reportée par l'utilisateur.")
      return
    }

    await applyUpdate(parentWindow)
  })

  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[MSAM] Vérification des mises à jour impossible :', err)
  })
}

/**
 * Fenêtre de choix "Mettre à jour" / "Plus tard" : habillée aux couleurs de
 * MSAM (selon le thème choisi par l'utilisateur), modale par rapport à la
 * fenêtre principale (bloque l'appli tant qu'aucun choix n'est fait) et
 * toujours ramenée au premier plan. Fermer la fenêtre (croix) équivaut à
 * "Plus tard", jamais un blocage silencieux.
 */
function showChoiceDialog(parentWindow: BrowserWindow | null): Promise<'update' | 'later'> {
  const theme = resolveEffectiveTheme()
  const p = palette(theme)

  return new Promise((resolve) => {
    let resolved = false
    const win = new BrowserWindow({
      width: 440,
      height: 232,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      autoHideMenuBar: true,
      title: 'MSAM',
      backgroundColor: p.bg,
      show: false,
      parent: parentWindow ?? undefined,
      modal: parentWindow != null,
      webPreferences: {
        preload: join(__dirname, '../preload/updateDialog.js'),
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    const channel = 'update-dialog:choice'
    const onChoice = (_event: Electron.IpcMainEvent, value: 'update' | 'later'): void => {
      if (resolved) return
      resolved = true
      resolve(value)
      if (!win.isDestroyed()) win.close()
    }
    ipcMain.once(channel, onChoice)

    win.on('closed', () => {
      if (!resolved) {
        resolved = true
        ipcMain.removeListener(channel, onChoice)
        resolve('later')
      }
    })

    win.once('ready-to-show', () => {
      win.show()
      win.focus()
      parentWindow?.moveTop()
    })

    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(choiceHtml(theme))}`)
  })
}

function choiceHtml(theme: 'clair' | 'sombre'): string {
  const p = palette(theme)
  return `<!doctype html>
<html>
<head><meta charset="utf-8" />
<style>
  ${baseStyles(theme)}
  .actions { display: flex; gap: 10px; justify-content: center; }
  button {
    font-family: ${FONT_STACK}; font-size: 13px; font-weight: 600; border-radius: 8px;
    padding: 9px 18px; cursor: pointer; border: 1px solid transparent; transition: opacity 0.15s;
  }
  button:hover { opacity: 0.9; }
  .btn-primary { background: #4f5eff; color: #ffffff; }
  .btn-secondary { background: transparent; color: ${p.text}; border-color: ${p.border}; }
</style></head>
<body>
  <div class="card">
    <h1>Une mise à jour est disponible</h1>
    <p>Allez. Dépêches toi de la faire !</p>
    <div class="actions">
      <button class="btn-secondary" id="btn-later">Plus tard</button>
      <button class="btn-primary" id="btn-update">Mettre à jour</button>
    </div>
  </div>
  <script>
    document.getElementById('btn-update').addEventListener('click', () => window.updateDialogApi.choose('update'))
    document.getElementById('btn-later').addEventListener('click', () => window.updateDialogApi.choose('later'))
  </script>
</body>
</html>`
}

async function applyUpdate(parentWindow: BrowserWindow | null): Promise<void> {
  const theme = resolveEffectiveTheme()
  const p = palette(theme)

  const updateWin = new BrowserWindow({
    width: 420,
    height: 220,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    closable: false,
    title: 'Mise à jour de MSAM',
    autoHideMenuBar: true,
    backgroundColor: p.bg,
    show: false,
    parent: parentWindow ?? undefined,
    modal: parentWindow != null,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  })

  updateWin.once('ready-to-show', () => {
    updateWin.show()
    updateWin.focus()
  })

  await updateWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(progressHtml(theme))}`)

  async function setStatus(text: string): Promise<void> {
    await updateWin.webContents
      .executeJavaScript(`document.getElementById('status').textContent = ${JSON.stringify(text)}`)
      .catch(() => {})
  }

  try {
    await setStatus('Téléchargement de la mise à jour...')

    autoUpdater.on('download-progress', (progress) => {
      setStatus(`Téléchargement de la mise à jour... ${Math.round(progress.percent)}%`)
    })

    autoUpdater.on('error', (err) => {
      console.error('[MSAM] Échec de la mise à jour :', err)
      setStatus('Échec de la mise à jour. Vérifie ta connexion et relance MSAM.')
      setTimeout(() => {
        if (!updateWin.isDestroyed()) updateWin.destroy()
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

    await autoUpdater.downloadUpdate()
  } catch (err) {
    console.error('[MSAM] Échec du téléchargement de la mise à jour :', err)
    await setStatus('Échec de la mise à jour. Vérifie ta connexion et relance MSAM.')
    setTimeout(() => {
      if (!updateWin.isDestroyed()) updateWin.destroy()
    }, 5000)
  }
}

function progressHtml(theme: 'clair' | 'sombre'): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8" />
<style>
  ${baseStyles(theme)}
  .spinner {
    width: 30px; height: 30px; border: 3px solid ${palette(theme).border};
    border-top-color: #4f5eff; border-radius: 50%; animation: spin 0.8s linear infinite;
    margin: 0 auto 18px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  small { color: ${palette(theme).textMuted}; font-size: 11px; }
</style></head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <p id="status" style="margin-bottom: 8px;">Préparation de la mise à jour...</p>
    <small>Ne ferme pas cette fenêtre.</small>
  </div>
</body>
</html>`
}
