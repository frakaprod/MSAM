import { randomUUID } from 'crypto'
import { getData, persist } from './store'
import { computeDocumentTotals } from '../shared/invoiceCalc'
import type { InvoiceDocument, Payment, PaymentUpdateInput } from '../shared/types'

export function listPayments(): Payment[] {
  const data = getData()
  return [...data.payments].sort((a, b) => b.datePaiement.localeCompare(a.datePaiement))
}

export function updatePayment(id: string, input: PaymentUpdateInput): Payment | null {
  const data = getData()
  const index = data.payments.findIndex((p) => p.id === id)
  if (index === -1) return null

  const existing = data.payments[index]
  const updated: Payment = {
    ...existing,
    montant: input.montant !== undefined ? input.montant : existing.montant,
    datePaiement: input.datePaiement !== undefined ? input.datePaiement : existing.datePaiement,
    declarer: input.declarer !== undefined ? input.declarer : existing.declarer,
    updatedAt: new Date().toISOString()
  }

  data.payments[index] = updated
  persist()

  return updated
}

export function deletePayment(id: string): void {
  const data = getData()
  data.payments = data.payments.filter((p) => p.id !== id)
  persist()
}

export function deletePaymentByDocumentId(documentId: string): void {
  const data = getData()
  const before = data.payments.length
  data.payments = data.payments.filter((p) => p.documentId !== documentId)
  if (data.payments.length !== before) {
    persist()
  }
}

/**
 * Synchronise l'existence d'un paiement avec le statut d'une facture : appelé
 * après chaque création/modification de document (documentsRepository). Crée
 * un paiement si la facture vient de passer à "payée" et qu'aucun paiement
 * n'existe déjà pour elle ; le supprime si elle n'est plus "payée". Ainsi le
 * module Paiements reste toujours le reflet exact des factures marquées
 * payées, sans double-saisie.
 */
export function syncPaymentForDocument(doc: InvoiceDocument): void {
  if (doc.type !== 'facture') return

  const data = getData()
  const existingIndex = data.payments.findIndex((p) => p.documentId === doc.id)

  if (doc.statut === 'paye') {
    if (existingIndex === -1) {
      const totals = computeDocumentTotals(doc.lignes)
      const now = new Date().toISOString()
      data.payments.push({
        id: randomUUID(),
        documentId: doc.id,
        clientId: doc.clientId,
        montant: totals.totalTTC,
        datePaiement: now.slice(0, 10),
        declarer: true,
        createdAt: now,
        updatedAt: now
      })
      persist()
    }
  } else if (existingIndex !== -1) {
    data.payments.splice(existingIndex, 1)
    persist()
  }
}
