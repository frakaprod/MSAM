import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { applyTheme, setupPrintGuard, watchSystemTheme } from './lib/theme'
import './assets/main.css'

// Appliqué avant le premier rendu (lecture synchrone côté main process) pour
// éviter un flash clair -> sombre au démarrage si l'utilisateur a choisi le
// mode sombre.
const initialPreferences = window.api.preferences.getSync()
applyTheme(initialPreferences.theme)
watchSystemTheme(() => window.api.preferences.getSync().theme)
setupPrintGuard()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
