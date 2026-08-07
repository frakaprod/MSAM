import { Link } from 'react-router-dom'

/**
 * Icône imprimante réutilisable pour imprimer directement une ligne de liste
 * (facture/devis) sans passer par sa fiche détail. `to` pointe vers la fiche
 * avec `?action=imprimer` : DocumentDetailPage détecte ce paramètre et
 * déclenche l'impression dès que le document est chargé (voir son useEffect
 * dédié), ce qui évite de dupliquer le rendu imprimable ici.
 */
export default function PrintButton({
  to,
  title = 'Imprimer'
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
      className="flex h-6 w-6 items-center justify-center rounded text-slate-300 dark:text-slate-600 hover:bg-brand-50 dark:hover:bg-brand-900/40 hover:text-brand-600"
    >
      ⎙
    </Link>
  )
}
