import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Client, Project, ProjectStatut } from '../../../../shared/types'
import { PROJECT_STATUT_LABELS, PROJECT_STATUT_STYLES } from '../../lib/meta'
import DeleteButton from '../../components/DeleteButton'

export default function ProjectsListPage(): React.JSX.Element {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Record<string, Client>>({})
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<ProjectStatut | 'tous'>('tous')
  const [loading, setLoading] = useState(true)

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
      const data = await window.api.projects.list({ search, statut: statutFilter })
      setProjects(data)
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

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Projets</h2>
          <p className="text-sm text-slate-500 mt-1">
            {projects.length} projet{projects.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/projets/nouveau"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          + Nouveau projet
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un projet..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as ProjectStatut | 'tous')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="tous">Tous les statuts</option>
          {Object.entries(PROJECT_STATUT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Chargement...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Aucun projet pour le moment.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="px-4 py-3 font-medium">Projet</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Livraison prévue</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const client = project.clientId ? clients[project.clientId] : null
                return (
                  <tr
                    key={project.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/projets/${project.id}`}
                        className="font-medium text-slate-900 hover:text-brand-600"
                      >
                        {project.nom}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {client ? (
                        <Link to={`/clients/${client.id}`} className="hover:text-brand-600">
                          {client.nom}
                          {client.prenom ? ` ${client.prenom}` : ''}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{project.dateLivraison || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PROJECT_STATUT_STYLES[project.statut]}`}
                      >
                        {PROJECT_STATUT_LABELS[project.statut]}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <DeleteButton
                        title="Supprimer ce projet"
                        onConfirm={async () => {
                          await window.api.projects.delete(project.id)
                          reload()
                        }}
                      />
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
