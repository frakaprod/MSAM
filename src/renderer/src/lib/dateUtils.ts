// Petits utilitaires de dates, volontairement sans dépendance externe (date-fns,
// dayjs...) : le besoin est simple (grille de mois, format ISO), pas besoin
// d'alourdir le bundle pour ça.

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

const MOIS_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre'
]

export const JOURS_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function formatMonthLabel(date: Date): string {
  return `${MOIS_LABELS[date.getMonth()]} ${date.getFullYear()}`
}

export function formatDayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const jour = JOURS_LABELS[(date.getDay() + 6) % 7]
  return `${jour} ${d} ${MOIS_LABELS[m - 1]} ${y}`
}

/**
 * Retourne une grille de dates (tableaux de semaines de 7 jours) couvrant le
 * mois donné, complétée par les jours du mois précédent/suivant pour remplir
 * des semaines entières (semaine démarrant le lundi).
 */
export function getMonthMatrix(year: number, monthIndex: number): Date[][] {
  const firstOfMonth = new Date(year, monthIndex, 1)
  const startOffset = (firstOfMonth.getDay() + 6) % 7 // lundi = 0
  const gridStart = new Date(year, monthIndex, 1 - startOffset)

  // Toujours 6 semaines pleines : plus simple et prévisible pour la mise en
  // page qu'un nombre de lignes variable selon les mois.
  const weeks: Date[][] = []
  const cursor = new Date(gridStart)

  for (let week = 0; week < 6; week++) {
    const days: Date[] = []
    for (let day = 0; day < 7; day++) {
      days.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(days)
  }

  return weeks
}
