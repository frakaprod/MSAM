import { getData, persist } from './store'
import type { Preferences, PreferencesUpdateInput } from '../shared/types'

export function getPreferences(): Preferences {
  return getData().preferences
}

export function updatePreferences(input: PreferencesUpdateInput): Preferences {
  const data = getData()
  data.preferences = { ...data.preferences, ...input }
  persist()
  return data.preferences
}
