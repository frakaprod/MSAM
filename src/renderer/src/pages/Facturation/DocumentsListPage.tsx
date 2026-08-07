import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Client, DocumentStatut, DocumentType, InvoiceDocument } from '../../../../shared/types'
import { computeDocumentTotals } from '../../../../shared/invoiceCalc'
import {
  DEVIS_STATUTS,
  FACTURE_STATUTS
} from '../../../../shared/types'
import { DOCUMENT_STATUT_LABELS, DOCUMENT_STATUT_STYLES, formatMontant } from '../../lib/meta'
import DeleteButton from '../../components/DeleteButton'
import EditButton from '../../components/EditButton'

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

  return (
    <div className="p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">
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
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as DocumentStatut | 'tous')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="tous">Tous les statuts</option>
          {statutsDisponibles.map((s) => (
            <option key={s} value={s}>
              {DOCUMENT_STATUT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Chargement...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Aucun{type === 'devis' ? '' : 'e'} {label} pour le moment.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="px-4 py-3 font-medium">N°</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Total TTC</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const client = clients[doc.clientId]
                const totals = computeDocumentTotals(doc.lignes)
                return (
                  <tr key={doc.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/facturation/${type === 'devis' ? 'devis' : 'factures'}/${doc.id}`}
                        className="font-medium text-slate-900 hover:text-brand-600"
                      >
                        {doc.numero}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {client ? `${client.nom}${client.prenom ? ` ${client.prenom}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{doc.dateEmission}</td>
                    <td className="px-4 py-3 text-right text-slate-700 font-medium">
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
                        <EditButton
                          to={`/facturation/${type === 'devis' ? 'devis' : 'factures'}/${doc.id}/modifier`}
                          title={`Modifier ce ${label}`}
                        />
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
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
