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
