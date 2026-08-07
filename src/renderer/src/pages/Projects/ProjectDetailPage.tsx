import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Client, Event, Project } from '../../../../shared/types'
import {
  CATEGORIE_LABELS,
  CATEGORIE_STYLES,
  EVENT_STATUT_LABELS,
  PROJECT_STATUT_LABELS,
  PROJECT_STATUT_STYLES
} from '../../lib/meta'

export default function ProjectDetailPage(): React.JSX.Element {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  async function reload(): Promise<void> {
    if (!id) return
    const proj = await window.api.projects.get(id)
    setProject(proj)
    if (proj?.clientId) {
      const c = await window.api.clients.get(proj.clientId)
      setClient(c)
    } else {
      setClient(null)
    }
    const evts = await window.api.events.list({ projetId: id })
    setEvents(evts)
    setLoading(false)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleDelete(): Promise<void> {
    if (!id) return
    await window.api.projects.delete(id)
    navigate('/projets')
  }

  if (loading) {
    return <div className="p-8 text-sm text-slate-400">Chargement...</div>
  }

  if (!project) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500">Projet introuvable.</p>
        <Link to="/projets" className="text-brand-600 text-sm">
          ← Retour à la liste
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link to="/projets" className="text-sm text-slate-500 hover:text-brand-600">
        ← Retour à la liste
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{project.nom}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {client ? (
              <Link to={`/clients/${client.id}`} className="hover:text-brand-600">
                {client.nom}
                {client.prenom ? ` ${client.prenom}` : ''}
              </Link>
            ) : (
              'Sans client'
            )}
            {' · '}
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PROJECT_STATUT_STYLES[project.statut]}`}
            >
              {PROJECT_STATUT_LABELS[project.statut]}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/projets/${project.id}/modifier`}
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
            Supprimer définitivement ce projet ? Les événements liés resteront dans l'agenda
            mais ne seront plus rattachés à un projet.
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

      {project.dateLivraison && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-medium text-slate-500 mb-1">Livraison prévue</h3>
          <p className="text-sm text-slate-800">{project.dateLivraison}</p>
        </div>
      )}

      {project.description && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-medium text-slate-500 mb-2">Description</h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{project.description}</p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">Étapes et échéances</h3>
        <Link
          to={`/agenda/nouveau?projetId=${project.id}${client ? `&clientId=${client.id}` : ''}`}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          + Ajouter une étape
        </Link>
      </div>

      <div className="mt-3 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {events.length === 0 ? (
          <div className="p-4 text-sm text-slate-400">Aucune étape planifiée pour ce projet.</div>
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              to={`/agenda/${event.id}/modifier`}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{event.titre}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {event.date}
                  {event.heureDebut ? ` à ${event.heureDebut}` : ''} ·{' '}
                  {EVENT_STATUT_LABELS[event.statut]}
                </p>
              </div>
              <span
                className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${CATEGORIE_STYLES[event.categorie]}`}
              >
                {CATEGORIE_LABELS[event.categorie]}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
