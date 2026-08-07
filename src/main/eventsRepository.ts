import { randomUUID } from 'crypto'
import { getData, persist } from './store'
import type { Event, EventFilters, EventInput } from '../shared/types'

export function listEvents(filters: EventFilters = {}): Event[] {
  const data = getData()
  let events = [...data.events]

  if (filters.from) {
    events = events.filter((e) => e.date >= filters.from!)
  }
  if (filters.to) {
    events = events.filter((e) => e.date <= filters.to!)
  }
  if (filters.categorie && filters.categorie !== 'toutes') {
    events = events.filter((e) => e.categorie === filters.categorie)
  }
  if (filters.projetId) {
    events = events.filter((e) => e.projetId === filters.projetId)
  }
  if (filters.clientId) {
    events = events.filter((e) => e.clientId === filters.clientId)
  }

  events.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return (a.heureDebut || '').localeCompare(b.heureDebut || '')
  })

  return events
}

export function getEvent(id: string): Event | null {
  const data = getData()
  return data.events.find((e) => e.id === id) ?? null
}

export function createEvent(input: EventInput): Event {
  const data = getData()
  const now = new Date().toISOString()

  const event: Event = {
    id: randomUUID(),
    titre: input.titre,
    categorie: input.categorie,
    date: input.date,
    heureDebut: input.heureDebut,
    heureFin: input.heureFin,
    lieu: input.lieu,
    clientId: input.clientId,
    projetId: input.projetId,
    notes: input.notes,
    statut: input.statut || 'a_faire',
    createdAt: now,
    updatedAt: now
  }

  data.events.push(event)
  persist()

  return event
}

export function updateEvent(id: string, input: EventInput): Event | null {
  const data = getData()
  const index = data.events.findIndex((e) => e.id === id)
  if (index === -1) return null

  const existing = data.events[index]
  const updated: Event = {
    ...existing,
    titre: input.titre,
    categorie: input.categorie,
    date: input.date,
    heureDebut: input.heureDebut,
    heureFin: input.heureFin,
    lieu: input.lieu,
    clientId: input.clientId,
    projetId: input.projetId,
    notes: input.notes,
    statut: input.statut || 'a_faire',
    updatedAt: new Date().toISOString()
  }

  data.events[index] = updated
  persist()

  return updated
}

export function deleteEvent(id: string): void {
  const data = getData()
  data.events = data.events.filter((e) => e.id !== id)
  persist()
}
