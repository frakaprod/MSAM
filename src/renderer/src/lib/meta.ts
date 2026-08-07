import type { EventCategorie, EventStatut, ProjectStatut } from '../../../shared/types'

export const CATEGORIE_LABELS: Record<EventCategorie, string> = {
  rdv_client: 'RDV client',
  tournage: 'Tournage',
  montage: 'Montage',
  retours_client: 'Retours client',
  livraison: 'Livraison',
  personnel: 'Personnel',
  autre: 'Autre'
}

// Couleurs pensées pour rester lisibles dans la grille du calendrier (fond
// clair + texte foncé de la même teinte).
export const CATEGORIE_STYLES: Record<EventCategorie, string> = {
  rdv_client: 'bg-blue-100 text-blue-800 border-blue-200',
  tournage: 'bg-purple-100 text-purple-800 border-purple-200',
  montage: 'bg-brand-100 text-brand-700 border-brand-200',
  retours_client: 'bg-amber-100 text-amber-800 border-amber-200',
  livraison: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  personnel: 'bg-pink-100 text-pink-800 border-pink-200',
  autre: 'bg-slate-200 text-slate-700 border-slate-300'
}

export const CATEGORIE_DOT: Record<EventCategorie, string> = {
  rdv_client: 'bg-blue-500',
  tournage: 'bg-purple-500',
  montage: 'bg-brand-600',
  retours_client: 'bg-amber-500',
  livraison: 'bg-emerald-500',
  personnel: 'bg-pink-500',
  autre: 'bg-slate-400'
}

export const EVENT_STATUT_LABELS: Record<EventStatut, string> = {
  a_faire: 'À faire',
  fait: 'Fait',
  annule: 'Annulé'
}

export const PROJECT_STATUT_LABELS: Record<ProjectStatut, string> = {
  prospect: 'Prospect',
  en_cours: 'En cours',
  en_pause: 'En pause',
  termine: 'Terminé',
  annule: 'Annulé'
}

export const PROJECT_STATUT_STYLES: Record<ProjectStatut, string> = {
  prospect: 'bg-amber-100 text-amber-800',
  en_cours: 'bg-blue-100 text-blue-800',
  en_pause: 'bg-slate-200 text-slate-600',
  termine: 'bg-emerald-100 text-emerald-800',
  annule: 'bg-red-100 text-red-700'
}
