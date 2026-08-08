import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import type { OpenDialogOptions } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { basename, join } from 'path'
import { ensureExportFoldersOrError, getPreferences, updatePreferences } from '../preferencesRepository'
import { deleteOldExportFolder, migrateExportFolders } from '../exportMigration'
import type { Preferences, PreferencesUpdateInput } from '../../shared/types'

export interface ApplyExportsFolderResult {
  preferences: Preferences
  error: string | null
  migration: { movedCount: number; errors: string[] } | null
  oldFolderDeleted: boolean
}

/** Dossier créé par défaut à l'installation (Documents\MSAM de Windows). */
function defaultExportsFolder(): string {
  return join(app.getPath('documents'), 'MSAM')
}

/**
 * Bascule le dossier des documents générés vers `picked` : crée le nouveau
 * dossier "MSAM" + ses 4 sous-dossiers, transfère automatiquement les
 * documents déjà présents dans l'ancien dossier, puis supprime l'ancien
 * dossier (devenu inutile) une fois le transfert entièrement réussi. Utilisée
 * à la fois pour un dossier choisi manuellement et pour "revenir au dossier
 * par défaut".
 */
function applyExportsFolder(picked: string): ApplyExportsFolderResult {
  const previous = getPreferences().dossierExports
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
  let oldFolderDeleted = false
  if (!error && previous && previous !== dossierExports) {
    migration = migrateExportFolders(previous, dossierExports)
    // L'ancien dossier MSAM n'a plus d'utilité une fois tout transféré : on
    // le supprime, mais seulement si le transfert s'est fait sans la moindre
    // erreur (sinon on risquerait de supprimer des documents pas encore
    // déplacés).
    if (migration.errors.length === 0) {
      const deleteError = deleteOldExportFolder(previous, dossierExports)
      oldFolderDeleted = !deleteError
      if (deleteError) {
        console.error(
          "[MSAM] Impossible de supprimer l'ancien dossier des documents :",
          previous,
          deleteError
        )
      }
    }
  }

  return { preferences, error, migration, oldFolderDeleted }
}

export function registerPreferencesIpc(): void {
  ipcMain.handle('preferences:get', () => {
    return getPreferences()
  })

  ipcMain.handle('preferences:update', (_event, input: PreferencesUpdateInput) => {
    return updatePreferences(input)
  })

  // Chemin du dossier créé par défaut à l'installation (Documents\MSAM),
  // affiché en info dans Préférences même si l'utilisateur a choisi un autre
  // dossier depuis — pratique s'il veut savoir où il est ou y revenir.
  ipcMain.handle('preferences:getDefaultExportsFolder', () => {
    return defaultExportsFolder()
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

    return applyExportsFolder(result.filePaths[0])
  })

  // Revient (ou bascule) directement vers le dossier par défaut, sans passer
  // par le sélecteur — même logique de transfert + suppression de l'ancien
  // dossier que "chooseExportsFolder".
  ipcMain.handle('preferences:useDefaultExportsFolder', () => {
    return applyExportsFolder(defaultExportsFolder())
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
