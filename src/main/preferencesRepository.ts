import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { getData, persist } from './store'
import { EXPORT_SUBFOLDERS } from '../shared/exportFolders'
import type { Preferences, PreferencesUpdateInput } from '../shared/types'

// Garantit que le dossier des documents générés et ses 4 sous-dossiers fixes
// (Factures émises, Factures fournisseurs, Devis, Relevés paiements)
// existent bien. Appelé à chaque lecture/écriture des préférences : coût
// négligeable (quelques existsSync), et ça permet de recréer les dossiers
// tout seul si l'utilisateur en a supprimé un par erreur.
function ensureExportFolders(baseDir: string): void {
  if (!existsSync(baseDir)) {
    mkdirSync(baseDir, { recursive: true })
  }
  for (const subfolder of Object.values(EXPORT_SUBFOLDERS)) {
    const dir = join(baseDir, subfolder)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }
}

export function getPreferences(): Preferences {
  const data = getData()
  // Calculé une seule fois, au premier accès (app.getPath n'est utilisable
  // qu'une fois l'app "ready", donc pas faisable comme valeur par défaut
  // statique dans store.ts).
  if (!data.preferences.dossierExports) {
    data.preferences.dossierExports = join(app.getPath('documents'), 'MSAM')
    persist()
  }
  ensureExportFolders(data.preferences.dossierExports)
  return data.preferences
}

export function updatePreferences(input: PreferencesUpdateInput): Preferences {
  const data = getData()
  data.preferences = { ...data.preferences, ...input }
  persist()
  if (data.preferences.dossierExports) {
    ensureExportFolders(data.preferences.dossierExports)
  }
  return data.preferences
}
