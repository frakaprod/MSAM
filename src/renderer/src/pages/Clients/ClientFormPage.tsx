import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ClientInput, ClientType, ClientStatut } from '../../../../shared/types'

const emptyForm: ClientInput = {
  type: 'particulier',
  nom: '',
  prenom: '',
  siret: '',
  email: '',
  telephone: '',
  adresse: '',
  codePostal: '',
  ville: '',
  pays: 'France',
  contactNom: '',
  notes: '',
  tags: [],
  statut: 'prospect'
}

function normalize(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export default function ClientFormPage(): React.JSX.Element {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<ClientInput>(emptyForm)
  const [tagsInput, setTagsInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    window.api.clients.get(id).then((client) => {
      if (client) {
        setForm({
          type: client.type,
          nom: client.nom,
          prenom: client.prenom ?? '',
          siret: client.siret ?? '',
          email: client.email ?? '',
          telephone: client.telephone ?? '',
          adresse: client.adresse ?? '',
          codePostal: client.codePostal ?? '',
          ville: client.ville ?? '',
          pays: client.pays,
          contactNom: client.contactNom ?? '',
          notes: client.notes ?? '',
          tags: client.tags,
          statut: client.statut
        })
        setTagsInput(client.tags.join(', '))
      }
      setLoading(false)
    })
  }, [id])

  function update<K extends keyof ClientInput>(key: K, value: ClientInput[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)

    if (form.nom.trim() === '') {
      setError('Le nom (ou la raison sociale) est obligatoire.')
      return
    }

    setSaving(true)
    const payload: ClientInput = {
      ...form,
      nom: form.nom.trim(),
      prenom: normalize(form.prenom ?? ''),
      siret: normalize(form.siret ?? ''),
      email: normalize(form.email ?? ''),
      telephone: normalize(form.telephone ?? ''),
      adresse: normalize(form.adresse ?? ''),
      codePostal: normalize(form.codePostal ?? ''),
      ville: normalize(form.ville ?? ''),
      contactNom: normalize(form.contactNom ?? ''),
      notes: normalize(form.notes ?? ''),
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t !== '')
    }

    try {
      if (isEdit && id) {
        await window.api.clients.update(id, payload)
        navigate(`/clients/${id}`)
      } else {
        const created = await window.api.clients.create(payload)
        navigate(`/clients/${created.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-slate-400 dark:text-slate-500">Chargement...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        {isEdit ? 'Modifier le client' : 'Nouveau client'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 text-sm px-3 py-2">{error}</div>
        )}

        <div className="flex gap-4">
          {(['particulier', 'entreprise'] as ClientType[]).map((t) => (
            <label
              key={t}
              className={`flex-1 cursor-pointer rounded-lg border px-4 py-2 text-sm text-center capitalize ${
                form.type === t
                  ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40 text-brand-700 font-medium'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
              }`}
            >
              <input
                type="radio"
                name="type"
                value={t}
                checked={form.type === t}
                onChange={() => update('type', t)}
                className="sr-only"
              />
              {t}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={form.type === 'entreprise' ? 'Raison sociale *' : 'Nom *'}>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => update('nom', e.target.value)}
              className="input"
              required
            />
          </Field>
          {form.type === 'particulier' && (
            <Field label="Prénom">
              <input
                type="text"
                value={form.prenom ?? ''}
                onChange={(e) => update('prenom', e.target.value)}
                className="input"
              />
            </Field>
          )}
          {form.type === 'entreprise' && (
            <Field label="Personne à contacter">
              <input
                type="text"
                value={form.contactNom ?? ''}
                onChange={(e) => update('contactNom', e.target.value)}
                className="input"
              />
            </Field>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => update('email', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Téléphone">
            <input
              type="tel"
              value={form.telephone ?? ''}
              onChange={(e) => update('telephone', e.target.value)}
              className="input"
            />
          </Field>
        </div>

        {form.type === 'entreprise' && (
          <Field label="SIRET">
            <input
              type="text"
              value={form.siret ?? ''}
              onChange={(e) => update('siret', e.target.value)}
              className="input"
            />
          </Field>
        )}

        <Field label="Adresse">
          <input
            type="text"
            value={form.adresse ?? ''}
            onChange={(e) => update('adresse', e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Code postal">
            <input
              type="text"
              value={form.codePostal ?? ''}
              onChange={(e) => update('codePostal', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Ville">
            <input
              type="text"
              value={form.ville ?? ''}
              onChange={(e) => update('ville', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Pays">
            <input
              type="text"
              value={form.pays}
              onChange={(e) => update('pays', e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Statut">
            <select
              value={form.statut}
              onChange={(e) => update('statut', e.target.value as ClientStatut)}
              className="input"
            >
              <option value="prospect">Prospect</option>
              <option value="actif">Actif</option>
              <option value="archive">Archivé</option>
            </select>
          </Field>
          <Field label="Tags (séparés par une virgule)">
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="mariage, corporate, urgent..."
              className="input"
            />
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => update('notes', e.target.value)}
            rows={4}
            className="input"
          />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
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
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  )
}
