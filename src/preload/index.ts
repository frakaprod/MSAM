import { contextBridge, ipcRenderer } from 'electron'
import type {
  BillingProfile,
  BillingProfileInput,
  Client,
  ClientFilters,
  ClientInput,
  DocumentFilters,
  Event,
  EventFilters,
  EventInput,
  InvoiceDocument,
  InvoiceDocumentInput,
  Payment,
  PaymentUpdateInput,
  Preferences,
  PreferencesUpdateInput,
  Project,
  ProjectFilters,
  ProjectInput,
  SupplierInvoice,
  SupplierInvoiceFilters,
  SupplierInvoiceInput
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
  },
  billingProfiles: {
    list: (): Promise<BillingProfile[]> => ipcRenderer.invoke('billingProfiles:list'),
    get: (id: string): Promise<BillingProfile | null> =>
      ipcRenderer.invoke('billingProfiles:get', id),
    getDefault: (): Promise<BillingProfile | null> =>
      ipcRenderer.invoke('billingProfiles:getDefault'),
    create: (input: BillingProfileInput): Promise<BillingProfile> =>
      ipcRenderer.invoke('billingProfiles:create', input),
    update: (id: string, input: BillingProfileInput): Promise<BillingProfile | null> =>
      ipcRenderer.invoke('billingProfiles:update', id, input),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke('billingProfiles:delete', id)
  },
  documents: {
    list: (filters?: DocumentFilters): Promise<InvoiceDocument[]> =>
      ipcRenderer.invoke('documents:list', filters ?? {}),
    get: (id: string): Promise<InvoiceDocument | null> =>
      ipcRenderer.invoke('documents:get', id),
    create: (input: InvoiceDocumentInput): Promise<InvoiceDocument> =>
      ipcRenderer.invoke('documents:create', input),
    update: (id: string, input: InvoiceDocumentInput): Promise<InvoiceDocument | null> =>
      ipcRenderer.invoke('documents:update', id, input),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke('documents:delete', id),
    convertToFacture: (devisId: string): Promise<InvoiceDocument | null> =>
      ipcRenderer.invoke('documents:convertToFacture', devisId)
  },
  supplierInvoices: {
    list: (filters?: SupplierInvoiceFilters): Promise<SupplierInvoice[]> =>
      ipcRenderer.invoke('supplierInvoices:list', filters ?? {}),
    get: (id: string): Promise<SupplierInvoice | null> =>
      ipcRenderer.invoke('supplierInvoices:get', id),
    create: (input: SupplierInvoiceInput): Promise<SupplierInvoice> =>
      ipcRenderer.invoke('supplierInvoices:create', input),
    update: (id: string, input: SupplierInvoiceInput): Promise<SupplierInvoice | null> =>
      ipcRenderer.invoke('supplierInvoices:update', id, input),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke('supplierInvoices:delete', id)
  },
  payments: {
    list: (): Promise<Payment[]> => ipcRenderer.invoke('payments:list'),
    update: (id: string, input: PaymentUpdateInput): Promise<Payment | null> =>
      ipcRenderer.invoke('payments:update', id, input),
    delete: (id: string): Promise<boolean> => ipcRenderer.invoke('payments:delete', id)
  },
  preferences: {
    get: (): Promise<Preferences> => ipcRenderer.invoke('preferences:get'),
    update: (input: PreferencesUpdateInput): Promise<Preferences> =>
      ipcRenderer.invoke('preferences:update', input),
    getSync: (): Preferences => ipcRenderer.sendSync('preferences:get-sync'),
    chooseExportsFolder: (): Promise<{ preferences: Preferences; error: string | null } | null> =>
      ipcRenderer.invoke('preferences:chooseExportsFolder'),
    openExportsFolder: (): Promise<boolean> =>
      ipcRenderer.invoke('preferences:openExportsFolder')
  },
  pdf: {
    save: (input: { subfolder: string; filename: string }): Promise<{ path: string }> =>
      ipcRenderer.invoke('pdf:save', input),
    revealFile: (filePath: string): Promise<boolean> =>
      ipcRenderer.invoke('pdf:revealFile', filePath)
  },
  attachments: {
    save: (input: { subfolder: string; filename: string; dataUrl: string }): Promise<{ path: string }> =>
      ipcRenderer.invoke('attachments:save', input)
  }
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
