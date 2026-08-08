// Noms des sous-dossiers créés automatiquement dans le dossier des documents
// générés (Préférences > "Dossier des documents générés"). Centralisé ici
// car utilisé à la fois côté main (création des dossiers, écriture des
// fichiers) et côté renderer (choix du sous-dossier au moment d'enregistrer
// un document).

export const EXPORT_SUBFOLDERS = {
  facturesEmises: 'Factures émises',
  facturesFournisseurs: 'Factures fournisseurs',
  devis: 'Devis',
  relevesPaiements: 'Relevés paiements'
} as const
