// Types partagés entre le processus principal (main), le preload et le renderer.
// NB: pensés pour rester simples aujourd'hui (mono-utilisateur, local) tout en
// restant faciles à étendre plus tard (ex: ajout d'un user_id/org_id si l'appli
// devient multi-utilisateurs).

export type ClientType = 'particulier' | 'entreprise'
export type ClientStatut = 'prospect' | 'actif' | 'archive'

export interface Client {
  id: string
  type: ClientType
  nom: string // nom de famille (particulier) ou raison sociale (entreprise)
  prenom: string | null
  siret: string | null
  email: string | null
  telephone: string | null
  adresse: string | null
  codePostal: string | null
  ville: string | null
  pays: string
  contactNom: string | null // personne à contacter si type = entreprise
  notes: string | null
  tags: string[] // stocké en JSON dans SQLite, exposé en tableau
  statut: ClientStatut
  createdAt: string
  updatedAt: string
}

export type ClientInput = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>

export interface ClientFilters {
  search?: string
  statut?: ClientStatut | 'tous'
}

// --- Projets ---

export type ProjectStatut = 'prospect' | 'en_cours' | 'en_pause' | 'termine' | 'annule'

export interface Project {
  id: string
  nom: string
  clientId: string | null
  statut: ProjectStatut
  description: string | null
  dateLivraison: string | null // YYYY-MM-DD, deadline cible
  createdAt: string
  updatedAt: string
}

export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>

export interface ProjectFilters {
  search?: string
  statut?: ProjectStatut | 'tous'
  clientId?: string
}

// --- Agenda (événements) ---
// Un seul calendrier pour les RDV clients et les étapes de projets, comme
// convenu : plutôt que deux vues séparées, tout vit ici avec une "categorie"
// qui permet de filtrer / colorer.

export type EventCategorie =
  | 'rdv_client'
  | 'tournage'
  | 'montage'
  | 'retours_client'
  | 'livraison'
  | 'personnel'
  | 'autre'

export type EventStatut = 'a_faire' | 'fait' | 'annule'

export interface Event {
  id: string
  titre: string
  categorie: EventCategorie
  date: string // YYYY-MM-DD
  heureDebut: string | null // HH:MM
  heureFin: string | null // HH:MM
  lieu: string | null
  clientId: string | null
  projetId: string | null
  notes: string | null
  statut: EventStatut
  createdAt: string
  updatedAt: string
}

export type EventInput = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>

export interface EventFilters {
  from?: string // YYYY-MM-DD
  to?: string // YYYY-MM-DD
  categorie?: EventCategorie | 'toutes'
  projetId?: string
  clientId?: string
}

// --- Facturation ---
// Pensé dès le départ pour supporter plusieurs profils de facturation (ex:
// plusieurs statuts/sociétés) même si aujourd'hui il n'y en a qu'un seul —
// cf. discussion initiale sur une possible revente de l'appli plus tard.

export type StatutJuridique = 'auto_entrepreneur' | 'ei' | 'eurl' | 'sasu' | 'sarl' | 'autre'

export const STATUT_JURIDIQUE_LABELS: Record<StatutJuridique, string> = {
  auto_entrepreneur: 'Auto-entrepreneur / micro-entreprise',
  ei: 'Entreprise individuelle (EI)',
  eurl: 'EURL',
  sasu: 'SASU',
  sarl: 'SARL',
  autre: 'Autre'
}

export type RegimeTva = 'franchise_en_base' | 'reel_simplifie' | 'reel_normal'

export const REGIME_TVA_LABELS: Record<RegimeTva, string> = {
  franchise_en_base: 'Franchise en base (TVA non applicable, art. 293 B du CGI)',
  reel_simplifie: 'Réel simplifié',
  reel_normal: 'Réel normal'
}

export interface BillingProfile {
  id: string
  nom: string // nom interne du profil, pour s'y retrouver si plusieurs
  statutJuridique: StatutJuridique
  raisonSociale: string
  siret: string | null
  tvaIntracom: string | null
  regimeTva: RegimeTva
  adresse: string | null
  codePostal: string | null
  ville: string | null
  pays: string
  telephone: string | null
  email: string | null
  iban: string | null
  bic: string | null
  prefixeFacture: string // ex: "FA-2026-"
  prochainNumeroFacture: number
  prefixeDevis: string // ex: "DE-2026-"
  prochainNumeroDevis: number
  conditionsPaiementParDefaut: string | null
  mentionsLegales: string | null // pénalités de retard, indemnité forfaitaire, etc.
  parDefaut: boolean // profil utilisé en pré-sélection à la création d'un document
  createdAt: string
  updatedAt: string
}

export type BillingProfileInput = Omit<BillingProfile, 'id' | 'createdAt' | 'updatedAt'>

export type DocumentType = 'devis' | 'facture'

export type DocumentStatut =
  | 'brouillon'
  | 'envoye'
  | 'accepte'
  | 'refuse'
  | 'paye'
  | 'en_retard'
  | 'annule'

export const DEVIS_STATUTS: DocumentStatut[] = ['brouillon', 'envoye', 'accepte', 'refuse', 'annule']
export const FACTURE_STATUTS: DocumentStatut[] = ['brouillon', 'envoye', 'paye', 'en_retard', 'annule']

export interface DocumentLigne {
  id: string
  designation: string
  quantite: number
  prixUnitaireHT: number
  tauxTva: number // en %, ex 20, 10, 5.5, 0
}

export interface InvoiceDocument {
  id: string
  type: DocumentType
  numero: string
  profilId: string
  clientId: string
  projetId: string | null
  dateEmission: string // YYYY-MM-DD
  dateEcheance: string | null // date d'échéance (facture) ou de validité (devis)
  statut: DocumentStatut
  lignes: DocumentLigne[]
  conditionsPaiement: string | null
  notes: string | null
  devisOrigineId: string | null // si une facture a été générée depuis un devis
  createdAt: string
  updatedAt: string
}

export type InvoiceDocumentInput = Omit<
  InvoiceDocument,
  'id' | 'numero' | 'createdAt' | 'updatedAt'
>

export interface DocumentFilters {
  type?: DocumentType
  search?: string
  statut?: DocumentStatut | 'tous'
  clientId?: string
  projetId?: string
}

export interface DocumentTotals {
  totalHT: number
  totalTVA: number
  totalTTC: number
  parTauxTva: { taux: number; baseHT: number; montantTva: number }[]
}

// --- Paiements ---
// Un paiement est créé automatiquement quand une facture passe au statut
// "payée" (et supprimé si elle en ressort), plutôt que saisi à la main :
// cf. documentsRepository.ts (createDocument/updateDocument) qui appelle
// syncPaymentForDocument après chaque écriture.

export interface Payment {
  id: string
  documentId: string // facture liée
  clientId: string
  montant: number // montant reçu, TTC. Modifiable si besoin (ex: paiement partiel)
  datePaiement: string // YYYY-MM-DD, date à laquelle la facture a été marquée payée (modifiable)
  declarer: boolean // à déclarer (fiscalement) ou non
  createdAt: string
  updatedAt: string
}

export type PaymentUpdateInput = Partial<Pick<Payment, 'montant' | 'datePaiement' | 'declarer'>>

// --- Préférences ---

export type ThemeMode = 'clair' | 'sombre' | 'systeme'

export type PageDemarrage = '/agenda' | '/clients' | '/projets' | '/facturation' | '/paiements'

export interface Preferences {
  theme: ThemeMode
  pageDemarrage: PageDemarrage
}

export type PreferencesUpdateInput = Partial<Preferences>
