import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Client, InvoiceDocument, Payment } from '../../../../shared/types'
import { formatMonthLabel } from '../../lib/dateUtils'
import { formatMontant } from '../../lib/meta'

export default function PaymentsListPage(): React.JSX.Element {
  const [payments, setPayments] = useState<Payment[]>([])
  const [documents, setDocuments] = useState<Record<string, InvoiceDocument>>({})
  const [clients, setClients] = useState<Record<string, Client>>({})
  const [loading, setLoading] = useState(true)

  async function reload(): Promise<void> {
    setLoading(true)
    try {
      const [paymentsList, documentsList, clientsList] = await Promise.all([
        window.api.payments.list(),
        window.api.documents.list({ type: 'facture' }),
        window.api.clients.list({ statut: 'tous' })
      ])
      setPayments(paymentsList)
      const docMap: Record<string, InvoiceDocument> = {}
      documentsList.forEach((d) => (docMap[d.id] = d))
      setDocuments(docMap)
      const clientMap: Record<string, Client> = {}
      clientsList.forEach((c) => (clientMap[c.id] = c))
      setClients(clientMap)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  // Regroupement par mois (YYYY-MM), du plus récent au plus ancien. Les
  // paiements sont déjà triés par date décroissante par le backend, donc les
  // regrouper en parcourant la liste dans l'ordre suffit à garder chaque mois
  // groupé et trié en interne.
  const groups = useMemo(() => {
    const map = new Map<string, Payment[]>()
    for (const payment of payments) {
      const key = payment.datePaiement.slice(0, 7)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(payment)
    }
    return Array.from(map.entries())
  }, [payments])

  const totalGeneral = useMemo(() => payments.reduce((sum, p) => sum + p.montant, 0), [payments])

  async function patchPayment(id: string, patch: Partial<Payment>): Promise<void> {
    // Mise à jour optimiste pour que la saisie façon tableur reste fluide.
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    await window.api.payments.update(id, patch)
  }

  function monthLabel(key: string): string {
    const [year, month] = key.split('-').map(Number)
    const label = formatMonthLabel(new Date(year, month - 1, 1))
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Paiements</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {payments.length} paiement{payments.length > 1 ? 's' : ''} reçu
            {payments.length > 1 ? 's' : ''} · Total {formatMontant(totalGeneral)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">Chargement...</div>
      ) : payments.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucun paiement pour le moment. Une ligne apparaît ici automatiquement dès qu'une facture
            est marquée "Payée".
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([monthKey, monthPayments]) => {
            const monthTotal = monthPayments.reduce((sum, p) => sum + p.montant, 0)
            return (
              <div
                key={monthKey}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">
                    {monthLabel(monthKey)}
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-400 dark:text-slate-500">
                      <th className="px-4 py-2 font-medium">Facture</th>
                      <th className="px-4 py-2 font-medium">Client</th>
                      <th className="px-4 py-2 font-medium">Date de paiement</th>
                      <th className="px-4 py-2 font-medium text-right">Montant</th>
                      <th className="px-4 py-2 font-medium text-center">À déclarer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthPayments.map((payment) => {
                      const doc = documents[payment.documentId]
                      const client = doc ? clients[doc.clientId] : undefined
                      return (
                        <tr
                          key={payment.id}
                          className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                        >
                          <td className="px-4 py-2">
                            {doc ? (
                              <Link
                                to={`/facturation/factures/${doc.id}`}
                                className="font-medium text-slate-900 dark:text-slate-100 hover:text-brand-600"
                              >
                                {doc.numero}
                              </Link>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">
                                Facture supprimée
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                            {client ? `${client.nom}${client.prenom ? ` ${client.prenom}` : ''}` : '—'}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="date"
                              value={payment.datePaiement}
                              onChange={(e) => patchPayment(payment.id, { datePaiement: e.target.value })}
                              className="rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 px-1.5 py-1 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              defaultValue={payment.montant}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value)
                                if (!Number.isNaN(value) && value !== payment.montant) {
                                  patchPayment(payment.id, { montant: value })
                                }
                              }}
                              className="w-28 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 px-1.5 py-1 text-sm text-right bg-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={payment.declarer}
                              onChange={(e) => patchPayment(payment.id, { declarer: e.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-900">
                      <td colSpan={3} className="px-4 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                        Total {monthLabel(monthKey)}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {formatMontant(monthTotal)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
        Les paiements sont ajoutés automatiquement quand une facture passe au statut "Payée" (et
        retirés si elle en ressort). Montant, date et déclaration restent modifiables ici.
      </p>
    </div>
  )
}
