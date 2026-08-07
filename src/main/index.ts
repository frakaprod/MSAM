import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from './utils/is'
import { registerClientsIpc } from './ipc/clients'
import { registerProjectsIpc } from './ipc/projects'
import { registerEventsIpc } from './ipc/events'
import { registerBillingProfilesIpc } from './ipc/billingProfiles'
import { registerDocumentsIpc } from './ipc/documents'
import { registerPaymentsIpc } from './ipc/payments'
import { registerPreferencesIpc } from './ipc/preferences'
import { registerPdfIpc } from './ipc/pdf'
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
  registerPaymentsIpc()
  registerPreferencesIpc()
  registerPdfIpc()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  persist()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
