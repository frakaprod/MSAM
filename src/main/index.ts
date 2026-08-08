import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from './utils/is'
import { registerClientsIpc } from './ipc/clients'
import { registerProjectsIpc } from './ipc/projects'
import { registerEventsIpc } from './ipc/events'
import { registerBillingProfilesIpc } from './ipc/billingProfiles'
import { registerDocumentsIpc } from './ipc/documents'
import { registerSupplierInvoicesIpc } from './ipc/supplierInvoices'
import { registerPaymentsIpc } from './ipc/payments'
import { registerPreferencesIpc } from './ipc/preferences'
import { registerPdfIpc } from './ipc/pdf'
import { registerAttachmentsIpc } from './ipc/attachments'
import { checkForUpdates } from './updater'
import { normalizeExportFolder } from './preferencesRepository'
import { persist } from './store'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: 'MSAM — Ma Secrétaire à Moi',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerClientsIpc()
  registerProjectsIpc()
  registerEventsIpc()
  registerBillingProfilesIpc()
  registerDocumentsIpc()
  registerSupplierInvoicesIpc()
  registerPaymentsIpc()
  registerPreferencesIpc()
  registerPdfIpc()
  registerAttachmentsIpc()

  // Corrige une fois pour toutes un ancien dossier de documents qui ne
  // respecterait pas la règle "toujours dans un sous-dossier MSAM dédié"
  // (réglage hérité d'une version antérieure de l'appli) — avant l'ouverture
  // de la fenêtre, pour que Préférences affiche déjà le bon chemin.
  normalizeExportFolder()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Vérification des mises à jour en tâche de fond : ne bloque jamais
  // l'ouverture de la fenêtre principale (cf. updater.ts pour le détail).
  // Pas en mode dev (electron-vite dev), pour ne pas gêner le développement.
  if (!is.dev) {
    checkForUpdates()
  }
})

app.on('window-all-closed', () => {
  persist()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
