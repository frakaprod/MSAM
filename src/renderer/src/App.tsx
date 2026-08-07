import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ClientsListPage from './pages/Clients/ClientsListPage'
import ClientFormPage from './pages/Clients/ClientFormPage'
import ClientDetailPage from './pages/Clients/ClientDetailPage'
import ProjectsListPage from './pages/Projects/ProjectsListPage'
import ProjectFormPage from './pages/Projects/ProjectFormPage'
import ProjectDetailPage from './pages/Projects/ProjectDetailPage'
import AgendaPage from './pages/Agenda/AgendaPage'
import EventFormPage from './pages/Agenda/EventFormPage'

export default function App(): React.JSX.Element {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/agenda" replace />} />

          <Route path="/clients" element={<ClientsListPage />} />
          <Route path="/clients/nouveau" element={<ClientFormPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/clients/:id/modifier" element={<ClientFormPage />} />

          <Route path="/projets" element={<ProjectsListPage />} />
          <Route path="/projets/nouveau" element={<ProjectFormPage />} />
          <Route path="/projets/:id" element={<ProjectDetailPage />} />
          <Route path="/projets/:id/modifier" element={<ProjectFormPage />} />

          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/agenda/nouveau" element={<EventFormPage />} />
          <Route path="/agenda/:id/modifier" element={<EventFormPage />} />
        </Routes>
      </main>
    </div>
  )
}
