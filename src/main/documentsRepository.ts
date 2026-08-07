import { randomUUID } from 'crypto'
import { getData, persist } from './store'
import { reserveNextNumero } from './billingProfilesRepository'
import type {
  DocumentFilters,
  DocumentType,
  InvoiceDocument,
  InvoiceDocumentInput
} from '../shared/types'

function normalizeText(value: string): string {
  return value.toLocaleLowerCase('fr-FR')
}

export function listDocuments(filters: DocumentFilters = {}): InvoiceDocument[] {
  const data = getData()
  let docs = [...data.documents]

  if (filters.type) {
    docs = docs.filter((d) => d.type === filters.type)
  }
  if (filters.statut && filters.statut !== 'tous') {
    docs = docs.filter((d) => d.statut === filters.statut)
  }
  if (filters.clientId) {
    docs = docs.filter((d) => d.clientId === filters.clientId)
  }
  if (filters.projetId) {
    docs = docs.filter((d) => d.projetId === filters.projetId)
  }
  if (filters.search && filters.search.trim() !== '') {
    const needle = normalizeText(filters.search.trim())
    docs = docs.filter((d) => normalizeText(d.numero).includes(needle))
  }

  docs.sort((a, b) => b.dateEmission.localeCompare(a.dateEmission) || b.numero.localeCompare(a.numero))

  return docs
}

export function getDocument(id: string): InvoiceDocument | null {
  const data = getData()
  return data.documents.find((d) => d.id === id) ?? null
}

export function createDocument(input: InvoiceDocumentInput): InvoiceDocument {
  const data = getData()
  const now = new Date().toISOString()
  const numero = reserveNextNumero(input.profilId, input.type)

  const document: InvoiceDocument = {
    id: randomUUID(),
    type: input.type,
    numero,
    profilId: input.profilId,
    clientId: input.clientId,
    projetId: input.projetId,
    dateEmission: input.dateEmission,
    dateEcheance: input.dateEcheance,
    statut: input.statut || 'brouillon',
    lignes: input.lignes || [],
    conditionsPaiement: input.conditionsPaiement,
    notes: input.notes,
    devisOrigineId: input.devisOrigineId ?? null,
    createdAt: now,
    updatedAt: now
  }

  data.documents.push(document)
  persist()

  return document
}

export function updateDocument(id: string, input: InvoiceDocumentInput): InvoiceDocument | null {
  const data = getData()
  const index = data.documents.findIndex((d) => d.id === id)
  if (index === -1) return null

  const existing = data.documents[index]
  const updated: InvoiceDocument = {
    ...existing,
    profilId: input.profilId,
    clientId: input.clientId,
    projetId: input.projetId,
    dateEmission: input.dateEmission,
    dateEcheance: input.dateEcheance,
    statut: input.statut || existing.statut,
    lignes: input.lignes || [],
    conditionsPaiement: input.conditionsPaiement,
    notes: input.notes,
    updatedAt: new Date().toISOString()
  }

  data.documents[index] = updated
  persist()

  return updated
}

export function deleteDocument(id: string): void {
  const data = getData()
  data.documents = data.documents.filter((d) => d.id !== id)
  persist()
}

/**
 * Transforme un devis accepté en facture : crée une nouvelle facture avec les
 * mêmes lignes/client/profil, réserve un numéro de facture, et marque le
 * devis comme accepté s'il ne l'était pas déjà.
 */
export function convertDevisToFacture(devisId: string): InvoiceDocument | null {
  const data = getData()
  const devis = data.documents.find((d) => d.id === devisId && d.type === 'devis')
  if (!devis) return null

  const now = new Date().toISOString()
  const numero = reserveNextNumero(devis.profilId, 'facture')

  const facture: InvoiceDocument = {
    id: randomUUID(),
    type: 'facture',
    numero,
    profilId: devis.profilId,
    clientId: devis.clientId,
    projetId: devis.projetId,
    dateEmission: now.slice(0, 10),
    dateEcheance: null,
    statut: 'brouillon',
    lignes: devis.lignes.map((l) => ({ ...l, id: randomUUID() })),
    conditionsPaiement: devis.conditionsPaiement,
    notes: devis.notes,
    devisOrigineId: devis.id,
    createdAt: now,
    updatedAt: now
  }

  data.documents.push(facture)

  if (devis.statut === 'brouillon' || devis.statut === 'envoye') {
    devis.statut = 'accepte'
    devis.updatedAt = now
  }

  persist()

  return facture
}

export function countDocumentsByType(type: DocumentType): number {
  const data = getData()
  return data.documents.filter((d) => d.type === type).length
}
