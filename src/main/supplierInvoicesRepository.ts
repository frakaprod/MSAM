import { randomUUID } from 'crypto'
import { getData, persist } from './store'
import type { SupplierInvoice, SupplierInvoiceFilters, SupplierInvoiceInput } from '../shared/types'

function normalizeText(value: string): string {
  return value.toLocaleLowerCase('fr-FR')
}

export function listSupplierInvoices(filters: SupplierInvoiceFilters = {}): SupplierInvoice[] {
  const data = getData()
  let invoices = [...data.supplierInvoices]

  if (filters.statut && filters.statut !== 'tous') {
    invoices = invoices.filter((i) => i.statut === filters.statut)
  }

  if (filters.search && filters.search.trim() !== '') {
    const needle = normalizeText(filters.search.trim())
    invoices = invoices.filter((i) => {
      const haystack = [i.fournisseur, i.numero, i.categorie].filter(Boolean).join(' ')
      return normalizeText(haystack).includes(needle)
    })
  }

  invoices.sort((a, b) => b.dateFacture.localeCompare(a.dateFacture))

  return invoices
}

export function getSupplierInvoice(id: string): SupplierInvoice | null {
  const data = getData()
  return data.supplierInvoices.find((i) => i.id === id) ?? null
}

export function createSupplierInvoice(input: SupplierInvoiceInput): SupplierInvoice {
  const data = getData()
  const now = new Date().toISOString()

  const invoice: SupplierInvoice = {
    id: randomUUID(),
    fournisseur: input.fournisseur,
    numero: input.numero,
    dateFacture: input.dateFacture,
    montantHT: input.montantHT,
    montantTVA: input.montantTVA,
    montantTTC: input.montantTTC,
    categorie: input.categorie,
    statut: input.statut || 'a_payer',
    datePaiement: input.datePaiement,
    notes: input.notes,
    fichier: input.fichier,
    createdAt: now,
    updatedAt: now
  }

  data.supplierInvoices.push(invoice)
  persist()

  return invoice
}

export function updateSupplierInvoice(
  id: string,
  input: SupplierInvoiceInput
): SupplierInvoice | null {
  const data = getData()
  const index = data.supplierInvoices.findIndex((i) => i.id === id)
  if (index === -1) return null

  const existing = data.supplierInvoices[index]
  const updated: SupplierInvoice = {
    ...existing,
    fournisseur: input.fournisseur,
    numero: input.numero,
    dateFacture: input.dateFacture,
    montantHT: input.montantHT,
    montantTVA: input.montantTVA,
    montantTTC: input.montantTTC,
    categorie: input.categorie,
    statut: input.statut || existing.statut,
    datePaiement: input.datePaiement,
    notes: input.notes,
    fichier: input.fichier,
    updatedAt: new Date().toISOString()
  }

  data.supplierInvoices[index] = updated
  persist()

  return updated
}

export function deleteSupplierInvoice(id: string): void {
  const data = getData()
  data.supplierInvoices = data.supplierInvoices.filter((i) => i.id !== id)
  persist()
}
