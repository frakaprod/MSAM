import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BillingProfile, PageDemarrage, Preferences, ThemeMode } from '../../../../shared/types'
import { applyTheme } from '../../lib/theme'
import { fileToResizedDataUrl } from '../../lib/image'

const THEME_OPTIONS: { value: ThemeMode; label: string; description: string }[] = [
  { value: 'clair', label: 'Clair', description: 'Fond blanc, comme aujourd\'hui.' },
  { value: 'sombre', label: 'Sombre', description: 'Fond foncé, plus reposant en soirée.' },
  { value: 'systeme', label: 'Système', description: 'Suit automatiquement le réglage de Windows.' }
]

const PAGE_OPTIONS: { value: PageDemarrage; label: string }[] = [
  { value: '/agenda', label: 'Agenda' },
  { value: '/clients', label: 'Base clients' },
  { value: '/projets', label: 'Projets' },
  { value: '/facturation', label: 'Facturation' },
  { value: '/paiements', label: 'Fiscalité' }
]

export default function PreferencesPage(): React.JSX.Element {
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [defaultProfile, setDefaultProfile] = useState<BillingProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)

  useEffect(() => {
    window.api.preferences.get().then(setPreferences)
    reloadDefaultProfile()
  }, [])

  async function reloadDefaultProfile(): Promise<void> {
    setProfileLoading(true)
    try {
      const profile = await window.api.billingProfiles.getDefault()
      setDefaultProfile(profile)
    } finally {
      setProfileLoading(false)
    }
  }

  function flashSaved(): void {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function handleThemeChange(theme: ThemeMode): Promise<void> {
    if (!preferences) return
    setPreferences({ ...preferences, theme })
    applyTheme(theme)
    await window.api.preferences.update({ theme })
    flashSaved()
  }

  async function handlePageChange(pageDemarrage: PageDemarrage): Promise<void> {
    if (!preferences) return
    setPreferences({ ...preferences, pageDemarrage })
    await window.api.preferences.update({ pageDemarrage })
    flashSaved()
  }

  async function saveProfileLogo(logo: string | null): Promise<void> {
    if (!defaultProfile) return
    setDefaultProfile({ ...defaultProfile, logo })
    // BillingProfileInput = BillingProfile sans id/createdAt/updatedAt : on
    // les retire avant de renvoyer l'objet complet à l'IPC update.
    const { id, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = defaultProfile
    await window.api.billingProfiles.update(id, { ...input, logo })
    flashSaved()
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLogoError(null)
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      await saveProfileLogo(dataUrl)
    } catch {
      setLogoError('Impossible de charger cette image comme logo.')
    }
  }

  async function handleChooseExportsFolder(): Promise<void> {
    const updated = await window.api.preferences.chooseExportsFolder()
    if (updated) {
      setPreferences(updated)
      flashSaved()
    }
  }

  if (!preferences) {
    return <div className="p-8 text-sm text-slate-400 dark:text-slate-500">Chargement...</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Préférences</h2>
        {saved && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Enregistré ✓
          </span>
        )}
      </div>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Thème</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          L'apparence de l'appli. Les documents imprimés/exportés en PDF restent toujours clairs.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((opt) => {
            const active = preferences.theme === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleThemeChange(opt.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? 'border-brand-500 ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-900/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600'
                }`}
              >
                <div
                  className={`mb-2 h-10 w-full rounded-md border ${
                    opt.value === 'sombre'
                      ? 'bg-slate-800 border-slate-600'
                      : opt.value === 'systeme'
                        ? 'bg-gradient-to-r from-white to-slate-800 border-slate-300'
                        : 'bg-white border-slate-300'
                  }`}
                />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{opt.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.description}</p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mt-4">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Page de démarrage</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          La section affichée à l'ouverture de MSAM.
        </p>
        <select
          value={preferences.pageDemarrage}
          onChange={(e) => handlePageChange(e.target.value as PageDemarrage)}
          className="input mt-3 max-w-xs"
        >
          {PAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mt-4">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Logo de la société</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Utilisé sur les factures, devis et relevés PDF.
          {defaultProfile && ` Rattaché au profil de facturation "${defaultProfile.nom}" (par défaut).`}
        </p>

        {profileLoading ? (
          <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">Chargement...</p>
        ) : !defaultProfile ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Crée d'abord un{' '}
            <Link to="/facturation/profils/nouveau" className="text-brand-600 hover:text-brand-700 font-medium">
              profil de facturation
            </Link>{' '}
            pour pouvoir y ajouter un logo.
          </p>
        ) : (
          <div className="mt-3 flex items-center gap-3">
            {defaultProfile.logo && (
              <img
                src={defaultProfile.logo}
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
              {defaultProfile.logo && (
                <button
                  type="button"
                  onClick={() => saveProfileLogo(null)}
                  className="block mt-1 text-xs text-red-600 hover:text-red-700"
                >
                  Supprimer le logo
                </button>
              )}
              {logoError && <p className="mt-1 text-xs text-red-600">{logoError}</p>}
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Plusieurs sociétés/statuts ? Chaque{' '}
          <Link to="/facturation/profils" className="text-brand-600 hover:text-brand-700">
            profil de facturation
          </Link>{' '}
          a son propre logo, modifiable directement sur sa fiche.
        </p>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mt-4">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Dossier des documents générés
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Où le bouton "Enregistrer en PDF" (factures, devis, relevés) place ses fichiers.
        </p>

        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 font-mono break-all rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2">
          {preferences.dossierExports}
        </p>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleChooseExportsFolder}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Choisir un dossier...
          </button>
          <button
            type="button"
            onClick={() => window.api.preferences.openExportsFolder()}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Ouvrir le dossier
          </button>
        </div>
      </section>

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
        D'autres réglages arriveront ici au fil des besoins.
      </p>
    </div>
  )
}
