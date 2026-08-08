import { ipcMain } from 'electron'
import {
  createSupplierInvoice,
  deleteSupplierInvoice,
  getSupplierInvoice,
  listSupplierInvoices,
  updateSupplierInvoice
} from '../supplierInvoicesRepository'
import type { SupplierInvoiceFilters, SupplierInvoiceInput } from '../../shared/types'

export function registerSupplierInvoicesIpc(): void {
  ipcMain.handle('supplierInvoices:list', (_event, filters: SupplierInvoiceFilters) => {
    return listSupplierInvoices(filters)
  })

  ipcMain.handle('supplierInvoices:get', (_event, id: string) => {
    return getSupplierInvoice(id)
  })

  ipcMain.handle('supplierInvoices:create', (_event, input: SupplierInvoiceInput) => {
    return createSupplierInvoice(input)
  })

  ipcMain.handle(
    'supplierInvoices:update',
    (_event, id: string, input: SupplierInvoiceInput) => {
      return updateSupplierInvoice(id, input)
    }
  )

  ipcMain.handle('supplierInvoices:delete', (_event, id: string) => {
    deleteSupplierInvoice(id)
    return true
  })
}
