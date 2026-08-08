import type {
  DocumentStatut,
  EventCategorie,
  EventStatut,
  ProjectStatut,
  SupplierInvoiceStatut
} from '../../../shared/types'

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
  rdv_client: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  tournage: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
  montage: 'bg-brand-100 text-brand-700 border-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-800',
  retours_client: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
  livraison: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
  personnel: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-800',
  autre: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
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

// Marqueur spécial pour les deadlines de projet : ce ne sont pas des
// événements stockés, elles sont calculées à la volée depuis la date de
// livraison des projets, donc elles ont leur propre style bien distinct
// (rouge) pour ne pas les confondre avec une catégorie d'événement classique.
export const DEADLINE_LABEL = 'Deadline projet'
export const DEADLINE_STYLE =
  'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800'
export const DEADLINE_DOT = 'bg-red-500'

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
  prospect: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  en_cours: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  en_pause: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  termine: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  annule: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
}

export const DOCUMENT_STATUT_LABELS: Record<DocumentStatut, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  paye: 'Payée',
  en_retard: 'En retard',
  annule: 'Annulé'
}

export const DOCUMENT_STATUT_STYLES: Record<DocumentStatut, string> = {
  brouillon: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  envoye: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  accepte: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  refuse: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  paye: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  en_retard: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  annule: 'bg-slate-200 text-slate-500 line-through dark:bg-slate-700 dark:text-slate-500'
}

export const SUPPLIER_INVOICE_STATUT_LABELS: Record<SupplierInvoiceStatut, string> = {
  a_payer: 'À payer',
  payee: 'Payée'
}

export const SUPPLIER_INVOICE_STATUT_STYLES: Record<SupplierInvoiceStatut, string> = {
  a_payer: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  payee: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
}

export function formatMontant(value: number): string {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
