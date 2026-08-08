import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { SupplierInvoice, SupplierInvoiceStatut } from '../../../../shared/types'
import { SUPPLIER_INVOICE_STATUTS } from '../../../../shared/types'
import {
  SUPPLIER_INVOICE_STATUT_LABELS,
  SUPPLIER_INVOICE_STATUT_STYLES,
  formatMontant
} from '../../lib/meta'
import DeleteButton from '../../components/DeleteButton'
import EditButton from '../../components/EditButton'

export default function SupplierInvoicesListPage(): React.JSX.Element {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([])
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<SupplierInvoiceStatut | 'tous'>('tous')
  const [loading, setLoading] = useState(true)

  async function reload(): Promise<void> {
    setLoading(true)
    try {
      const data = await window.api.supplierInvoices.list({ search, statut: statutFilter })
      setInvoices(data)
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
  }, [search, statutFilter])

  const total = invoices.reduce((sum, i) => sum + i.montantTTC, 0)

  return (
    <div className="p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {invoices.length} facture{invoices.length > 1 ? 's' : ''} fournisseur
          {invoices.length > 1 ? 's' : ''} · Total {formatMontant(total)}
        </p>
        <Link
          to="/facturation/fournisseurs/nouveau"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          + Nouvelle facture fournisseur
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un fournisseur, un numéro, une catégorie..."
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as SupplierInvoiceStatut | 'tous')}
          className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="tous">Tous les statuts</option>
          {SUPPLIER_INVOICE_STATUTS.map((s) => (
            <option key={s} value={s}>
              {SUPPLIER_INVOICE_STATUT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">Chargement...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Aucune facture fournisseur pour le moment.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs uppercase text-slate-400 dark:text-slate-500">
                <th className="px-4 py-3 font-medium">Fournisseur</th>
                <th className="px-4 py-3 font-medium">N° facture</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium text-right">Total TTC</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/facturation/fournisseurs/${invoice.id}/modifier`}
                      className="font-medium text-slate-900 dark:text-slate-100 hover:text-brand-600"
                    >
                      {invoice.fournisseur}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {invoice.numero || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{invoice.dateFacture}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {invoice.categorie || '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-medium">
                    {formatMontant(invoice.montantTTC)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${SUPPLIER_INVOICE_STATUT_STYLES[invoice.statut]}`}
                    >
                      {SUPPLIER_INVOICE_STATUT_LABELS[invoice.statut]}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1">
                      <EditButton
                        to={`/facturation/fournisseurs/${invoice.id}/modifier`}
                        title="Modifier cette facture fournisseur"
                      />
                      <DeleteButton
                        title="Supprimer cette facture fournisseur"
                        onConfirm={async () => {
                          await window.api.supplierInvoices.delete(invoice.id)
                          reload()
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
