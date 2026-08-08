import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'
import { EXPORT_SUBFOLDERS } from '../shared/exportFolders'

export interface MigrationResult {
  movedCount: number
  errors: string[]
}

/**
 * Transfère tous les documents déjà générés/importés (factures, devis,
 * relevés, pièces jointes fournisseurs) de l'ancien dossier des documents
 * vers le nouveau, quand l'utilisateur change ce dossier dans Préférences
 * après avoir déjà commencé à s'en servir. Sans ça, changer de dossier
 * "abandonnerait" silencieusement tous les documents déjà enregistrés dans
 * l'ancien emplacement.
 *
 * Renomme (déplace) chaque fichier des 4 sous-dossiers fixes ; si l'ancien
 * et le nouveau dossier ne sont pas sur le même disque (rename impossible,
 * erreur EXDEV), bascule sur une copie + suppression de l'original. Un
 * fichier de même nom déjà présent dans le nouveau dossier est écrasé (même
 * logique que l'enregistrement normal des documents : le plus récent fait
 * foi). N'échoue jamais globalement : les erreurs par fichier sont
 * collectées et retournées plutôt que de stopper la migration en cours de
 * route.
 */
export function migrateExportFolders(oldBaseDir: string, newBaseDir: string): MigrationResult {
  const result: MigrationResult = { movedCount: 0, errors: [] }

  if (!oldBaseDir || !newBaseDir || oldBaseDir === newBaseDir) return result
  if (!existsSync(oldBaseDir)) return result

  for (const subfolder of Object.values(EXPORT_SUBFOLDERS)) {
    const oldDir = join(oldBaseDir, subfolder)
    if (!existsSync(oldDir)) continue

    const newDir = join(newBaseDir, subfolder)
    if (!existsSync(newDir)) {
      mkdirSync(newDir, { recursive: true })
    }

    let entries: string[]
    try {
      entries = readdirSync(oldDir)
    } catch (err) {
      result.errors.push(`Lecture du dossier "${subfolder}" impossible : ${errorMessage(err)}`)
      continue
    }

    for (const name of entries) {
      const oldPath = join(oldDir, name)
      const newPath = join(newDir, name)
      try {
        if (statSync(oldPath).isDirectory()) continue // pas de sous-dossiers attendus ici

        try {
          renameSync(oldPath, newPath)
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
            // Ancien et nouveau dossier sur des disques différents : rename
            // impossible directement, on copie puis on supprime l'original.
            copyFileSync(oldPath, newPath)
            unlinkSync(oldPath)
          } else {
            throw err
          }
        }
        result.movedCount += 1
      } catch (err) {
        result.errors.push(`"${name}" (${subfolder}) : ${errorMessage(err)}`)
      }
    }
  }

  return result
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Erreur inconnue.'
}
