import { ipcMain } from 'electron'
import { deletePayment, listPayments, updatePayment } from '../paymentsRepository'
import type { PaymentUpdateInput } from '../../shared/types'

export function registerPaymentsIpc(): void {
  ipcMain.handle('payments:list', () => {
    return listPayments()
  })

  ipcMain.handle('payments:update', (_event, id: string, input: PaymentUpdateInput) => {
    return updatePayment(id, input)
  })

  ipcMain.handle('payments:delete', (_event, id: string) => {
    deletePayment(id)
    return true
  })
}
