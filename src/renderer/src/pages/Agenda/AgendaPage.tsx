import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Client, Event, EventCategorie, Project } from '../../../../shared/types'
import {
  CATEGORIE_DOT,
  CATEGORIE_LABELS,
  CATEGORIE_STYLES,
  DEADLINE_DOT,
  DEADLINE_LABEL,
  DEADLINE_STYLE
} from '../../lib/meta'
import { formatDayLabel, formatMonthLabel, getMonthMatrix, toISODate, todayISO } from '../../lib/dateUtils'

export default function AgendaPage(): React.JSX.Element {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<string>(todayISO())
  const [categorieFilter, setCategorieFilter] = useState<EventCategorie | 'toutes'>('toutes')
  const [events, setEvents] = useState<Event[]>([])
  const [clients, setClients] = useState<Record<string, Client>>({})
  const [projectsMap, setProjectsMap] = useState<Record<string, Project>>({})
  const [allProjects, setAllProjects] = useState<Project[]>([])

  const weeks = useMemo(
    () => getMonthMatrix(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  )

  const rangeFrom = toISODate(weeks[0][0])
  const rangeTo = toISODate(weeks[weeks.length - 1][6])

  useEffect(() => {
    window.api.clients.list({ statut: 'tous' }).then((list) => {
      const map: Record<string, Client> = {}
      list.forEach((c) => (map[c.id] = c))
      setClients(map)
    })
    window.api.projects.list({ statut: 'tous' }).then((list) => {
      const map: Record<string, Project> = {}
      list.forEach((p) => (map[p.id] = p))
      setProjectsMap(map)
      setAllProjects(list)
    })
  }, [])

  useEffect(() => {
    window.api.events
      .list({ from: rangeFrom, to: rangeTo, categorie: categorieFilter })
      .then(setEvents)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeFrom, rangeTo, categorieFilter])

  const eventsByDay = useMemo(() => {
    const map: Record<string, Event[]> = {}
    for (const event of events) {
      if (!map[event.date]) map[event.date] = []
      map[event.date].push(event)
    }
    return map
  }, [events])

  // Les deadlines de projet ne sont pas des événements enregistrés : elles
  // sont calculées à la volée depuis la date de livraison de chaque projet,
  // pour rester automatiquement à jour si la date change sur la fiche projet.
  const deadlinesByDay = useMemo(() => {
    const map: Record<string, Project[]> = {}
    if (categorieFilter !== 'toutes') return map // le filtre par catégorie masque aussi les deadlines
    for (const project of allProjects) {
      if (!project.dateLivraison) continue
      if (project.dateLivraison < rangeFrom || project.dateLivraison > rangeTo) continue
      if (!map[project.dateLivraison]) map[project.dateLivraison] = []
      map[project.dateLivraison].push(project)
    }
    return map
  }, [allProjects, rangeFrom, rangeTo, categorieFilter])

  function goToPreviousMonth(): void {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function goToNextMonth(): void {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }
  function goToToday(): void {
    const now = new Date()
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDay(todayISO())
  }

  const selectedDayEvents = eventsByDay[selectedDay] || []
  const selectedDayDeadlines = deadlinesByDay[selectedDay] || []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Agenda</h2>
          <p className="text-sm text-slate-500 mt-1">RDV clients, étapes et deadlines de projets, au même endroit</p>
        </div>
        <Link
          to="/agenda/nouveau"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          + Nouvel événement
        </Link>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="rounded-lg border border-slate-300 w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100"
            aria-label="Mois précédent"
          >
            ‹
          </button>
          <h3 className="text-lg font-medium text-slate-800 w-40 text-center capitalize">
            {formatMonthLabel(currentDate)}
          </h3>
          <button
            onClick={goToNextMonth}
            className="rounded-lg border border-slate-300 w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100"
            aria-label="Mois suivant"
          >
            ›
          </button>
          <button
            onClick={goToToday}
            className="ml-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            Aujourd'hui
          </button>
        </div>

        <select
          value={categorieFilter}
          onChange={(e) => setCategorieFilter(e.target.value as EventCategorie | 'toutes')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="toutes">Toutes les catégories</option>
          {Object.entries(CATEGORIE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Légende des couleurs : rend le code couleur explicite plutôt que de
          demander à François de le deviner en survolant les cases. Ordre
          volontairement manuel (deadline projet entre Montage et Retours
          client) plutôt que l'ordre de déclaration du type. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4 text-xs text-slate-500">
        {(['rdv_client', 'tournage', 'montage'] as EventCategorie[]).map((value) => (
          <span key={value} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${CATEGORIE_DOT[value]}`} />
            {CATEGORIE_LABELS[value]}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${DEADLINE_DOT}`} />
          {DEADLINE_LABEL}
        </span>
        {(['retours_client', 'livraison', 'personnel', 'autre'] as EventCategorie[]).map((value) => (
          <span key={value} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${CATEGORIE_DOT[value]}`} />
            {CATEGORIE_LABELS[value]}
          </span>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((jour) => (
              <div
                key={jour}
                className="px-2 py-2 text-center text-xs font-medium uppercase text-slate-400"
              >
                {jour}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {weeks.flat().map((day) => {
              const iso = toISODate(day)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const isToday = iso === todayISO()
              const isSelected = iso === selectedDay
              const dayEvents = eventsByDay[iso] || []
              const dayDeadlines = deadlinesByDay[iso] || []
              const totalItems = dayEvents.length + dayDeadlines.length

              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDay(iso)}
                  className={`min-h-24 border-b border-r border-slate-100 p-1.5 text-left align-top flex flex-col gap-1 hover:bg-slate-50 transition-colors ${
                    isSelected ? 'ring-2 ring-inset ring-brand-500' : ''
                  } ${!isCurrentMonth ? 'bg-slate-50/50' : ''}`}
                >
                  <span
                    className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-brand-600 text-white'
                        : isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-400'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {dayDeadlines.slice(0, 3).map((project) => (
                      <span
                        key={`deadline-${project.id}`}
                        className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight truncate font-medium ${DEADLINE_STYLE}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DEADLINE_DOT}`} />
                        <span className="truncate">🚩 {project.nom}</span>
                      </span>
                    ))}
                    {dayEvents.slice(0, Math.max(0, 3 - dayDeadlines.length)).map((event) => (
                      <span
                        key={event.id}
                        className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight truncate ${CATEGORIE_STYLES[event.categorie]}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${CATEGORIE_DOT[event.categorie]}`} />
                        <span className="truncate">
                          {event.heureDebut ? `${event.heureDebut} ` : ''}
                          {event.titre}
                        </span>
                      </span>
                    ))}
                    {totalItems > 3 && (
                      <span className="text-[10px] text-slate-400 px-1">
                        +{totalItems - 3} autre{totalItems - 3 > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="w-80 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-8">
            <h3 className="text-sm font-medium text-slate-800 capitalize">
              {formatDayLabel(selectedDay)}
            </h3>
            <Link
              to={`/agenda/nouveau?date=${selectedDay}`}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-1 inline-block"
            >
              + Ajouter un événement ce jour
            </Link>

            <div className="mt-4 space-y-2">
              {selectedDayDeadlines.length === 0 && selectedDayEvents.length === 0 ? (
                <p className="text-sm text-slate-400">Rien de prévu ce jour.</p>
              ) : (
                <>
                  {selectedDayDeadlines.map((project) => {
                    const client = project.clientId ? clients[project.clientId] : null
                    return (
                      <Link
                        key={`deadline-${project.id}`}
                        to={`/projets/${project.id}`}
                        className="block rounded-lg border border-red-200 bg-red-50/50 p-3 hover:border-red-300"
                      >
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${DEADLINE_STYLE}`}
                        >
                          🚩 {DEADLINE_LABEL}
                        </span>
                        <p className="text-sm font-medium text-slate-800 mt-1.5">{project.nom}</p>
                        {client && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {client.nom}
                            {client.prenom ? ` ${client.prenom}` : ''}
                          </p>
                        )}
                      </Link>
                    )
                  })}
                  {selectedDayEvents.map((event) => {
                    const client = event.clientId ? clients[event.clientId] : null
                    const project = event.projetId ? projectsMap[event.projetId] : null
                    return (
                      <Link
                        key={event.id}
                        to={`/agenda/${event.id}/modifier`}
                        className="block rounded-lg border border-slate-200 p-3 hover:border-brand-300 hover:bg-brand-50/40"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${CATEGORIE_STYLES[event.categorie]}`}
                          >
                            {CATEGORIE_LABELS[event.categorie]}
                          </span>
                          {event.heureDebut && (
                            <span className="text-xs text-slate-400">
                              {event.heureDebut}
                              {event.heureFin ? ` - ${event.heureFin}` : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-800 mt-1.5">{event.titre}</p>
                        {(client || project) && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {[client ? `${client.nom}${client.prenom ? ` ${client.prenom}` : ''}` : null, project?.nom]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                        {event.lieu && <p className="text-xs text-slate-400 mt-0.5">📍 {event.lieu}</p>}
                      </Link>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
