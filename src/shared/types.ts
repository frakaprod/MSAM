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
