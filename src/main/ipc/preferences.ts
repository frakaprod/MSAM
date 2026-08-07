import { ipcMain } from 'electron'
import { getPreferences, updatePreferences } from '../preferencesRepository'
import type { PreferencesUpdateInput } from '../../shared/types'

export function registerPreferencesIpc(): void {
  ipcMain.handle('preferences:get', () => {
    return getPreferences()
  })

  ipcMain.handle('preferences:update', (_event, input: PreferencesUpdateInput) => {
    return updatePreferences(input)
  })

  // Version synchrone utilisée une seule fois au tout démarrage du renderer
  // (main.tsx), avant le premier rendu React, pour appliquer le thème sans
  // flash clair->sombre le temps qu'un appel async aille-et-revienne.
  ipcMain.on('preferences:get-sync', (event) => {
    event.returnValue = getPreferences()
  })
}
