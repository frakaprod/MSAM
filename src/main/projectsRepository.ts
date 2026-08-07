import { randomUUID } from 'crypto'
import { getData, persist } from './store'
import type { Project, ProjectFilters, ProjectInput } from '../shared/types'

function normalizeText(value: string): string {
  return value.toLocaleLowerCase('fr-FR')
}

export function listProjects(filters: ProjectFilters = {}): Project[] {
  const data = getData()
  let projects = [...data.projects]

  if (filters.statut && filters.statut !== 'tous') {
    projects = projects.filter((p) => p.statut === filters.statut)
  }

  if (filters.clientId) {
    projects = projects.filter((p) => p.clientId === filters.clientId)
  }

  if (filters.search && filters.search.trim() !== '') {
    const needle = normalizeText(filters.search.trim())
    projects = projects.filter((p) => normalizeText(p.nom).includes(needle))
  }

  projects.sort((a, b) => {
    // Les projets sans date de livraison passent en dernier
    if (a.dateLivraison && b.dateLivraison) {
      return a.dateLivraison.localeCompare(b.dateLivraison)
    }
    if (a.dateLivraison) return -1
    if (b.dateLivraison) return 1
    return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
  })

  return projects
}

export function getProject(id: string): Project | null {
  const data = getData()
  return data.projects.find((p) => p.id === id) ?? null
}

export function createProject(input: ProjectInput): Project {
  const data = getData()
  const now = new Date().toISOString()

  const project: Project = {
    id: randomUUID(),
    nom: input.nom,
    clientId: input.clientId,
    statut: input.statut || 'prospect',
    description: input.description,
    dateLivraison: input.dateLivraison,
    createdAt: now,
    updatedAt: now
  }

  data.projects.push(project)
  persist()

  return project
}

export function updateProject(id: string, input: ProjectInput): Project | null {
  const data = getData()
  const index = data.projects.findIndex((p) => p.id === id)
  if (index === -1) return null

  const existing = data.projects[index]
  const updated: Project = {
    ...existing,
    nom: input.nom,
    clientId: input.clientId,
    statut: input.statut || 'prospect',
    description: input.description,
    dateLivraison: input.dateLivraison,
    updatedAt: new Date().toISOString()
  }

  data.projects[index] = updated
  persist()

  return updated
}

export function deleteProject(id: string): void {
  const data = getData()
  data.projects = data.projects.filter((p) => p.id !== id)
  // On détache les événements liés plutôt que de les supprimer : l'historique
  // du calendrier reste intact même si le projet est supprimé.
  data.events = data.events.map((e) => (e.projetId === id ? { ...e, projetId: null } : e))
  persist()
}
