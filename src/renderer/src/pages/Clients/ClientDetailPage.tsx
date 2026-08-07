import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Client, Project } from '../../../../shared/types'
import { PROJECT_STATUT_LABELS, PROJECT_STATUT_STYLES } from '../../lib/meta'

export default function ClientDetailPage(): React.JSX.Element {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!id) return
    window.api.clients.get(id).then((data) => {
      setClient(data)
      setLoading(false)
    })
    window.api.projects.list({ clientId: id, statut: 'tous' }).then(setProjects)
  }, [id])

  async function handleDelete(): Promise<void> {
    if (!id) return
    await window.api.clients.delete(id)
    navigate('/clients')
  }

  if (loading) {
    return <div className="p-8 text-sm text-slate-400">Chargement...</div>
  }

  if (!client) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500">Client introuvable.</p>
        <Link to="/clients" className="text-brand-600 text-sm">
          ← Retour à la liste
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link to="/clients" className="text-sm text-slate-500 hover:text-brand-600">
        ← Retour à la liste
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {client.nom}
            {client.prenom ? ` ${client.prenom}` : ''}
          </h2>
          <p className="text-sm text-slate-500 capitalize mt-1">
            {client.type} · {client.statut}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/clients/${client.id}/modifier`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Modifier
          </Link>
          <button
            onClick={() => setConfirmingDelete(true)}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Supprimer
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
          <p className="text-red-700">
            Supprimer définitivement ce client ? Cette action est irréversible.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDelete}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-white font-medium hover:bg-red-700"
            >
              Oui, supprimer
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <InfoCard label="Email" value={client.email} />
        <InfoCard label="Téléphone" value={client.telephone} />
        {client.type === 'entreprise' && (
          <>
            <InfoCard label="SIRET" value={client.siret} />
            <InfoCard label="Contact" value={client.contactNom} />
          </>
        )}
        <InfoCard
          label="Adresse"
          value={
            [client.adresse, [client.codePostal, client.ville].filter(Boolean).join(' '), client.pays]
              .filter(Boolean)
              .join(', ') || null
          }
        />
      </div>

      {client.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {client.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-200 text-slate-700 text-xs px-2.5 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {client.notes && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-medium text-slate-500 mb-2">Notes</h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">Projets</h3>
        <Link
          to={`/projets/nouveau?clientId=${client.id}`}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          + Nouveau projet
        </Link>
      </div>
      <div className="mt-3 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {projects.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">Aucun projet pour ce client.</div>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              to={`/projets/${project.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{project.nom}</p>
                {project.dateLivraison && (
                  <p className="text-xs text-slate-500 mt-0.5">Livraison : {project.dateLivraison}</p>
                )}
              </div>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PROJECT_STATUT_STYLES[project.statut]}`}
              >
                {PROJECT_STATUT_LABELS[project.statut]}
              </span>
            </Link>
          ))
        )}
      </div>

      <div className="mt-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-sm text-slate-400">
        Les factures liées à ce client apparaîtront ici (module à venir).
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string | null }): React.JSX.Element {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-xs font-medium text-slate-500 mb-1">{label}</h3>
      <p className="text-sm text-slate-800">{value || '—'}</p>
    </div>
  )
}
