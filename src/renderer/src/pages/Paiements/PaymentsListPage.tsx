import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BillingProfile, Client, InvoiceDocument, Payment } from '../../../../shared/types'
import { formatMonthLabel } from '../../lib/dateUtils'
import { formatMontant } from '../../lib/meta'

export default function PaymentsListPage(): React.JSX.Element {
  const [payments, setPayments] = useState<Payment[]>([])
  const [documents, setDocuments] = useState<Record<string, InvoiceDocument>>({})
  const [clients, setClients] = useState<Record<string, Client>>({})
  const [defaultProfile, setDefaultProfile] = useState<BillingProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Génération du relevé PDF d'un mois : releveOpenFor est le mois dont le
  // petit panneau d'options (case "inclure les non-déclarés") est ouvert ;
  // releveMonth est le mois effectivement en cours de rendu pour
  // impression/export (déclenche l'affichage de la vue imprimable
  // ci-dessous), releveAction précise ce qu'on en fait une fois montée.
  const [releveOpenFor, setReleveOpenFor] = useState<string | null>(null)
  const [releveIncludeNonDeclares, setReleveIncludeNonDeclares] = useState(true)
  const [releveMonth, setReleveMonth] = useState<string | null>(null)
  const [releveAction, setReleveAction] = useState<'imprimer' | 'enregistrer' | null>(null)
  const [savingReleve, setSavingReleve] = useState(false)
  const [savedRelevePath, setSavedRelevePath] = useState<string | null>(null)
  const [releveError, setReleveError] = useState<string | null>(null)

  async function reload(): Promise<void> {
    setLoading(true)
    try {
      const [paymentsList, documentsList, clientsList, profile] = await Promise.all([
        window.api.payments.list(),
        window.api.documents.list({ type: 'facture' }),
        window.api.clients.list({ statut: 'tous' }),
        window.api.billingProfiles.getDefault()
      ])
      setPayments(paymentsList)
      const docMap: Record<string, InvoiceDocument> = {}
      documentsList.forEach((d) => (docMap[d.id] = d))
      setDocuments(docMap)
      const clientMap: Record<string, Client> = {}
      clientsList.forEach((c) => (clientMap[c.id] = c))
      setClients(clientMap)
      setDefaultProfile(profile)
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
  const totalADeclarer = useMemo(
    () => payments.filter((p) => p.declarer).reduce((sum, p) => sum + p.montant, 0),
    [payments]
  )

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

  function handleGenererReleve(monthKey: string, action: 'imprimer' | 'enregistrer'): void {
    setReleveOpenFor(null)
    setReleveError(null)
    setSavedRelevePath(null)
    setReleveAction(action)
    setReleveMonth(monthKey)
  }

  // Une fois la vue imprimable montée (releveMonth passé), on déclenche soit
  // l'impression (dialogue natif, refermé -> "afterprint" ci-dessous), soit
  // l'enregistrement direct en PDF dans le dossier configuré en Préférences.
  useEffect(() => {
    if (!releveMonth || !releveAction) return
    const timeout = setTimeout(async () => {
      if (releveAction === 'imprimer') {
        window.print()
        return
      }
      setSavingReleve(true)
      try {
        const { path } = await window.api.pdf.save({
          subfolder: 'Relevés',
          filename: `Releve ${releveMonth}`
        })
        setSavedRelevePath(path)
      } catch {
        setReleveError("Impossible d'enregistrer le relevé PDF.")
      } finally {
        setSavingReleve(false)
        setReleveMonth(null)
        setReleveAction(null)
      }
    }, 150)
    return () => clearTimeout(timeout)
  }, [releveMonth, releveAction])

  useEffect(() => {
    function handleAfterPrint(): void {
      setReleveMonth(null)
      setReleveAction(null)
    }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  const relevePayments = useMemo(() => {
    if (!releveMonth) return []
    const monthPayments = groups.find(([key]) => key === releveMonth)?.[1] ?? []
    return releveIncludeNonDeclares ? monthPayments : monthPayments.filter((p) => p.declarer)
  }, [releveMonth, groups, releveIncludeNonDeclares])

  const releveTotal = relevePayments.reduce((sum, p) => sum + p.montant, 0)
  const releveTotalADeclarer = relevePayments
    .filter((p) => p.declarer)
    .reduce((sum, p) => sum + p.montant, 0)

  return (
    <div>
      <div className={releveMonth ? 'print:hidden p-8 max-w-5xl mx-auto' : 'p-8 max-w-5xl mx-auto'}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Paiements</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {payments.length} paiement{payments.length > 1 ? 's' : ''} reçu
              {payments.length > 1 ? 's' : ''} · Total {formatMontant(totalGeneral)} · Total à
              déclarer {formatMontant(totalADeclarer)}
            </p>
          </div>
        </div>

        {savingReleve && (
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Enregistrement du relevé en PDF...
          </p>
        )}
        {savedRelevePath && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            <span className="truncate">Enregistré : {savedRelevePath}</span>
            <button
              onClick={() => window.api.pdf.revealFile(savedRelevePath)}
              className="shrink-0 text-xs font-medium underline hover:no-underline"
            >
              Afficher dans le dossier
            </button>
          </div>
        )}
        {releveError && <p className="mb-4 text-sm text-red-600">{releveError}</p>}

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Chargement...
          </div>
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
              const monthTotalADeclarer = monthPayments
                .filter((p) => p.declarer)
                .reduce((sum, p) => sum + p.montant, 0)
              return (
                <div
                  key={monthKey}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">
                      {monthLabel(monthKey)}
                    </h3>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setReleveOpenFor(releveOpenFor === monthKey ? null : monthKey)
                        }
                        className="text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Relevé PDF
                      </button>
                      {releveOpenFor === monthKey && (
                        <div className="absolute right-0 mt-1 z-10 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-3">
                          <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={releveIncludeNonDeclares}
                              onChange={(e) => setReleveIncludeNonDeclares(e.target.checked)}
                              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500"
                            />
                            Inclure les paiements non déclarés
                          </label>
                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setReleveOpenFor(null)}
                              className="text-xs px-2 py-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGenererReleve(monthKey, 'imprimer')}
                              className="text-xs px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              Imprimer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGenererReleve(monthKey, 'enregistrer')}
                              className="text-xs px-2.5 py-1 rounded bg-brand-600 text-white font-medium hover:bg-brand-700"
                            >
                              Enregistrer en PDF
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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
                              {client
                                ? `${client.nom}${client.prenom ? ` ${client.prenom}` : ''}`
                                : '—'}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="date"
                                value={payment.datePaiement}
                                onChange={(e) =>
                                  patchPayment(payment.id, { datePaiement: e.target.value })
                                }
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
                                onChange={(e) =>
                                  patchPayment(payment.id, { declarer: e.target.checked })
                                }
                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-slate-900">
                        <td
                          colSpan={3}
                          className="px-4 py-1.5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"
                        >
                          Total {monthLabel(monthKey)}
                        </td>
                        <td className="px-4 py-1.5 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {formatMontant(monthTotal)}
                        </td>
                        <td />
                      </tr>
                      <tr className="bg-slate-50 dark:bg-slate-900">
                        <td
                          colSpan={3}
                          className="px-4 py-1.5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"
                        >
                          Total à déclarer
                        </td>
                        <td className="px-4 py-1.5 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {formatMontant(monthTotalADeclarer)}
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

      {/* ---------- Relevé imprimable (masqué à l'écran, visible seulement à l'impression) ---------- */}
      {releveMonth && (
        <div className="hidden print:block p-8 text-sm text-slate-800">
          {defaultProfile?.logo && (
            <img src={defaultProfile.logo} alt="Logo" className="h-14 max-w-[200px] object-contain mb-3" />
          )}
          <h1 className="text-xl font-bold">Relevé des paiements — {monthLabel(releveMonth)}</h1>
          {defaultProfile && <p className="text-xs text-slate-500 mt-1">{defaultProfile.raisonSociale}</p>}
          <p className="text-xs text-slate-500 mt-1">
            {releveIncludeNonDeclares
              ? 'Tous les paiements du mois.'
              : 'Paiements à déclarer uniquement.'}
          </p>

          <table className="w-full mt-6 border-t border-slate-300">
            <thead>
              <tr className="border-b border-slate-300 text-left text-xs uppercase text-slate-500">
                <th className="py-2">Facture</th>
                <th className="py-2">Client</th>
                <th className="py-2">Date de paiement</th>
                <th className="py-2 text-right">Montant</th>
                <th className="py-2 text-center">À déclarer</th>
              </tr>
            </thead>
            <tbody>
              {relevePayments.map((payment) => {
                const doc = documents[payment.documentId]
                const client = doc ? clients[doc.clientId] : undefined
                return (
                  <tr key={payment.id} className="border-b border-slate-100">
                    <td className="py-2">{doc ? doc.numero : 'Facture supprimée'}</td>
                    <td className="py-2">
                      {client ? `${client.nom}${client.prenom ? ` ${client.prenom}` : ''}` : '—'}
                    </td>
                    <td className="py-2">{payment.datePaiement}</td>
                    <td className="py-2 text-right">{formatMontant(payment.montant)}</td>
                    <td className="py-2 text-center">{payment.declarer ? 'Oui' : 'Non'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Total</span>
                <span>{formatMontant(releveTotal)}</span>
              </div>
              {releveIncludeNonDeclares && (
                <div className="flex justify-between font-semibold text-slate-900 pt-1 border-t border-slate-300">
                  <span>Total à déclarer</span>
                  <span>{formatMontant(releveTotalADeclarer)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
