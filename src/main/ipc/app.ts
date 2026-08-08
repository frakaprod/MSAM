import { app, ipcMain } from 'electron'

// Expose la version de l'appli (issue de package.json / injectée par
// electron-builder à l'installation) pour affichage dans Préférences.
export function registerAppIpc(): void {
  ipcMain.handle('app:getVersion', () => app.getVersion())
}
