import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'
import { HashRouter } from 'react-router-dom'
import { WorkoutProvider } from './store/WorkoutContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <WorkoutProvider>
        <App />
      </WorkoutProvider>
    </HashRouter>
  </React.StrictMode>,
)
