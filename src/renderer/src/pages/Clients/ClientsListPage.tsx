import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Client, ClientStatut } from '../../../../shared/types'
import DeleteButton from '../../components/DeleteButton'
import EditButton from '../../components/EditButton'

const STATUT_LABELS: Record<ClientStatut, string> = {
  prospect: 'Prospect',
  actif: 'Actif',
  archive: 'Archivé'
}

const STATUT_STYLES: Record<ClientStatut, string> = {
  prospect: 'bg-amber-100 text-amber-800',
  actif: 'bg-emerald-100 text-emerald-800',
  archive: 'bg-slate-200 text-slate-600'
}

export default function ClientsListPage(): React.JSX.Element {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<ClientStatut | 'tous'>('tous')
  const [loading, setLoading] = useState(true)

  async function reload(): Promise<void> {
    setLoading(true)
    try {
      const data = await window.api.clients.list({
        search,
        statut: statutFilter
      })
      setClients(data)
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

  const counts = useMemo(() => {
    return {
      total: clients.length
    }
  }, [clients])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Base clients</h2>
          <p className="text-sm text-slate-500 mt-1">
            {counts.total} client{counts.total > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/clients/nouveau"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          + Nouveau client
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, email, téléphone, SIRET, ville...)"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as ClientStatut | 'tous')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="tous">Tous les statuts</option>
          <option value="prospect">Prospect</option>
          <option value="actif">Actif</option>
          <option value="archive">Archivé</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Chargement...</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Aucun client pour le moment.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Ville</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link to={`/clients/${client.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                      {client.nom}
                      {client.prenom ? ` ${client.prenom}` : ''}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500 capitalize">{client.type}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {client.email || client.telephone || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{client.ville || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_STYLES[client.statut]}`}
                    >
                      {STATUT_LABELS[client.statut]}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1">
                      <EditButton to={`/clients/${client.id}/modifier`} title="Modifier ce client" />
                      <DeleteButton
                        title="Supprimer ce client"
                        onConfirm={async () => {
                          await window.api.clients.delete(client.id)
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
