import { ipcMain } from 'electron'
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} from '../projectsRepository'
import type { ProjectFilters, ProjectInput } from '../../shared/types'

export function registerProjectsIpc(): void {
  ipcMain.handle('projects:list', (_event, filters: ProjectFilters) => {
    return listProjects(filters)
  })

  ipcMain.handle('projects:get', (_event, id: string) => {
    return getProject(id)
  })

  ipcMain.handle('projects:create', (_event, input: ProjectInput) => {
    return createProject(input)
  })

  ipcMain.handle(
    'projects:update',
    (_event, id: string, input: ProjectInput) => {
      return updateProject(id, input)
    }
  )

  ipcMain.handle('projects:delete', (_event, id: string) => {
    deleteProject(id)
    return true
  })
}
