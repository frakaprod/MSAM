// Stockage local en JSON (fichier unique dans le dossier de données de l'appli).
// Choix volontaire plutôt qu'une vraie base SQLite : zéro dépendance native à
// compiler à l'installation, donc zéro risque pour une appli censée s'installer
// d'un double-clic. Le volume de données d'un freelance (clients, projets,
// factures) reste très largement dans ce que ce format peut gérer sans souci.
//
// NB pour une évolution multi-utilisateurs future : la fonction getData()/
// setData() est le seul point de contact avec le stockage. Le jour où il faut
// migrer vers une vraie base (ex: Postgres pour un SaaS), seul ce fichier
// change ; les repositories (clientsRepository.ts, etc.) n'ont pas à bouger.

import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import type { BillingProfile, Client, Event, InvoiceDocument, Project } from '../shared/types'

export interface AppData {
  schemaVersion: number
  clients: Client[]
  projects: Project[]
  events: Event[]
  billingProfiles: BillingProfile[]
  documents: InvoiceDocument[]
}

const DEFAULT_DATA: AppData = {
  schemaVersion: 1,
  clients: [],
  projects: [],
  events: [],
  billingProfiles: [],
  documents: []
}

let cache: AppData | null = null

function getDataFilePath(): string {
  const userDataPath = app.getPath('userData')
  if (!existsSync(userDataPath)) {
    mkdirSync(userDataPath, { recursive: true })
  }
  return join(userDataPath, 'msam-data.json')
}

export function loadData(): AppData {
  if (cache) return cache

  const filePath = getDataFilePath()
  if (!existsSync(filePath)) {
    cache = { ...DEFAULT_DATA }
    persist()
    return cache
  }

  try {
    const raw = readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppData>
    cache = {
      schemaVersion: parsed.schemaVersion ?? 1,
      clients: parsed.clients ?? [],
      projects: parsed.projects ?? [],
      events: parsed.events ?? [],
      billingProfiles: parsed.billingProfiles ?? [],
      documents: parsed.documents ?? []
    }
  } catch (err) {
    // Fichier corrompu ou illisible : on ne perd pas les données existantes,
    // on repart d'un état vide en mémoire mais on ne réécrase pas encore le
    // fichier tant qu'une sauvegarde explicite n'a pas lieu.
    console.error('Erreur de lecture des données MSAM, fichier possiblement corrompu :', err)
    cache = { ...DEFAULT_DATA }
  }

  return cache
}

export function persist(): void {
  if (!cache) return
  const filePath = getDataFilePath()
  const tmpPath = `${filePath}.tmp`
  // Écriture atomique : on écrit dans un fichier temporaire puis on renomme,
  // pour éviter de corrompre le fichier si l'appli plante en pleine écriture.
  writeFileSync(tmpPath, JSON.stringify(cache, null, 2), 'utf-8')
  renameSync(tmpPath, filePath)
}

export function getData(): AppData {
  return loadData()
}
