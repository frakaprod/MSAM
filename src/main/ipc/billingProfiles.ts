import { ipcMain } from 'electron'
import {
  createBillingProfile,
  deleteBillingProfile,
  getBillingProfile,
  listBillingProfiles,
  updateBillingProfile
} from '../billingProfilesRepository'
import type { BillingProfileInput } from '../../shared/types'

export function registerBillingProfilesIpc(): void {
  ipcMain.handle('billingProfiles:list', () => {
    return listBillingProfiles()
  })

  ipcMain.handle('billingProfiles:get', (_event, id: string) => {
    return getBillingProfile(id)
  })

  ipcMain.handle('billingProfiles:create', (_event, input: BillingProfileInput) => {
    return createBillingProfile(input)
  })

  ipcMain.handle(
    'billingProfiles:update',
    (_event, id: string, input: BillingProfileInput) => {
      return updateBillingProfile(id, input)
    }
  )

  ipcMain.handle('billingProfiles:delete', (_event, id: string) => {
    deleteBillingProfile(id)
    return true
  })
}
