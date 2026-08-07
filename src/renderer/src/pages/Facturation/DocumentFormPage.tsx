import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type {
  BillingProfile,
  Client,
  DocumentLigne,
  DocumentStatut,
  DocumentType,
  InvoiceDocumentInput,
  Project
} from '../../../../shared/types'
import { DEVIS_STATUTS, FACTURE_STATUTS } from '../../../../shared/types'
import { computeDocumentTotals } from '../../../../shared/invoiceCalc'
import { DOCUMENT_STATUT_LABELS, formatMontant } from '../../lib/meta'
import { todayISO } from '../../lib/dateUtils'

const TAUX_TVA_OPTIONS = [0, 5.5, 10, 20]

function newLigne(): DocumentLigne {
  return {
    id: crypto.randomUUID(),
    designation: '',
    quantite: 1,
    prixUnitaireHT: 0,
    tauxTva: 0
  }
}

function normalize(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export default function DocumentFormPage({ type }: { type: DocumentType }): React.JSX.Element {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const basePath = type === 'devis' ? 'devis' : 'factures'
  const label = type === 'devis' ? 'devis' : 'facture'

  const [profiles, setProfiles] = useState<BillingProfile[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [existingNumero, setExistingNumero] = useState<string | null>(null)

  const [profilId, setProfilId] = useState('')
  const [clientId, setClientId] = useState(searchParams.get('clientId') || '')
  const [projetId, setProjetId] = useState<string | null>(searchParams.get('projetId'))
  const [dateEmission, setDateEmission] = useState(todayISO())
  const [dateEcheance, setDateEcheance] = useState('')
  const [statut, setStatut] = useState<DocumentStatut>('brouillon')
  const [conditionsPaiement, setConditionsPaiement] = useState('')
  const [notes, setNotes] = useState('')
  const [lignes, setLignes] = useState<DocumentLigne[]>([newLigne()])

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState<string | null>(null)

  const statutsDisponibles = type === 'devis' ? DEVIS_STATUTS : FACTURE_STATUTS
  const selectedProfile = profiles.find((p) => p.id === profilId) || null
  const franchiseEnBase = selectedProfile?.regimeTva === 'franchise_en_base'

  useEffect(() => {
    window.api.billingProfiles.list().then((list) => {
      setProfiles(list)
      if (!isEdit && list.length > 0) {
        const def = list.find((p) => p.parDefaut) || list[0]
        setProfilId(def.id)
        setConditionsPaiement(def.conditionsPaiementParDefaut || '')
      }
    })
    window.api.clients.list({ statut: 'tous' }).then(setClients)
    window.api.projects.list({ statut: 'tous' }).then(setProjects)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!id) return
    window.api.documents.get(id).then((doc) => {
      if (doc) {
        setExistingNumero(doc.numero)
        setProfilId(doc.profilId)
        setClientId(doc.clientId)
        setProjetId(doc.projetId)
        setDateEmission(doc.dateEmission)
        setDateEcheance(doc.dateEcheance ?? '')
        setStatut(doc.statut)
        setConditionsPaiement(doc.conditionsPaiement ?? '')
        setNotes(doc.notes ?? '')
        setLignes(doc.lignes.length > 0 ? doc.lignes : [newLigne()])
      }
      setLoading(false)
    })
  }, [id])

  const totals = useMemo(() => computeDocumentTotals(lignes), [lignes])

  function updateLigne(ligneId: string, patch: Partial<DocumentLigne>): void {
    setLignes((prev) => prev.map((l) => (l.id === ligneId ? { ...l, ...patch } : l)))
  }

  function removeLigne(ligneId: string): void {
    setLignes((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== ligneId) : prev))
  }

  function addLigne(): void {
    setLignes((prev) => [...prev, newLigne()])
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)

    if (!profilId) {
      setError('Sélectionne un profil de facturation (crée-en un dans l’onglet Profils si besoin).')
      return
    }
    if (!clientId) {
      setError('Sélectionne un client.')
      return
    }
    const lignesValides = lignes.filter((l) => l.designation.trim() !== '')
    if (lignesValides.length === 0) {
      setError('Ajoute au moins une ligne avec une désignation.')
      return
    }

    setSaving(true)
    const payload: InvoiceDocumentInput = {
      type,
      profilId,
      clientId,
      projetId: projetId || null,
      dateEmission,
      dateEcheance: normalize(dateEcheance),
      statut,
      lignes: lignesValides.map((l) => ({
        ...l,
        tauxTva: franchiseEnBase ? 0 : l.tauxTva
      })),
      conditionsPaiement: normalize(conditionsPaiement),
      notes: normalize(notes),
      devisOrigineId: null
    }

    try {
      if (isEdit && id) {
        await window.api.documents.update(id, payload)
        navigate(`/facturation/${basePath}/${id}`)
      } else {
        const created = await window.api.documents.create(payload)
        navigate(`/facturation/${basePath}/${created.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-slate-400">Chargement...</div>
  }

  if (!loading && profiles.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm text-slate-600">
            Il faut d'abord créer un profil de facturation (tes informations légales) avant de pouvoir
            émettre un {label}.
          </p>
          <button
            onClick={() => navigate('/facturation/profils/nouveau')}
            className="inline-block mt-4 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            + Créer mon profil de facturation
          </button>
        </div>
      </div>
    )
  }

  const filteredProjects = clientId ? projects.filter((p) => p.clientId === clientId) : projects

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">
        {isEdit ? `Modifier le ${label}` : `Nouveau ${label}`}
        {existingNumero && <span className="text-slate-400 font-normal ml-2 text-lg">{existingNumero}</span>}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border border-slate-200 p-6">
        {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 mb-1">Profil de facturation</span>
            <select value={profilId} onChange={(e) => setProfilId(e.target.value)} className="input">
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 mb-1">Client *</span>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input" required>
              <option value="">— Sélectionner —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                  {c.prenom ? ` ${c.prenom}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 mb-1">Projet lié</span>
            <select
              value={projetId ?? ''}
              onChange={(e) => setProjetId(e.target.value || null)}
              className="input"
            >
              <option value="">— Aucun —</option>
              {filteredProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 mb-1">Statut</span>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as DocumentStatut)}
              className="input"
            >
              {statutsDisponibles.map((s) => (
                <option key={s} value={s}>
                  {DOCUMENT_STATUT_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 mb-1">Date d'émission *</span>
            <input
              type="date"
              value={dateEmission}
              onChange={(e) => setDateEmission(e.target.value)}
              className="input"
              required
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-500 mb-1">
              {type === 'devis' ? 'Date de validité' : "Date d'échéance"}
            </span>
            <input
              type="date"
              value={dateEcheance}
              onChange={(e) => setDateEcheance(e.target.value)}
              className="input"
            />
          </label>
        </div>

        {franchiseEnBase && (
          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
            Ce profil est en franchise en base : la TVA n'est pas applicable (art. 293 B du CGI), les
            lignes ci-dessous sont donc en hors-taxe uniquement.
          </p>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="block text-xs font-medium text-slate-500">Lignes</span>
            <button
              type="button"
              onClick={addLigne}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              + Ajouter une ligne
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                  <th className="px-3 py-2 font-medium">Désignation</th>
                  <th className="px-3 py-2 font-medium w-20">Qté</th>
                  <th className="px-3 py-2 font-medium w-28">PU HT</th>
                  {!franchiseEnBase && <th className="px-3 py-2 font-medium w-24">TVA</th>}
                  <th className="px-3 py-2 font-medium w-28 text-right">Total HT</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {lignes.map((ligne) => (
                  <tr key={ligne.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={ligne.designation}
                        onChange={(e) => updateLigne(ligne.id, { designation: e.target.value })}
                        placeholder="Montage vidéo, motion design..."
                        className="w-full border-0 focus:ring-0 text-sm p-0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        value={ligne.quantite}
                        onChange={(e) => updateLigne(ligne.id, { quantite: Number(e.target.value) })}
                        className="w-full border-0 focus:ring-0 text-sm p-0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={ligne.prixUnitaireHT}
                        onChange={(e) => updateLigne(ligne.id, { prixUnitaireHT: Number(e.target.value) })}
                        className="w-full border-0 focus:ring-0 text-sm p-0"
                      />
                    </td>
                    {!franchiseEnBase && (
                      <td className="px-3 py-2">
                        <select
                          value={ligne.tauxTva}
                          onChange={(e) => updateLigne(ligne.id, { tauxTva: Number(e.target.value) })}
                          className="w-full border-0 focus:ring-0 text-sm p-0 bg-transparent"
                        >
                          {TAUX_TVA_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t} %
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="px-3 py-2 text-right text-slate-600">
                      {formatMontant(ligne.quantite * ligne.prixUnitaireHT)}
                    </td>
                    <td className="px-1 py-2">
                      <button
                        type="button"
                        onClick={() => removeLigne(ligne.id)}
                        className="text-slate-400 hover:text-red-600"
                        title="Supprimer la ligne"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Total HT</span>
                <span>{formatMontant(totals.totalHT)}</span>
              </div>
              {totals.parTauxTva.map((t) => (
                <div key={t.taux} className="flex justify-between text-slate-500 text-xs">
                  <span>dont TVA {t.taux}%</span>
                  <span>{formatMontant(t.montantTva)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total TTC</span>
                <span>{formatMontant(totals.totalTTC)}</span>
              </div>
            </div>
          </div>
        </div>

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 mb-1">Conditions de paiement</span>
          <input
            type="text"
            value={conditionsPaiement}
            onChange={(e) => setConditionsPaiement(e.target.value)}
            className="input"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 mb-1">Notes / conditions particulières</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
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
