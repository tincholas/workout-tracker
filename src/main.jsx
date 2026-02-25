import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'
import { HashRouter } from 'react-router-dom'
import { WorkoutProvider } from './store/WorkoutContext.jsx'

// Apply persisted theme before React renders (prevents flash)
const savedTheme = localStorage.getItem('app_theme');
if (savedTheme && savedTheme !== 'system') {
  document.documentElement.setAttribute('data-theme', savedTheme);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <WorkoutProvider>
        <App />
      </WorkoutProvider>
    </HashRouter>
  </React.StrictMode>,
)
