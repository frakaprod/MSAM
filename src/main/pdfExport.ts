import { BrowserWindow } from 'electron'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { IpcMainInvokeEvent } from 'electron'
import { getPreferences } from './preferencesRepository'

/**
 * Génère un PDF de la page actuellement affichée (celle-ci doit contenir sa
 * propre mise en page imprimable via les classes Tailwind `print:*`, comme
 * pour l'impression classique) et l'enregistre directement dans le dossier
 * configuré dans Préférences, sans passer par la boîte de dialogue
 * d'impression. Le fichier est nommé d'après le document (son numéro, ou le
 * mois pour un relevé) : ré-enregistrer le même document écrase le fichier
 * existant, pour que le document physique reste toujours synchronisé avec la
 * dernière version enregistrée dans l'appli (cf. DocumentDetailPage.tsx qui
 * ré-enregistre automatiquement à chaque création/modification).
 */
export async function generateAndSavePdf(
  event: IpcMainInvokeEvent,
  subfolder: string,
  filename: string
): Promise<string> {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) throw new Error('Fenêtre introuvable')

  const buffer = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4'
  })

  const preferences = getPreferences()
  const baseDir = preferences.dossierExports as string
  const dir = join(baseDir, subfolder)

  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const safeName = filename.replace(/[\\/:*?"<>|]/g, '-')
    const base = safeName.replace(/\.pdf$/i, '')
    const target = join(dir, `${base}.pdf`)

    writeFileSync(target, buffer)
    return target
  } catch (err) {
    // Loggé dans la fenêtre noire ouverte par "Lancer MSAM.bat" pour pouvoir
    // diagnostiquer un souci de droits d'accès / chemin invalide / disque
    // indisponible si l'enregistrement échoue côté utilisateur.
    console.error('[MSAM] Échec de l\'enregistrement du PDF dans', dir, err)
    throw err
  }
}
