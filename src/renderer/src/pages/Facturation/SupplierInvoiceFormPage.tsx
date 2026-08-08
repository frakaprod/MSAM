import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { SupplierInvoiceInput, SupplierInvoiceStatut } from '../../../../shared/types'
import { EXPORT_SUBFOLDERS } from '../../../../shared/exportFolders'
import { todayISO } from '../../lib/dateUtils'
import { fileToDataUrl } from '../../lib/file'

const CATEGORIES_SUGGESTIONS = [
  'Matériel',
  'Logiciel / Abonnement',
  'Sous-traitance',
  'Déplacement',
  'Frais bancaires',
  'Assurance',
  'Fournitures',
  'Autre'
]

const emptyForm: SupplierInvoiceInput = {
  fournisseur: '',
  numero: '',
  dateFacture: todayISO(),
  montantHT: null,
  montantTVA: null,
  montantTTC: 0,
  categorie: '',
  statut: 'a_payer',
  datePaiement: null,
  notes: '',
  fichier: null
}

function normalize(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export default function SupplierInvoiceFormPage(): React.JSX.Element {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<SupplierInvoiceInput>(emptyForm)
  const [montantHTInput, setMontantHTInput] = useState('')
  const [montantTVAInput, setMontantTVAInput] = useState('')
  const [montantTTCInput, setMontantTTCInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    window.api.supplierInvoices.get(id).then((invoice) => {
      if (invoice) {
        setForm({
          fournisseur: invoice.fournisseur,
          numero: invoice.numero ?? '',
          dateFacture: invoice.dateFacture,
          montantHT: invoice.montantHT,
          montantTVA: invoice.montantTVA,
          montantTTC: invoice.montantTTC,
          categorie: invoice.categorie ?? '',
          statut: invoice.statut,
          datePaiement: invoice.datePaiement,
          notes: invoice.notes ?? '',
          fichier: invoice.fichier
        })
        setMontantHTInput(invoice.montantHT != null ? String(invoice.montantHT) : '')
        setMontantTVAInput(invoice.montantTVA != null ? String(invoice.montantTVA) : '')
        setMontantTTCInput(String(invoice.montantTTC))
      }
      setLoading(false)
    })
  }, [id])

  function update<K extends keyof SupplierInvoiceInput>(
    key: K,
    value: SupplierInvoiceInput[K]
  ): void {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFileError(null)
    try {
      const dataUrl = await fileToDataUrl(file)
      update('fichier', { nom: file.name, dataUrl })
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Impossible de charger ce fichier.')
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)

    if (form.fournisseur.trim() === '') {
      setError('Le nom du fournisseur est obligatoire.')
      return
    }
    const montantTTC = parseFloat(montantTTCInput)
    if (Number.isNaN(montantTTC)) {
      setError('Le montant TTC est obligatoire.')
      return
    }

    setSaving(true)
    const payload: SupplierInvoiceInput = {
      ...form,
      fournisseur: form.fournisseur.trim(),
      numero: normalize(form.numero ?? ''),
      montantHT: montantHTInput.trim() === '' ? null : parseFloat(montantHTInput),
      montantTVA: montantTVAInput.trim() === '' ? null : parseFloat(montantTVAInput),
      montantTTC,
      categorie: normalize(form.categorie ?? ''),
      datePaiement: form.statut === 'payee' ? form.datePaiement || todayISO() : null,
      notes: normalize(form.notes ?? '')
    }

    try {
      const saved =
        isEdit && id
          ? await window.api.supplierInvoices.update(id, payload)
          : await window.api.supplierInvoices.create(payload)

      // La pièce jointe (scan/PDF importé) est aussi enregistrée physiquement
      // dans le dossier "Factures fournisseurs" des documents générés, en
      // plus d'être gardée dans l'appli pour consultation rapide. Non
      // bloquant : si l'écriture disque échoue, la pièce jointe reste quand
      // même consultable/téléchargeable depuis la fiche.
      if (saved?.fichier) {
        const ext = saved.fichier.nom.includes('.')
          ? saved.fichier.nom.slice(saved.fichier.nom.lastIndexOf('.'))
          : ''
        const filename = `${saved.fournisseur} - ${saved.numero || saved.dateFacture}${ext}`
        try {
          await window.api.attachments.save({
            subfolder: EXPORT_SUBFOLDERS.facturesFournisseurs,
            filename,
            dataUrl: saved.fichier.dataUrl
          })
        } catch {
          // silencieux : cf. commentaire ci-dessus
        }
      }

      navigate('/facturation/fournisseurs')
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
        {isEdit ? 'Modifier la facture fournisseur' : 'Nouvelle facture fournisseur'}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
      >
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Fournisseur *">
            <input
              type="text"
              value={form.fournisseur}
              onChange={(e) => update('fournisseur', e.target.value)}
              className="input"
              required
            />
          </Field>
          <Field label="N° de facture">
            <input
              type="text"
              value={form.numero ?? ''}
              onChange={(e) => update('numero', e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date de la facture *">
            <input
              type="date"
              value={form.dateFacture}
              onChange={(e) => update('dateFacture', e.target.value)}
              className="input"
              required
            />
          </Field>
          <Field label="Catégorie">
            <input
              type="text"
              list="categories-fournisseurs"
              value={form.categorie ?? ''}
              onChange={(e) => update('categorie', e.target.value)}
              className="input"
            />
            <datalist id="categories-fournisseurs">
              {CATEGORIES_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Montant HT">
            <input
              type="number"
              step="0.01"
              value={montantHTInput}
              onChange={(e) => setMontantHTInput(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Montant TVA">
            <input
              type="number"
              step="0.01"
              value={montantTVAInput}
              onChange={(e) => setMontantTVAInput(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Montant TTC *">
            <input
              type="number"
              step="0.01"
              value={montantTTCInput}
              onChange={(e) => setMontantTTCInput(e.target.value)}
              className="input"
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Statut">
            <select
              value={form.statut}
              onChange={(e) => update('statut', e.target.value as SupplierInvoiceStatut)}
              className="input"
            >
              <option value="a_payer">À payer</option>
              <option value="payee">Payée</option>
            </select>
          </Field>
          {form.statut === 'payee' && (
            <Field label="Date de paiement">
              <input
                type="date"
                value={form.datePaiement ?? todayISO()}
                onChange={(e) => update('datePaiement', e.target.value)}
                className="input"
              />
            </Field>
          )}
        </div>

        <Field label="Pièce jointe (scan, PDF...)">
          <div className="flex items-center gap-3">
            {form.fichier && (
              <a
                href={form.fichier.dataUrl}
                download={form.fichier.nom}
                className="text-sm text-brand-600 hover:text-brand-700 truncate max-w-[16rem]"
              >
                {form.fichier.nom}
              </a>
            )}
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFileChange}
              className="text-sm text-slate-600 dark:text-slate-300"
            />
            {form.fichier && (
              <button
                type="button"
                onClick={() => update('fichier', null)}
                className="text-xs text-red-600 hover:text-red-700 shrink-0"
              >
                Supprimer
              </button>
            )}
          </div>
          {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
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
