import { useEffect, useState } from 'react'
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
import FacturationLayout from './pages/Facturation/FacturationLayout'
import DocumentsListPage from './pages/Facturation/DocumentsListPage'
import DocumentFormPage from './pages/Facturation/DocumentFormPage'
import DocumentDetailPage from './pages/Facturation/DocumentDetailPage'
import ProfilesListPage from './pages/Facturation/ProfilesListPage'
import ProfileFormPage from './pages/Facturation/ProfileFormPage'
import PaymentsListPage from './pages/Paiements/PaymentsListPage'
import PreferencesPage from './pages/Preferences/PreferencesPage'

function HomeRedirect(): React.JSX.Element | null {
  const [target, setTarget] = useState<string | null>(null)

  useEffect(() => {
    window.api.preferences.get().then((p) => setTarget(p.pageDemarrage || '/agenda'))
  }, [])

  if (!target) return null
  return <Navigate to={target} replace />
}

export default function App(): React.JSX.Element {
  return (
    <div className="flex h-screen w-screen overflow-hidden print:h-auto print:overflow-visible print:block">
      <Sidebar />
      <main className="flex-1 overflow-y-auto print:overflow-visible">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />

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

          <Route path="/facturation" element={<FacturationLayout />}>
            <Route index element={<Navigate to="/facturation/factures" replace />} />
            <Route path="factures" element={<DocumentsListPage type="facture" />} />
            <Route path="devis" element={<DocumentsListPage type="devis" />} />
            <Route path="profils" element={<ProfilesListPage />} />
          </Route>
          <Route path="/facturation/factures/nouveau" element={<DocumentFormPage type="facture" />} />
          <Route path="/facturation/factures/:id" element={<DocumentDetailPage type="facture" />} />
          <Route
            path="/facturation/factures/:id/modifier"
            element={<DocumentFormPage type="facture" />}
          />
          <Route path="/facturation/devis/nouveau" element={<DocumentFormPage type="devis" />} />
          <Route path="/facturation/devis/:id" element={<DocumentDetailPage type="devis" />} />
          <Route path="/facturation/devis/:id/modifier" element={<DocumentFormPage type="devis" />} />
          <Route path="/facturation/profils/nouveau" element={<ProfileFormPage />} />
          <Route path="/facturation/profils/:id/modifier" element={<ProfileFormPage />} />

          <Route path="/paiements" element={<PaymentsListPage />} />

          <Route path="/preferences" element={<PreferencesPage />} />
        </Routes>
      </main>
    </div>
  )
}
