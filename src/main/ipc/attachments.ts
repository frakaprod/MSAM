import { ipcMain } from 'electron'
import { saveDataUrlFile } from '../attachmentExport'

export function registerAttachmentsIpc(): void {
  ipcMain.handle(
    'attachments:save',
    (_event, input: { subfolder: string; filename: string; dataUrl: string }) => {
      const path = saveDataUrlFile(input.subfolder, input.filename, input.dataUrl)
      return { path }
    }
  )
}
