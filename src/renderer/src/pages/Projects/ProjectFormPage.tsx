import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { Client, ProjectInput, ProjectStatut } from '../../../../shared/types'
import { PROJECT_STATUT_LABELS } from '../../lib/meta'

const emptyForm: ProjectInput = {
  nom: '',
  clientId: null,
  statut: 'prospect',
  description: '',
  dateLivraison: ''
}

function normalize(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export default function ProjectFormPage(): React.JSX.Element {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<ProjectInput>(emptyForm)
  const [clients, setClients] = useState<Client[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.clients.list({ statut: 'tous' }).then(setClients)
  }, [])

  useEffect(() => {
    if (!id) {
      const clientIdFromQuery = searchParams.get('clientId')
      if (clientIdFromQuery) {
        setForm((prev) => ({ ...prev, clientId: clientIdFromQuery }))
      }
      return
    }
    window.api.projects.get(id).then((project) => {
      if (project) {
        setForm({
          nom: project.nom,
          clientId: project.clientId,
          statut: project.statut,
          description: project.description ?? '',
          dateLivraison: project.dateLivraison ?? ''
        })
      }
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function update<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)

    if (form.nom.trim() === '') {
      setError('Le nom du projet est obligatoire.')
      return
    }

    setSaving(true)
    const payload: ProjectInput = {
      ...form,
      nom: form.nom.trim(),
      description: normalize(form.description ?? ''),
      dateLivraison: normalize(form.dateLivraison ?? '')
    }

    try {
      if (isEdit && id) {
        await window.api.projects.update(id, payload)
        navigate(`/projets/${id}`)
      } else {
        const created = await window.api.projects.create(payload)
        navigate(`/projets/${created.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-slate-400">Chargement...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">
        {isEdit ? 'Modifier le projet' : 'Nouveau projet'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border border-slate-200 p-6">
        {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 mb-1">Nom du projet *</span>
          <input
            type="text"
            value={form.nom}
            onChange={(e) => update('nom', e.target.value)}
            className="input"
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 mb-1">Client</span>
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
            <span className="block text-xs font-medium text-slate-500 mb-1">Statut</span>
            <select
              value={form.statut}
              onChange={(e) => update('statut', e.target.value as ProjectStatut)}
              className="input"
            >
              {Object.entries(PROJECT_STATUT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 mb-1">Livraison prévue</span>
          <input
            type="date"
            value={form.dateLivraison ?? ''}
            onChange={(e) => update('dateLivraison', e.target.value)}
            className="input max-w-xs"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 mb-1">Description</span>
          <textarea
            value={form.description ?? ''}
            onChange={(e) => update('description', e.target.value)}
            rows={4}
            className="input"
          />
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
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
      </form>
    </div>
  )
}
