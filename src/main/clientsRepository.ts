import { randomUUID } from 'crypto'
import { getData, persist } from './store'
import type { Client, ClientFilters, ClientInput } from '../shared/types'

function normalizeText(value: string): string {
  return value.toLocaleLowerCase('fr-FR')
}

export function listClients(filters: ClientFilters = {}): Client[] {
  const data = getData()
  let clients = [...data.clients]

  if (filters.statut && filters.statut !== 'tous') {
    clients = clients.filter((c) => c.statut === filters.statut)
  }

  if (filters.search && filters.search.trim() !== '') {
    const needle = normalizeText(filters.search.trim())
    clients = clients.filter((c) => {
      const haystack = [c.nom, c.prenom, c.email, c.telephone, c.siret, c.ville]
        .filter(Boolean)
        .join(' ')
      return normalizeText(haystack).includes(needle)
    })
  }

  clients.sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }))

  return clients
}

export function getClient(id: string): Client | null {
  const data = getData()
  return data.clients.find((c) => c.id === id) ?? null
}

export function createClient(input: ClientInput): Client {
  const data = getData()
  const now = new Date().toISOString()

  const client: Client = {
    id: randomUUID(),
    type: input.type,
    nom: input.nom,
    prenom: input.prenom,
    siret: input.siret,
    email: input.email,
    telephone: input.telephone,
    adresse: input.adresse,
    codePostal: input.codePostal,
    ville: input.ville,
    pays: input.pays || 'France',
    contactNom: input.contactNom,
    notes: input.notes,
    tags: input.tags || [],
    statut: input.statut || 'prospect',
    createdAt: now,
    updatedAt: now
  }

  data.clients.push(client)
  persist()

  return client
}

export function updateClient(id: string, input: ClientInput): Client | null {
  const data = getData()
  const index = data.clients.findIndex((c) => c.id === id)
  if (index === -1) return null

  const existing = data.clients[index]
  const updated: Client = {
    ...existing,
    type: input.type,
    nom: input.nom,
    prenom: input.prenom,
    siret: input.siret,
    email: input.email,
    telephone: input.telephone,
    adresse: input.adresse,
    codePostal: input.codePostal,
    ville: input.ville,
    pays: input.pays || 'France',
    contactNom: input.contactNom,
    notes: input.notes,
    tags: input.tags || [],
    statut: input.statut || 'prospect',
    updatedAt: new Date().toISOString()
  }

  data.clients[index] = updated
  persist()

  return updated
}

export function deleteClient(id: string): void {
  const data = getData()
  data.clients = data.clients.filter((c) => c.id !== id)
  persist()
}
