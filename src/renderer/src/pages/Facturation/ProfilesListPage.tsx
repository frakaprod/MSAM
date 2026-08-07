import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { BillingProfile } from '../../../../shared/types'
import { STATUT_JURIDIQUE_LABELS } from '../../../../shared/types'
import DeleteButton from '../../components/DeleteButton'
import EditButton from '../../components/EditButton'

export default function ProfilesListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<BillingProfile[]>([])
  const [loading, setLoading] = useState(true)

  async function reload(): Promise<void> {
    setLoading(true)
    try {
      const data = await window.api.billingProfiles.list()
      setProfiles(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  return (
    <div className="p-8 pt-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {profiles.length} profil{profiles.length > 1 ? 's' : ''} de facturation
        </p>
        <Link
          to="/facturation/profils/nouveau"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          + Nouveau profil
        </Link>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aucun profil de facturation pour le moment. Crée-en un pour pouvoir émettre des devis et
            factures — il porte tes informations légales (SIRET, adresse, IBAN, régime de TVA...).
          </p>
          <Link
            to="/facturation/profils/nouveau"
            className="inline-block mt-4 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            + Créer mon premier profil
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => navigate(`/facturation/profils/${profile.id}/modifier`)}
              className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-brand-300 dark:hover:border-brand-600 cursor-pointer"
            >
              <div className="flex items-center justify-between flex-1">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {profile.nom}
                    {profile.parDefaut && (
                      <span className="ml-2 inline-block rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 text-xs px-2 py-0.5 align-middle">
                        Par défaut
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {profile.raisonSociale} · {STATUT_JURIDIQUE_LABELS[profile.statutJuridique]}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-400 dark:text-slate-500">
                  <p>Factures : {profile.prefixeFacture}{String(profile.prochainNumeroFacture).padStart(3, '0')}</p>
                  <p>Devis : {profile.prefixeDevis}{String(profile.prochainNumeroDevis).padStart(3, '0')}</p>
                </div>
              </div>
              <div className="pl-4 flex items-center gap-1">
                <EditButton to={`/facturation/profils/${profile.id}/modifier`} title="Modifier ce profil" />
                <DeleteButton
                  title="Supprimer ce profil"
                  onConfirm={async () => {
                    await window.api.billingProfiles.delete(profile.id)
                    reload()
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && profiles.length > 0 && (
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Tu peux créer plusieurs profils si tu factures sous plusieurs statuts/sociétés. Le profil
          "par défaut" est pré-sélectionné à la création d'un devis ou d'une facture.
        </p>
      )}
    </div>
  )
}
