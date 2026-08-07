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
 * d'impression. Le nom de fichier est dédupliqué si besoin (jamais d'écrasement
 * silencieux d'un document existant).
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
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const safeName = filename.replace(/[\\/:*?"<>|]/g, '-')
  const base = safeName.replace(/\.pdf$/i, '')

  let target = join(dir, `${base}.pdf`)
  let counter = 1
  while (existsSync(target)) {
    target = join(dir, `${base} (${counter}).pdf`)
    counter += 1
  }

  writeFileSync(target, buffer)
  return target
}
