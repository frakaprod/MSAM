import type { ThemeMode } from '../../../shared/types'

// Applique la classe "dark" sur <html> selon la préférence enregistrée. En
// mode "systeme", on suit la préférence du système d'exploitation. C'est le
// seul endroit qui touche à classList pour le thème, pour ne pas avoir deux
// bouts de code qui se marchent dessus.

export function resolveEffectiveTheme(mode: ThemeMode): 'clair' | 'sombre' {
  if (mode === 'systeme') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'sombre' : 'clair'
  }
  return mode
}

export function applyTheme(mode: ThemeMode): void {
  const effective = resolveEffectiveTheme(mode)
  document.documentElement.classList.toggle('dark', effective === 'sombre')
}

let cleanupSystemWatch: (() => void) | null = null

/**
 * Réagit aux changements de préférence système (bascule jour/nuit auto de
 * Windows) tant que le thème choisi dans MSAM est "systeme". `getMode` est un
 * callback plutôt qu'une valeur figée car la préférence peut changer entre
 * temps (page Préférences) sans que ce watcher soit reconfiguré.
 */
export function watchSystemTheme(getMode: () => ThemeMode): void {
  cleanupSystemWatch?.()
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (): void => {
    if (getMode() === 'systeme') applyTheme('systeme')
  }
  mq.addEventListener('change', handler)
  cleanupSystemWatch = () => mq.removeEventListener('change', handler)
}

// Une facture/un devis imprimé (ou exporté en PDF) doit toujours rester clair
// et lisible sur papier, quel que soit le thème choisi à l'écran. On retire
// donc temporairement la classe "dark" pendant l'impression.
let wasDarkBeforePrint = false

export function setupPrintGuard(): void {
  window.addEventListener('beforeprint', () => {
    wasDarkBeforePrint = document.documentElement.classList.contains('dark')
    document.documentElement.classList.remove('dark')
  })
  window.addEventListener('afterprint', () => {
    if (wasDarkBeforePrint) {
      document.documentElement.classList.add('dark')
    }
  })
}
