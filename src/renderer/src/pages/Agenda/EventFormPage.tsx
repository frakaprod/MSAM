import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { Client, EventCategorie, EventInput, EventStatut, Project } from '../../../../shared/types'
import { CATEGORIE_LABELS, EVENT_STATUT_LABELS } from '../../lib/meta'
import { todayISO } from '../../lib/dateUtils'

function emptyForm(defaults: Partial<EventInput> = {}): EventInput {
  return {
    titre: '',
    categorie: 'rdv_client',
    date: todayISO(),
    heureDebut: '',
    heureFin: '',
    lieu: '',
    clientId: null,
    projetId: null,
    notes: '',
    statut: 'a_faire',
    ...defaults
  }
}

function normalize(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export default function EventFormPage(): React.JSX.Element {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<EventInput>(() =>
    emptyForm({
      date: searchParams.get('date') || todayISO(),
      projetId: searchParams.get('projetId'),
      clientId: searchParams.get('clientId')
    })
  )
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.clients.list({ statut: 'tous' }).then(setClients)
    window.api.projects.list({ statut: 'tous' }).then(setProjects)
  }, [])

  useEffect(() => {
    if (!id) return
    window.api.events.get(id).then((event) => {
      if (event) {
        setForm({
          titre: event.titre,
          categorie: event.categorie,
          date: event.date,
          heureDebut: event.heureDebut ?? '',
          heureFin: event.heureFin ?? '',
          lieu: event.lieu ?? '',
          clientId: event.clientId,
          projetId: event.projetId,
          notes: event.notes ?? '',
          statut: event.statut
        })
      }
      setLoading(false)
    })
  }, [id])

  function update<K extends keyof EventInput>(key: K, value: EventInput[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)

    if (form.titre.trim() === '') {
      setError('Le titre est obligatoire.')
      return
    }
    if (form.date.trim() === '') {
      setError('La date est obligatoire.')
      return
    }

    setSaving(true)
    const payload: EventInput = {
      ...form,
      titre: form.titre.trim(),
      heureDebut: normalize(form.heureDebut ?? ''),
      heureFin: normalize(form.heureFin ?? ''),
      lieu: normalize(form.lieu ?? ''),
      notes: normalize(form.notes ?? '')
    }

    try {
      if (isEdit && id) {
        await window.api.events.update(id, payload)
      } else {
        await window.api.events.create(payload)
      }
      navigate('/agenda')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(): Promise<void> {
    if (!id) return
    await window.api.events.delete(id)
    navigate('/agenda')
  }

  if (loading) {
    return <div className="p-8 text-sm text-slate-400 dark:text-slate-500">Chargement...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        {isEdit ? "Modifier l'événement" : 'Nouvel événement'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        {error && <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 text-sm px-3 py-2">{error}</div>}

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Titre *</span>
          <input
            type="text"
            value={form.titre}
            onChange={(e) => update('titre', e.target.value)}
            className="input"
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Catégorie</span>
            <select
              value={form.categorie}
              onChange={(e) => update('categorie', e.target.value as EventCategorie)}
              className="input"
            >
              {Object.entries(CATEGORIE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Statut</span>
            <select
              value={form.statut}
              onChange={(e) => update('statut', e.target.value as EventStatut)}
              className="input"
            >
              {Object.entries(EVENT_STATUT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date *</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              className="input"
              required
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Heure début</span>
            <input
              type="time"
              value={form.heureDebut ?? ''}
              onChange={(e) => update('heureDebut', e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Heure fin</span>
            <input
              type="time"
              value={form.heureFin ?? ''}
              onChange={(e) => update('heureFin', e.target.value)}
              className="input"
            />
          </label>
        </div>

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Lieu</span>
          <input
            type="text"
            value={form.lieu ?? ''}
            onChange={(e) => update('lieu', e.target.value)}
            className="input"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Client lié</span>
            <select
              value={form.clientId ?? ''}
              onChange={(e) => update('clientId', e.target.value || null)}
              className="input"
            >
              <option value="">— Aucun —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                  {c.prenom ? ` ${c.prenom}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Projet lié</span>
            <select
              value={form.projetId ?? ''}
              onChange={(e) => update('projetId', e.target.value || null)}
              className="input"
            >
              <option value="">— Aucun —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes</span>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
            className="input"
          />
        </label>

        <div className="flex justify-between items-center pt-2">
          <div>
            {isEdit &&
              (confirmingDelete ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-red-700">Confirmer ?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-white font-medium hover:bg-red-700"
                  >
                    Oui, supprimer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Supprimer l'événement
                </button>
              ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
