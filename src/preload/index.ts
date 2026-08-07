import { contextBridge, ipcRenderer } from 'electron'
import type {
  Client,
  ClientFilters,
  ClientInput,
  Event,
  EventFilters,
  EventInput,
  Project,
  ProjectFilters,
  ProjectInput
} from '../shared/types'

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
  },
  projects: {
    list: (filters?: ProjectFilters): Promise<Project[]> =>
      ipcRenderer.invoke('projects:list', filters ?? {}),
    get: (id: string): Promise<Project | null> =>
      ipcRenderer.invoke('projects:get', id),
    create: (input: ProjectInput): Promise<Project> =>
      ipcRenderer.invoke('projects:create', input),
    update: (id: string, input: ProjectInput): Promise<Project | null> =>
      ipcRenderer.invoke('projects:update', id, input),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke('projects:delete', id)
  },
  events: {
    list: (filters?: EventFilters): Promise<Event[]> =>
      ipcRenderer.invoke('events:list', filters ?? {}),
    get: (id: string): Promise<Event | null> =>
      ipcRenderer.invoke('events:get', id),
    create: (input: EventInput): Promise<Event> =>
      ipcRenderer.invoke('events:create', input),
    update: (id: string, input: EventInput): Promise<Event | null> =>
      ipcRenderer.invoke('events:update', id, input),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke('events:delete', id)
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
