import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { DataProvider } from './store.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter (URLs like /#/learning) works on GitHub Pages without any server setup */}
    <HashRouter>
      <DataProvider>
        <App />
      </DataProvider>
    </HashRouter>
  </StrictMode>,
)
