import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { getData, persist } from './store'
import { EXPORT_SUBFOLDERS } from '../shared/exportFolders'
import type { Preferences, PreferencesUpdateInput } from '../shared/types'

// Garantit que le dossier des documents générés et ses 4 sous-dossiers fixes
// (Factures émises, Factures fournisseurs, Devis, Relevés paiements)
// existent bien. Peut échouer (droits d'accès, chemin invalide, disque
// réseau indisponible...) : on laisse volontairement remonter l'erreur pour
// que l'appelant décide quoi en faire (silencieux + log au démarrage,
// remonté à l'écran quand l'utilisateur vient de choisir le dossier).
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

/**
 * Variante qui ne fait jamais planter l'appelant : logue l'erreur (visible
 * dans la fenêtre noire ouverte par "Lancer MSAM.bat") et retourne un
 * message si la création a échoué, null si tout va bien.
 */
export function ensureExportFoldersOrError(baseDir: string): string | null {
  try {
    ensureExportFolders(baseDir)
    return null
  } catch (err) {
    console.error('[MSAM] Impossible de créer le dossier des documents générés :', baseDir, err)
    return err instanceof Error
      ? err.message
      : "Impossible de créer le dossier choisi (vérifie les droits d'accès)."
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
  // Silencieux ici (juste loggé) : on ne veut pas qu'une simple lecture des
  // préférences (appelée très souvent) fasse planter l'IPC si le dossier
  // est momentanément inaccessible.
  ensureExportFoldersOrError(data.preferences.dossierExports)
  return data.preferences
}

export function updatePreferences(input: PreferencesUpdateInput): Preferences {
  const data = getData()
  data.preferences = { ...data.preferences, ...input }
  persist()
  return data.preferences
}
