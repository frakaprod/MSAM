import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import type { OpenDialogOptions } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { basename, join } from 'path'
import { ensureExportFoldersOrError, getPreferences, updatePreferences } from '../preferencesRepository'
import { migrateExportFolders } from '../exportMigration'
import type { PreferencesUpdateInput } from '../../shared/types'

export function registerPreferencesIpc(): void {
  ipcMain.handle('preferences:get', () => {
    return getPreferences()
  })

  ipcMain.handle('preferences:update', (_event, input: PreferencesUpdateInput) => {
    return updatePreferences(input)
  })

  // Ouvre le sélecteur de dossier natif de Windows pour choisir où enregistrer
  // les documents générés (factures/devis/relevés). Retourne null si annulé,
  // sinon les préférences à jour + un message d'erreur si la création des
  // sous-dossiers a échoué (droits d'accès, chemin invalide...) — jamais une
  // promesse rejetée en silence côté renderer.
  ipcMain.handle('preferences:chooseExportsFolder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const previous = getPreferences().dossierExports
    const options: OpenDialogOptions = {
      title: 'Choisir le dossier des documents générés',
      defaultPath: previous ?? undefined,
      // 'createDirectory' (création de dossier depuis la boîte de dialogue)
      // n'existe que sur macOS ; son équivalent Windows/Linux est
      // 'promptToCreate'. On met les deux pour couvrir toutes les plateformes.
      properties: ['openDirectory', 'createDirectory', 'promptToCreate']
    }
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options)
    if (result.canceled || result.filePaths.length === 0) return null

    const picked = result.filePaths[0]
    // Si le dossier choisi s'appelle déjà "MSAM" (l'utilisateur re-sélectionne
    // un dossier MSAM existant), on l'utilise tel quel plutôt que d'imbriquer
    // un second niveau "MSAM/MSAM".
    const dossierExports = basename(picked).toLowerCase() === 'msam' ? picked : join(picked, 'MSAM')

    const preferences = updatePreferences({ dossierExports })
    const error = ensureExportFoldersOrError(dossierExports)

    // Si l'utilisateur avait déjà des documents enregistrés dans l'ancien
    // dossier, on les transfère automatiquement vers le nouveau : changer de
    // dossier ne doit jamais "abandonner" des documents déjà générés.
    let migration: { movedCount: number; errors: string[] } | null = null
    if (!error && previous) {
      migration = migrateExportFolders(previous, dossierExports)
    }

    return { preferences, error, migration }
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
