import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { BillingProfileInput, RegimeTva, StatutJuridique } from '../../../../shared/types'
import { REGIME_TVA_LABELS, STATUT_JURIDIQUE_LABELS } from '../../../../shared/types'
import { fileToResizedDataUrl } from '../../lib/image'

const DEFAULT_MENTIONS = `Pas d'escompte pour paiement anticipé.
En cas de retard de paiement, une pénalité au taux annuel de 10% sera appliquée, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 €.`

function emptyForm(): BillingProfileInput {
  return {
    nom: '',
    statutJuridique: 'auto_entrepreneur',
    raisonSociale: '',
    siret: '',
    tvaIntracom: '',
    regimeTva: 'franchise_en_base',
    adresse: '',
    codePostal: '',
    ville: '',
    pays: 'France',
    telephone: '',
    email: '',
    iban: '',
    bic: '',
    logo: null,
    prefixeFacture: 'FA-',
    prochainNumeroFacture: 1,
    prefixeDevis: 'DE-',
    prochainNumeroDevis: 1,
    conditionsPaiementParDefaut: 'Paiement à réception, 30 jours maximum.',
    mentionsLegales: DEFAULT_MENTIONS,
    parDefaut: false
  }
}

function normalize(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export default function ProfileFormPage(): React.JSX.Element {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<BillingProfileInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    window.api.billingProfiles.get(id).then((profile) => {
      if (profile) {
        setForm({
          nom: profile.nom,
          statutJuridique: profile.statutJuridique,
          raisonSociale: profile.raisonSociale,
          siret: profile.siret ?? '',
          tvaIntracom: profile.tvaIntracom ?? '',
          regimeTva: profile.regimeTva,
          adresse: profile.adresse ?? '',
          codePostal: profile.codePostal ?? '',
          ville: profile.ville ?? '',
          pays: profile.pays,
          telephone: profile.telephone ?? '',
          email: profile.email ?? '',
          iban: profile.iban ?? '',
          bic: profile.bic ?? '',
          logo: profile.logo,
          prefixeFacture: profile.prefixeFacture,
          prochainNumeroFacture: profile.prochainNumeroFacture,
          prefixeDevis: profile.prefixeDevis,
          prochainNumeroDevis: profile.prochainNumeroDevis,
          conditionsPaiementParDefaut: profile.conditionsPaiementParDefaut ?? '',
          mentionsLegales: profile.mentionsLegales ?? '',
          parDefaut: profile.parDefaut
        })
      }
      setLoading(false)
    })
  }, [id])

  function update<K extends keyof BillingProfileInput>(key: K, value: BillingProfileInput[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      update('logo', dataUrl)
    } catch {
      setError("Impossible de charger cette image comme logo.")
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)

    if (form.nom.trim() === '' || form.raisonSociale.trim() === '') {
      setError('Le nom du profil et la raison sociale sont obligatoires.')
      return
    }

    setSaving(true)
    const payload: BillingProfileInput = {
      ...form,
      nom: form.nom.trim(),
      raisonSociale: form.raisonSociale.trim(),
      siret: normalize(form.siret ?? ''),
      tvaIntracom: normalize(form.tvaIntracom ?? ''),
      adresse: normalize(form.adresse ?? ''),
      codePostal: normalize(form.codePostal ?? ''),
      ville: normalize(form.ville ?? ''),
      telephone: normalize(form.telephone ?? ''),
      email: normalize(form.email ?? ''),
      iban: normalize(form.iban ?? ''),
      bic: normalize(form.bic ?? ''),
      conditionsPaiementParDefaut: normalize(form.conditionsPaiementParDefaut ?? ''),
      mentionsLegales: normalize(form.mentionsLegales ?? '')
    }

    try {
      if (isEdit && id) {
        await window.api.billingProfiles.update(id, payload)
      } else {
        await window.api.billingProfiles.create(payload)
      }
      navigate('/facturation/profils')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-slate-400 dark:text-slate-500">Chargement...</div>
  }

  return (
    <div className="p-8 pt-6 max-w-2xl mx-auto">
      <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
        {isEdit ? 'Modifier le profil' : 'Nouveau profil de facturation'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        {error && <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 text-sm px-3 py-2">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nom du profil *</span>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => update('nom', e.target.value)}
              placeholder="Ex : Activité principale"
              className="input"
              required
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Statut juridique</span>
            <select
              value={form.statutJuridique}
              onChange={(e) => update('statutJuridique', e.target.value as StatutJuridique)}
              className="input"
            >
              {Object.entries(STATUT_JURIDIQUE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Raison sociale / nom affiché sur les documents *
          </span>
          <input
            type="text"
            value={form.raisonSociale}
            onChange={(e) => update('raisonSociale', e.target.value)}
            className="input"
            required
          />
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Logo (facture, devis, relevés)
          </span>
          <div className="flex items-center gap-3">
            {form.logo && (
              <img
                src={form.logo}
                alt="Logo"
                className="h-16 w-16 object-contain rounded border border-slate-200 dark:border-slate-700 bg-white p-1"
              />
            )}
            <div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoChange}
                className="text-sm text-slate-600 dark:text-slate-300"
              />
              {form.logo && (
                <button
                  type="button"
                  onClick={() => update('logo', null)}
                  className="block mt-1 text-xs text-red-600 hover:text-red-700"
                >
                  Supprimer le logo
                </button>
              )}
            </div>
          </div>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">SIRET</span>
            <input
              type="text"
              value={form.siret ?? ''}
              onChange={(e) => update('siret', e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Régime de TVA</span>
            <select
              value={form.regimeTva}
              onChange={(e) => update('regimeTva', e.target.value as RegimeTva)}
              className="input"
            >
              {Object.entries(REGIME_TVA_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {form.regimeTva !== 'franchise_en_base' && (
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">N° TVA intracommunautaire</span>
            <input
              type="text"
              value={form.tvaIntracom ?? ''}
              onChange={(e) => update('tvaIntracom', e.target.value)}
              className="input"
            />
          </label>
        )}

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Adresse</span>
          <input
            type="text"
            value={form.adresse ?? ''}
            onChange={(e) => update('adresse', e.target.value)}
            className="input"
          />
        </label>

        <div className="grid grid-cols-3 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Code postal</span>
            <input
              type="text"
              value={form.codePostal ?? ''}
              onChange={(e) => update('codePostal', e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Ville</span>
            <input
              type="text"
              value={form.ville ?? ''}
              onChange={(e) => update('ville', e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Pays</span>
            <input
              type="text"
              value={form.pays}
              onChange={(e) => update('pays', e.target.value)}
              className="input"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Téléphone</span>
            <input
              type="text"
              value={form.telephone ?? ''}
              onChange={(e) => update('telephone', e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</span>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={(e) => update('email', e.target.value)}
              className="input"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">IBAN</span>
            <input
              type="text"
              value={form.iban ?? ''}
              onChange={(e) => update('iban', e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">BIC</span>
            <input
              type="text"
              value={form.bic ?? ''}
              onChange={(e) => update('bic', e.target.value)}
              className="input"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Préfixe factures</span>
            <input
              type="text"
              value={form.prefixeFacture}
              onChange={(e) => update('prefixeFacture', e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Prochain n° de facture</span>
            <input
              type="number"
              min={1}
              value={form.prochainNumeroFacture}
              onChange={(e) => update('prochainNumeroFacture', Number(e.target.value))}
              className="input"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Préfixe devis</span>
            <input
              type="text"
              value={form.prefixeDevis}
              onChange={(e) => update('prefixeDevis', e.target.value)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Prochain n° de devis</span>
            <input
              type="number"
              min={1}
              value={form.prochainNumeroDevis}
              onChange={(e) => update('prochainNumeroDevis', Number(e.target.value))}
              className="input"
            />
          </label>
        </div>

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Conditions de paiement par défaut</span>
          <input
            type="text"
            value={form.conditionsPaiementParDefaut ?? ''}
            onChange={(e) => update('conditionsPaiementParDefaut', e.target.value)}
            className="input"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Mentions légales (pied de page des documents)
          </span>
          <textarea
            value={form.mentionsLegales ?? ''}
            onChange={(e) => update('mentionsLegales', e.target.value)}
            rows={4}
            className="input"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.parDefaut}
            onChange={(e) => update('parDefaut', e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          Utiliser ce profil par défaut pour les nouveaux devis/factures
        </label>

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
