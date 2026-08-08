import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getPreferences } from './preferencesRepository'

/**
 * Enregistre physiquement un fichier importé dans l'appli (data URL base64 —
 * ex : la pièce jointe scan/PDF d'une facture fournisseur) dans le dossier
 * des documents générés/importés, sous le sous-dossier donné. Écrase un
 * fichier existant du même nom : la pièce jointe la plus récente fait
 * toujours foi, comme pour generateAndSavePdf.
 */
export function saveDataUrlFile(subfolder: string, filename: string, dataUrl: string): string {
  const preferences = getPreferences()
  const baseDir = preferences.dossierExports as string
  const dir = join(baseDir, subfolder)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const safeName = filename.replace(/[\\/:*?"<>|]/g, '-')
  const target = join(dir, safeName)

  const match = dataUrl.match(/^data:[^;]+;base64,(.*)$/)
  if (!match) throw new Error('Format de fichier invalide')
  writeFileSync(target, Buffer.from(match[1], 'base64'))
  return target
}
