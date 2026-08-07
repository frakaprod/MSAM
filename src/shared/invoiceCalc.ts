// Calcul des totaux d'un devis/facture. Fonction pure partagée entre le
// renderer (aperçu en temps réel dans le formulaire) et le main (si jamais
// besoin de recalculer côté serveur) pour ne jamais avoir deux implémentations
// qui divergent.

import type { DocumentLigne, DocumentTotals } from './types'

export function computeDocumentTotals(lignes: DocumentLigne[]): DocumentTotals {
  let totalHT = 0
  const parTauxMap = new Map<number, { baseHT: number; montantTva: number }>()

  for (const ligne of lignes) {
    const ligneHT = ligne.quantite * ligne.prixUnitaireHT
    totalHT += ligneHT

    const existing = parTauxMap.get(ligne.tauxTva) || { baseHT: 0, montantTva: 0 }
    existing.baseHT += ligneHT
    existing.montantTva += ligneHT * (ligne.tauxTva / 100)
    parTauxMap.set(ligne.tauxTva, existing)
  }

  const parTauxTva = Array.from(parTauxMap.entries())
    .map(([taux, { baseHT, montantTva }]) => ({
      taux,
      baseHT: round2(baseHT),
      montantTva: round2(montantTva)
    }))
    .sort((a, b) => a.taux - b.taux)

  const totalTVA = parTauxTva.reduce((sum, t) => sum + t.montantTva, 0)

  return {
    totalHT: round2(totalHT),
    totalTVA: round2(totalTVA),
    totalTTC: round2(totalHT + totalTVA),
    parTauxTva
  }
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
