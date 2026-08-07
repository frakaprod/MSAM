import { Link } from 'react-router-dom'

/**
 * Icône crayon réutilisable pour éditer directement une ligne de liste, à
 * côté de la croix de suppression (DeleteButton). Bloque la propagation du
 * clic pour rester sûr même si un jour une ligne parente devient elle-même
 * cliquable/navigable.
 */
export default function EditButton({
  to,
  title = 'Modifier'
}: {
  to: string
  title?: string
}): React.JSX.Element {
  return (
    <Link
      to={to}
      onClick={(e) => e.stopPropagation()}
      title={title}
      aria-label={title}
      className="flex h-6 w-6 items-center justify-center rounded text-slate-300 hover:bg-brand-50 hover:text-brand-600"
    >
      ✎
    </Link>
  )
}
