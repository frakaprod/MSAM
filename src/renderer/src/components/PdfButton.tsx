import { Link } from 'react-router-dom'

/**
 * Icône "Enregistrer en PDF" réutilisable pour une ligne de liste (facture,
 * devis). `to` pointe vers la fiche avec `?action=pdf` : DocumentDetailPage
 * déclenche l'enregistrement dès que le document est chargé, dans le dossier
 * configuré en Préférences.
 */
export default function PdfButton({
  to,
  title = 'Enregistrer en PDF'
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
      ⬇
    </Link>
  )
}
