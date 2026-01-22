// src/main.jsx (or index.jsx)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('A new version of the app is available. Reload to update?')) {
      updateSW(true) 
    }
  },
  onOfflineReady() {
    console.log('App is ready to work offline')
  },
  onRegistered(r) {
    if (r) {
      console.log('Service Worker registered successfully')
    }
  },
  onRegisterError(error) {
    console.error('Service Worker registration failed:', error)
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)