import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Client, DocumentStatut, DocumentType, InvoiceDocument } from '../../../../shared/types'
import { computeDocumentTotals } from '../../../../shared/invoiceCalc'
import {
  DEVIS_STATUTS,
  FACTURE_STATUTS
} from '../../../../shared/types'
import { DOCUMENT_STATUT_LABELS, DOCUMENT_STATUT_STYLES, formatMontant } from '../../lib/meta'
import { formatMonthLabel } from '../../lib/dateUtils'
import DeleteButton from '../../components/DeleteButton'
import EditButton from '../../components/EditButton'
import PrintButton from '../../components/PrintButton'
import PdfButton from '../../components/PdfButton'

export default function DocumentsListPage({ type }: { type: DocumentType }): React.JSX.Element {
  const [documents, setDocuments] = useState<InvoiceDocument[]>([])
  const [clients, setClients] = useState<Record<string, Client>>({})
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<DocumentStatut | 'tous'>('tous')
  const [loading, setLoading] = useState(true)

  const statutsDisponibles = type === 'devis' ? DEVIS_STATUTS : FACTURE_STATUTS
  const label = type === 'devis' ? 'devis' : 'facture'

  useEffect(() => {
    setStatutFilter('tous')
  }, [type])

  useEffect(() => {
    window.api.clients.list({ statut: 'tous' }).then((list) => {
      const map: Record<string, Client> = {}
      list.forEach((c) => (map[c.id] = c))
      setClients(map)
    })
  }, [])

  async function reload(): Promise<void> {
    setLoading(true)
    try {
      const data = await window.api.documents.list({ type, search, statut: statutFilter })
      setDocuments(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      reload()
    }, 150)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, search, statutFilter])

  // Factures et devis sont regroupés par mois d'émission (comme le module
  // Fiscalité), pour s'y retrouver plus facilement au fil de l'année.
  const groups = useMemo(() => {
    const map = new Map<string, InvoiceDocument[]>()
    for (const doc of documents) {
      const key = doc.dateEmission.slice(0, 7)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(doc)
    }
    return Array.from(map.entries())
  }, [documents])

  function monthLabel(key: string): string {
    const [year, month] = key.split('-').map(Number)
    const monthLabelText = formatMonthLabel(new Date(year, month - 1, 1))
    return monthLabelText.charAt(0).toUpperCase() + monthLabelText.slice(1)
  }

  function DocumentRow({ doc }: { doc: InvoiceDocument }): React.JSX.Element {
    const client = clients[doc.clientId]
    const totals = computeDocumentTotals(doc.lignes)
    const basePath = type === 'devis' ? 'devis' : 'factures'
    return (
      <tr className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/60">
        <td className="px-4 py-3">
          <Link
            to={`/facturation/${basePath}/${doc.id}`}
            className="font-medium text-slate-900 dark:text-slate-100 hover:text-brand-600"
          >
            {doc.numero}
          </Link>
        </td>
        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
          {client ? `${client.nom}${client.prenom ? ` ${client.prenom}` : ''}` : '—'}
        </td>
        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{doc.dateEmission}</td>
        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-medium">
          {formatMontant(totals.totalTTC)}
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${DOCUMENT_STATUT_STYLES[doc.statut]}`}
          >
            {DOCUMENT_STATUT_LABELS[doc.statut]}
          </span>
        </td>
        <td className="px-2 py-3">
          <div className="flex items-center gap-1">
            <PrintButton
              to={`/facturation/${basePath}/${doc.id}?action=imprimer`}
              title={`Imprimer ce ${label}`}
            />
            <PdfButton
              to={`/facturation/${basePath}/${doc.id}?action=pdf`}
              title={`Enregistrer ce ${label} en PDF`}
            />
            <EditButton to={`/facturation/${basePath}/${doc.id}/modifier`} title={`Modifier ce ${label}`} />
            <DeleteButton
              title={`Supprimer ce ${label}`}
              onConfirm={async () => {
                await window.api.documents.delete(doc.id)
                reload()
              }}
            />
          </div>
        </td>
      </tr>
    )
  }

  function TableHead(): React.JSX.Element {
    return (
      <thead>
        <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-400 dark:text-slate-500">
          <th className="px-4 py-3 font-medium">N°</th>
          <th className="px-4 py-3 font-medium">Client</th>
          <th className="px-4 py-3 font-medium">Date</th>
          <th className="px-4 py-3 font-medium text-right">Total TTC</th>
          <th className="px-4 py-3 font-medium">Statut</th>
          <th className="w-28" />
        </tr>
      </thead>
    )
  }

  return (
    <div className="p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {documents.length} {label}
          {documents.length > 1 ? 's' : ''}
        </p>
        <Link
          to={`/facturation/${type === 'devis' ? 'devis' : 'factures'}/nouveau`}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          + Nouveau {label}
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un numéro..."
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as DocumentStatut | 'tous')}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="tous">Tous les statuts</option>
          {statutsDisponibles.map((s) => (
            <option key={s} value={s}>
              {DOCUMENT_STATUT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400 dark:text-slate-500">
          Chargement...
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400 dark:text-slate-500">
          Aucun{type === 'devis' ? '' : 'e'} {label} pour le moment.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([monthKey, monthDocs]) => {
            const monthTotal = monthDocs.reduce(
              (sum, d) => sum + computeDocumentTotals(d.lignes).totalTTC,
              0
            )
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
                  <TableHead />
                  <tbody>
                    {monthDocs.map((doc) => (
                      <DocumentRow key={doc.id} doc={doc} />
                    ))}
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
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
