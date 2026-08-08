import { app } from 'electron'
import { basename, join } from 'path'
import { existsSync, mkdirSync, rmdirSync } from 'fs'
import { getData, persist } from './store'
import { EXPORT_SUBFOLDERS } from '../shared/exportFolders'
import { deleteOldExportFolder, migrateExportFolders } from './exportMigration'
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

/**
 * Corrige automatiquement, une fois au démarrage, un dossier de documents
 * enregistré AVANT que la règle "toujours dans un sous-dossier MSAM dédié"
 * n'existe (ex. réglage datant d'une version antérieure de l'appli) : sans
 * ça, les factures/devis se retrouveraient mélangés directement dans le
 * dossier choisi (ex. "Documents") au lieu d'un sous-dossier "MSAM" dédié.
 *
 * Ne fait rien si le dossier actuel est déjà correct (cas normal, immense
 * majorité des lancements). Sinon, transfère les documents déjà présents
 * vers le nouveau dossier "…/MSAM", comme un changement de dossier manuel.
 */
export function normalizeExportFolder(): void {
  const data = getData()
  const current = data.preferences.dossierExports
  if (!current) return // sera initialisé au premier getPreferences()
  if (basename(current).toLowerCase() === 'msam') return // déjà correct

  const corrected = join(current, 'MSAM')
  const error = ensureExportFoldersOrError(corrected)
  if (error) {
    console.error(
      '[MSAM] Impossible de corriger le dossier des documents (ancien format sans "MSAM") :',
      current,
      error
    )
    return
  }

  const migration = migrateExportFolders(current, corrected)
  if (migration.errors.length > 0) {
    console.error(
      "[MSAM] Certains documents n'ont pas pu être transférés lors de la correction automatique du dossier :",
      migration.errors
    )
  }
  // deleteOldExportFolder refuse par sécurité de supprimer "current" ici (il
  // ne s'appelle pas "MSAM", et "corrected" est justement À L'INTÉRIEUR de
  // "current") : c'est voulu, "current" peut être un dossier partagé
  // (ex. "Documents") qu'il ne faut jamais supprimer. On nettoie seulement
  // les 4 sous-dossiers qu'on gère explicitement, s'ils sont vides.
  deleteOldExportFolder(current, corrected)
  for (const subfolder of Object.values(EXPORT_SUBFOLDERS)) {
    try {
      rmdirSync(join(current, subfolder))
    } catch {
      // pas vide (transfert partiel) ou déjà absent : on laisse tel quel
    }
  }

  data.preferences.dossierExports = corrected
  persist()
  console.log('[MSAM] Dossier des documents corrigé automatiquement :', current, '->', corrected)
}
