import { ipcMain } from 'electron'
import {
  createClient,
  deleteClient,
  getClient,
  listClients,
  updateClient
} from '../clientsRepository'
import type { ClientFilters, ClientInput } from '../../shared/types'

export function registerClientsIpc(): void {
  ipcMain.handle('clients:list', (_event, filters: ClientFilters) => {
    return listClients(filters)
  })

  ipcMain.handle('clients:get', (_event, id: string) => {
    return getClient(id)
  })

  ipcMain.handle('clients:create', (_event, input: ClientInput) => {
    return createClient(input)
  })

  ipcMain.handle(
    'clients:update',
    (_event, id: string, input: ClientInput) => {
      return updateClient(id, input)
    }
  )

  ipcMain.handle('clients:delete', (_event, id: string) => {
    deleteClient(id)
    return true
  })
}
