import { ipcMain, shell } from 'electron'
import { generateAndSavePdf } from '../pdfExport'

export function registerPdfIpc(): void {
  ipcMain.handle(
    'pdf:save',
    async (event, input: { subfolder: string; filename: string }) => {
      const path = await generateAndSavePdf(event, input.subfolder, input.filename)
      return { path }
    }
  )

  ipcMain.handle('pdf:revealFile', (_event, filePath: string) => {
    shell.showItemInFolder(filePath)
    return true
  })
}
