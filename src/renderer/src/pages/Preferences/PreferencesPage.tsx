import { useEffect, useState } from 'react'
import type { PageDemarrage, Preferences, ThemeMode } from '../../../../shared/types'
import { applyTheme } from '../../lib/theme'

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
  { value: '/paiements', label: 'Paiements' }
]

export default function PreferencesPage(): React.JSX.Element {
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.preferences.get().then(setPreferences)
  }, [])

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

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
        D'autres réglages arriveront ici au fil des besoins.
      </p>
    </div>
  )
}
