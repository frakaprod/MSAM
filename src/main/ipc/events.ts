import { ipcMain } from 'electron'
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  updateEvent
} from '../eventsRepository'
import type { EventFilters, EventInput } from '../../shared/types'

export function registerEventsIpc(): void {
  ipcMain.handle('events:list', (_event, filters: EventFilters) => {
    return listEvents(filters)
  })

  ipcMain.handle('events:get', (_event, id: string) => {
    return getEvent(id)
  })

  ipcMain.handle('events:create', (_event, input: EventInput) => {
    return createEvent(input)
  })

  ipcMain.handle('events:update', (_event, id: string, input: EventInput) => {
    return updateEvent(id, input)
  })

  ipcMain.handle('events:delete', (_event, id: string) => {
    deleteEvent(id)
    return true
  })
}
