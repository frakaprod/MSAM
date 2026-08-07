import { NavLink } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  enabled: boolean
}

const items: NavItem[] = [
  { to: '/clients', label: 'Base clients', enabled: true },
  { to: '/agenda', label: 'Agenda', enabled: true },
  { to: '/projets', label: 'Projets', enabled: true },
  { to: '/facturation', label: 'Facturation', enabled: true },
  { to: '/paiements', label: 'Fiscalité', enabled: true }
]

const footerItems: NavItem[] = [{ to: '/preferences', label: 'Préférences', enabled: true }]

function renderItem(item: NavItem): React.JSX.Element {
  return item.enabled ? (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      {item.label}
    </NavLink>
  ) : (
    <div
      key={item.to}
      title="Bientôt disponible"
      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-500 cursor-not-allowed"
    >
      <span>{item.label}</span>
      <span className="text-[10px] uppercase tracking-wide bg-slate-800 text-slate-400 rounded px-1.5 py-0.5">
        bientôt
      </span>
    </div>
  )
}

export default function Sidebar(): React.JSX.Element {
  return (
    <aside className="print:hidden w-60 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
      <div className="px-5 py-6">
        <h1 className="text-lg font-semibold tracking-tight">MSAM</h1>
        <p className="text-xs text-slate-400">Ma Secrétaire à Moi</p>
      </div>
      <nav className="flex-1 px-2 space-y-1">{items.map(renderItem)}</nav>
      <nav className="px-2 pb-4 pt-2 border-t border-slate-800 space-y-1">
        {footerItems.map(renderItem)}
      </nav>
    </aside>
  )
}
