import { contextBridge, ipcRenderer } from 'electron'
import type { Client, ClientFilters, ClientInput } from '../shared/types'

const api = {
  clients: {
    list: (filters?: ClientFilters): Promise<Client[]> =>
      ipcRenderer.invoke('clients:list', filters ?? {}),
    get: (id: string): Promise<Client | null> =>
      ipcRenderer.invoke('clients:get', id),
    create: (input: ClientInput): Promise<Client> =>
      ipcRenderer.invoke('clients:create', input),
    update: (id: string, input: ClientInput): Promise<Client | null> =>
      ipcRenderer.invoke('clients:update', id, input),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke('clients:delete', id)
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
