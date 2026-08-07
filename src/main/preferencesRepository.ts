import { app } from 'electron'
import { join } from 'path'
import { getData, persist } from './store'
import type { Preferences, PreferencesUpdateInput } from '../shared/types'

export function getPreferences(): Preferences {
  const data = getData()
  // Calculé une seule fois, au premier accès (app.getPath n'est utilisable
  // qu'une fois l'app "ready", donc pas faisable comme valeur par défaut
  // statique dans store.ts).
  if (!data.preferences.dossierExports) {
    data.preferences.dossierExports = join(app.getPath('documents'), 'MSAM')
    persist()
  }
  return data.preferences
}

export function updatePreferences(input: PreferencesUpdateInput): Preferences {
  const data = getData()
  data.preferences = { ...data.preferences, ...input }
  persist()
  return data.preferences
}
