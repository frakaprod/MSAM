import { ipcMain } from 'electron'
import {
  convertDevisToFacture,
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
  updateDocument
} from '../documentsRepository'
import type { DocumentFilters, InvoiceDocumentInput } from '../../shared/types'

export function registerDocumentsIpc(): void {
  ipcMain.handle('documents:list', (_event, filters: DocumentFilters) => {
    return listDocuments(filters)
  })

  ipcMain.handle('documents:get', (_event, id: string) => {
    return getDocument(id)
  })

  ipcMain.handle('documents:create', (_event, input: InvoiceDocumentInput) => {
    return createDocument(input)
  })

  ipcMain.handle(
    'documents:update',
    (_event, id: string, input: InvoiceDocumentInput) => {
      return updateDocument(id, input)
    }
  )

  ipcMain.handle('documents:delete', (_event, id: string) => {
    deleteDocument(id)
    return true
  })

  ipcMain.handle('documents:convertToFacture', (_event, devisId: string) => {
    return convertDevisToFacture(devisId)
  })
}
