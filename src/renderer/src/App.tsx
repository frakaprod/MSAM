import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ClientsListPage from './pages/Clients/ClientsListPage'
import ClientFormPage from './pages/Clients/ClientFormPage'
import ClientDetailPage from './pages/Clients/ClientDetailPage'

export default function App(): React.JSX.Element {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/clients" replace />} />
          <Route path="/clients" element={<ClientsListPage />} />
          <Route path="/clients/nouveau" element={<ClientFormPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/clients/:id/modifier" element={<ClientFormPage />} />
        </Routes>
      </main>
    </div>
  )
}
