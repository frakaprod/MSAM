import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/facturation/factures', label: 'Factures émises' },
  { to: '/facturation/devis', label: 'Devis' },
  { to: '/facturation/fournisseurs', label: 'Factures fournisseurs' },
  { to: '/facturation/profils', label: 'Profils de facturation' }
]

export default function FacturationLayout(): React.JSX.Element {
  return (
    <div>
      <div className="px-8 pt-8">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Facturation</h2>
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>
      <Outlet />
    </div>
  )
}
