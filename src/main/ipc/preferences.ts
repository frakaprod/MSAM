import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import type { OpenDialogOptions } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { getPreferences, updatePreferences } from '../preferencesRepository'
import type { PreferencesUpdateInput } from '../../shared/types'

export function registerPreferencesIpc(): void {
  ipcMain.handle('preferences:get', () => {
    return getPreferences()
  })

  ipcMain.handle('preferences:update', (_event, input: PreferencesUpdateInput) => {
    return updatePreferences(input)
  })

  // Ouvre le sélecteur de dossier natif de Windows pour choisir où enregistrer
  // les PDF générés (factures/devis/relevés). Retourne null si annulé.
  ipcMain.handle('preferences:chooseExportsFolder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const current = getPreferences().dossierExports
    const options: OpenDialogOptions = {
      title: 'Choisir le dossier des documents générés',
      defaultPath: current ?? undefined,
      properties: ['openDirectory', 'createDirectory']
    }
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return null
    // Le dossier choisi devient le parent : MSAM range toujours ses
    // documents dans un sous-dossier "MSAM" dédié à l'intérieur, pour ne
    // jamais mélanger avec d'autres fichiers déjà présents dans le dossier
    // sélectionné par l'utilisateur.
    const dossierExports = join(result.filePaths[0], 'MSAM')
    return updatePreferences({ dossierExports })
  })

  ipcMain.handle('preferences:openExportsFolder', () => {
    const folder = getPreferences().dossierExports
    if (!folder) return false
    if (!existsSync(folder)) {
      mkdirSync(folder, { recursive: true })
    }
    shell.openPath(folder)
    return true
  })

  // Version synchrone utilisée une seule fois au tout démarrage du renderer
  // (main.tsx), avant le premier rendu React, pour appliquer le thème sans
  // flash clair->sombre le temps qu'un appel async aille-et-revienne.
  ipcMain.on('preferences:get-sync', (event) => {
    event.returnValue = getPreferences()
  })
}
