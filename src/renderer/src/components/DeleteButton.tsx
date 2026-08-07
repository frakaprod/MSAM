import { useState } from 'react'

/**
 * Petite croix de suppression réutilisable pour les lignes de liste
 * (clients, projets, devis/factures, profils...). Gère sa propre confirmation
 * inline et bloque la propagation du clic pour ne pas déclencher un Link
 * parent (la ligne du tableau reste cliquable pour ouvrir la fiche, seule la
 * croix supprime).
 */
export default function DeleteButton({
  onConfirm,
  title = 'Supprimer'
}: {
  onConfirm: () => void
  title?: string
}): React.JSX.Element {
  const [confirming, setConfirming] = useState(false)

  function stop(e: React.SyntheticEvent): void {
    e.preventDefault()
    e.stopPropagation()
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap" onClick={stop}>
        <button
          onClick={(e) => {
            stop(e)
            onConfirm()
          }}
          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          Confirmer
        </button>
        <button
          onClick={(e) => {
            stop(e)
            setConfirming(false)
          }}
          className="px-1 text-xs text-slate-400 hover:text-slate-600"
        >
          Annuler
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={(e) => {
        stop(e)
        setConfirming(true)
      }}
      title={title}
      aria-label={title}
      className="flex h-6 w-6 items-center justify-center rounded text-slate-300 hover:bg-red-50 hover:text-red-600"
    >
      ✕
    </button>
  )
}
