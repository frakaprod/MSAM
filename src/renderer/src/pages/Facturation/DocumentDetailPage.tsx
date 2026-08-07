import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type {
  BillingProfile,
  Client,
  DocumentStatut,
  DocumentType,
  InvoiceDocument,
  InvoiceDocumentInput,
  Project
} from '../../../../shared/types'
import { REGIME_TVA_LABELS } from '../../../../shared/types'
import { computeDocumentTotals } from '../../../../shared/invoiceCalc'
import { DOCUMENT_STATUT_LABELS, DOCUMENT_STATUT_STYLES, formatMontant } from '../../lib/meta'

export default function DocumentDetailPage({ type }: { type: DocumentType }): React.JSX.Element {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const basePath = type === 'devis' ? 'devis' : 'factures'
  const label = type === 'devis' ? 'Devis' : 'Facture'

  const [doc, setDoc] = useState<InvoiceDocument | null>(null)
  const [profile, setProfile] = useState<BillingProfile | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [converting, setConverting] = useState(false)
  const [savingPdf, setSavingPdf] = useState(false)
  const [savedPdfPath, setSavedPdfPath] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)

  async function reload(): Promise<void> {
    if (!id) return
    const d = await window.api.documents.get(id)
    setDoc(d)
    if (d) {
      const [p, c, proj] = await Promise.all([
        window.api.billingProfiles.get(d.profilId),
        window.api.clients.get(d.clientId),
        d.projetId ? window.api.projects.get(d.projetId) : Promise.resolve(null)
      ])
      setProfile(p)
      setClient(c)
      setProject(proj)
    }
    setLoading(false)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function changeStatut(newStatut: DocumentStatut): Promise<void> {
    if (!doc || !id) return
    const payload: InvoiceDocumentInput = {
      type: doc.type,
      profilId: doc.profilId,
      clientId: doc.clientId,
      projetId: doc.projetId,
      dateEmission: doc.dateEmission,
      dateEcheance: doc.dateEcheance,
      statut: newStatut,
      lignes: doc.lignes,
      conditionsPaiement: doc.conditionsPaiement,
      notes: doc.notes,
      devisOrigineId: doc.devisOrigineId
    }
    const updated = await window.api.documents.update(id, payload)
    setDoc(updated)
  }

  async function handleDelete(): Promise<void> {
    if (!id) return
    await window.api.documents.delete(id)
    navigate(`/facturation/${basePath}`)
  }

  async function handleConvert(): Promise<void> {
    if (!id) return
    setConverting(true)
    try {
      const facture = await window.api.documents.convertToFacture(id)
      if (facture) {
        navigate(`/facturation/factures/${facture.id}`)
      }
    } finally {
      setConverting(false)
    }
  }

  function handlePrint(): void {
    window.print()
  }

  async function handleSavePdf(): Promise<void> {
    if (!doc) return
    setSavingPdf(true)
    setPdfError(null)
    setSavedPdfPath(null)
    try {
      const subfolder = type === 'devis' ? 'Devis' : 'Factures'
      const { path } = await window.api.pdf.save({ subfolder, filename: doc.numero })
      setSavedPdfPath(path)
    } catch {
      setPdfError("Impossible d'enregistrer le PDF. Vérifie le dossier choisi dans Préférences.")
    } finally {
      setSavingPdf(false)
    }
  }

  // Icônes "Imprimer" / "Enregistrer en PDF" dans la liste : elles amènent ici
  // avec ?action=imprimer|pdf pour déclencher l'action tout de suite, sans
  // dupliquer le rendu imprimable de la facture/devis dans la liste. Le
  // paramètre est retiré de l'URL immédiatement pour rester idempotent (pas
  // de nouvel impression si la page est rechargée).
  useEffect(() => {
    if (!doc) return
    const action = searchParams.get('action')
    if (action === 'imprimer') {
      setSearchParams({}, { replace: true })
      handlePrint()
    } else if (action === 'pdf') {
      setSearchParams({}, { replace: true })
      handleSavePdf()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc])

  if (loading) {
    return <div className="p-8 text-sm text-slate-400 dark:text-slate-500">Chargement...</div>
  }

  if (!doc || !profile || !client) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">Document introuvable.</p>
        <Link to={`/facturation/${basePath}`} className="text-brand-600 text-sm">
          ← Retour à la liste
        </Link>
      </div>
    )
  }

  const totals = computeDocumentTotals(doc.lignes)
  const franchiseEnBase = profile.regimeTva === 'franchise_en_base'

  return (
    <div>
      {/* ---------- Vue écran (masquée à l'impression) ---------- */}
      <div className="print:hidden p-8 max-w-3xl mx-auto">
        <Link to={`/facturation/${basePath}`} className="text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600">
          ← Retour à la liste
        </Link>

        <div className="mt-4 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {label} {doc.numero}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              <Link to={`/clients/${client.id}`} className="hover:text-brand-600">
                {client.nom}
                {client.prenom ? ` ${client.prenom}` : ''}
              </Link>
              {project && (
                <>
                  {' · '}
                  <Link to={`/projets/${project.id}`} className="hover:text-brand-600">
                    {project.nom}
                  </Link>
                </>
              )}
              {' · '}
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${DOCUMENT_STATUT_STYLES[doc.statut]}`}
              >
                {DOCUMENT_STATUT_LABELS[doc.statut]}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSavePdf}
              disabled={savingPdf}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {savingPdf ? 'Enregistrement...' : 'Enregistrer en PDF'}
            </button>
            <button
              onClick={handlePrint}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              Imprimer
            </button>
            <Link
              to={`/facturation/${basePath}/${doc.id}/modifier`}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              Modifier
            </Link>
            <button
              onClick={() => setConfirmingDelete(true)}
              className="rounded-lg border border-red-200 dark:border-red-900 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              Supprimer
            </button>
          </div>
        </div>

        {savedPdfPath && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            <span className="truncate">Enregistré : {savedPdfPath}</span>
            <button
              onClick={() => window.api.pdf.revealFile(savedPdfPath)}
              className="shrink-0 text-xs font-medium underline hover:no-underline"
            >
              Afficher dans le dossier
            </button>
          </div>
        )}
        {pdfError && <p className="mt-4 text-sm text-red-600">{pdfError}</p>}

        {confirmingDelete && (
          <div className="mt-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4 text-sm">
            <p className="text-red-700">Supprimer définitivement ce {label.toLowerCase()} ?</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-white font-medium hover:bg-red-700"
              >
                Oui, supprimer
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded-lg px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Actions rapides de statut */}
        <div className="mt-4 flex flex-wrap gap-2">
          {type === 'devis' ? (
            <>
              {doc.statut !== 'envoye' && (
                <QuickAction onClick={() => changeStatut('envoye')}>Marquer envoyé</QuickAction>
              )}
              {doc.statut !== 'refuse' && (
                <QuickAction onClick={() => changeStatut('refuse')}>Marquer refusé</QuickAction>
              )}
              <QuickAction onClick={handleConvert} disabled={converting} primary>
                {converting ? 'Conversion...' : '→ Transformer en facture'}
              </QuickAction>
            </>
          ) : (
            <>
              {doc.statut !== 'envoye' && (
                <QuickAction onClick={() => changeStatut('envoye')}>Marquer envoyée</QuickAction>
              )}
              {doc.statut !== 'paye' && (
                <QuickAction onClick={() => changeStatut('paye')} primary>
                  Marquer payée
                </QuickAction>
              )}
              {doc.statut !== 'en_retard' && (
                <QuickAction onClick={() => changeStatut('en_retard')}>Marquer en retard</QuickAction>
              )}
            </>
          )}
        </div>

        {doc.devisOrigineId && (
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
            Générée depuis le devis{' '}
            <Link to={`/facturation/devis/${doc.devisOrigineId}`} className="text-brand-600 hover:text-brand-700">
              correspondant
            </Link>
            .
          </p>
        )}

        <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Aperçu</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            L'aperçu exact du document apparaît ci-dessous. "Enregistrer en PDF" le sauvegarde
            directement dans le dossier choisi en Préférences ; "Imprimer" ouvre la boîte de dialogue
            d'impression (papier ou autre emplacement).
          </p>
        </div>
      </div>

      {/* ---------- Document imprimable (visible à l'écran en aperçu + à l'impression) ---------- */}
      <div className="print:p-0 px-8 pb-8 max-w-3xl mx-auto print:max-w-none">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 print:border-0 rounded-xl print:rounded-none p-10 print:p-0 text-sm text-slate-800 dark:text-slate-200">
          <div className="flex justify-between items-start">
            <div>
              {profile.logo && (
                <img src={profile.logo} alt="Logo" className="h-14 max-w-[200px] object-contain mb-2" />
              )}
              <p className="font-semibold text-base">{profile.raisonSociale}</p>
              {profile.adresse && <p>{profile.adresse}</p>}
              {(profile.codePostal || profile.ville) && (
                <p>
                  {profile.codePostal} {profile.ville}
                </p>
              )}
              {profile.siret && <p className="mt-1 text-slate-500 dark:text-slate-400">SIRET : {profile.siret}</p>}
              {profile.tvaIntracom && <p className="text-slate-500 dark:text-slate-400">TVA intracom. : {profile.tvaIntracom}</p>}
              {profile.email && <p className="text-slate-500 dark:text-slate-400">{profile.email}</p>}
              {profile.telephone && <p className="text-slate-500 dark:text-slate-400">{profile.telephone}</p>}
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold uppercase tracking-wide">
                {type === 'devis' ? 'Devis' : 'Facture'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">N° {doc.numero}</p>
              <p className="text-slate-500 dark:text-slate-400">Émis le {doc.dateEmission}</p>
              {doc.dateEcheance && (
                <p className="text-slate-500 dark:text-slate-400">
                  {type === 'devis' ? 'Valable jusqu\'au' : 'Échéance'} {doc.dateEcheance}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="text-right">
              <p className="text-xs uppercase text-slate-400 dark:text-slate-500 mb-1">Client</p>
              <p className="font-medium">
                {client.nom}
                {client.prenom ? ` ${client.prenom}` : ''}
              </p>
              {client.adresse && <p>{client.adresse}</p>}
              {(client.codePostal || client.ville) && (
                <p>
                  {client.codePostal} {client.ville}
                </p>
              )}
              {client.siret && <p className="text-slate-500 dark:text-slate-400">SIRET : {client.siret}</p>}
            </div>
          </div>

          {project && <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">Projet : {project.nom}</p>}

          <table className="w-full mt-8 text-sm border-t border-slate-300 dark:border-slate-600">
            <thead>
              <tr className="border-b border-slate-300 dark:border-slate-600 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <th className="py-2">Désignation</th>
                <th className="py-2 text-right w-16">Qté</th>
                <th className="py-2 text-right w-24">PU HT</th>
                {!franchiseEnBase && <th className="py-2 text-right w-16">TVA</th>}
                <th className="py-2 text-right w-28">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {doc.lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2 pr-2">{ligne.designation}</td>
                  <td className="py-2 text-right">{ligne.quantite}</td>
                  <td className="py-2 text-right">{formatMontant(ligne.prixUnitaireHT)}</td>
                  {!franchiseEnBase && <td className="py-2 text-right">{ligne.tauxTva}%</td>}
                  <td className="py-2 text-right">{formatMontant(ligne.quantite * ligne.prixUnitaireHT)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-1">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total HT</span>
                <span>{formatMontant(totals.totalHT)}</span>
              </div>
              {franchiseEnBase ? (
                <div className="text-xs text-slate-500 dark:text-slate-400">TVA non applicable, art. 293 B du CGI</div>
              ) : (
                totals.parTauxTva.map((t) => (
                  <div key={t.taux} className="flex justify-between text-slate-500 dark:text-slate-400 text-xs">
                    <span>dont TVA {t.taux}%</span>
                    <span>{formatMontant(t.montantTva)}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-300 dark:border-slate-600">
                <span>Total {franchiseEnBase ? '' : 'TTC'}</span>
                <span>{formatMontant(franchiseEnBase ? totals.totalHT : totals.totalTTC)}</span>
              </div>
            </div>
          </div>

          {doc.conditionsPaiement && (
            <div className="mt-6">
              <p className="text-xs uppercase text-slate-400 dark:text-slate-500 mb-1">Conditions de paiement</p>
              <p>{doc.conditionsPaiement}</p>
            </div>
          )}

          {type === 'facture' && (profile.iban || profile.bic) && (
            <div className="mt-2 text-slate-600 dark:text-slate-300">
              {profile.iban && <p>IBAN : {profile.iban}</p>}
              {profile.bic && <p>BIC : {profile.bic}</p>}
            </div>
          )}

          {doc.notes && (
            <div className="mt-4">
              <p className="text-xs uppercase text-slate-400 dark:text-slate-500 mb-1">Notes</p>
              <p className="whitespace-pre-wrap">{doc.notes}</p>
            </div>
          )}

          <div className="mt-10 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 whitespace-pre-wrap">
            {profile.mentionsLegales}
            {!franchiseEnBase && (
              <p className="mt-1">Régime de TVA : {REGIME_TVA_LABELS[profile.regimeTva]}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  onClick,
  children,
  primary,
  disabled
}: {
  onClick: () => void
  children: React.ReactNode
  primary?: boolean
  disabled?: boolean
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${
        primary
          ? 'bg-brand-600 text-white hover:bg-brand-700'
          : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
      }`}
    >
      {children}
    </button>
  )
}
