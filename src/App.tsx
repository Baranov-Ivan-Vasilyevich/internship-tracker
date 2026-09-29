import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import Backup from './pages/Backup'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import Internships from './pages/Internships'
import Learning from './pages/Learning'
import Projects from './pages/Projects'
import Timeline from './pages/Timeline'

const PAGES = [
  { path: '/', label: 'Dashboard' },
  { path: '/internships', label: 'Internships' },
  { path: '/learning', label: 'Learning' },
  { path: '/projects', label: 'Projects' },
  { path: '/events', label: 'Events' },
  { path: '/timeline', label: 'Timeline' },
  { path: '/backup', label: 'Backup' },
]

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }
  return (
    <button
      onClick={toggle}
      className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-label="Toggle dark mode"
    >
      {dark ? '☀︎' : '☾'}
      {/* The word is hidden on phones to save space */}
      <span className="hidden sm:inline"> {dark ? 'Light' : 'Dark'}</span>
    </button>
  )
}

export default function App() {
  // On a phone the menu scrolls sideways: keep the current page's tab visible
  const { pathname } = useLocation()
  useEffect(() => {
    document.querySelector('nav [aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [pathname])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <span className="shrink-0 font-semibold">IB Tracker</span>
          {/* On phones the menu scrolls sideways instead of wrapping */}
          <nav className="flex flex-1 gap-1 overflow-x-auto">
            {PAGES.map((p) => (
              <NavLink
                key={p.path}
                to={p.path}
                end
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`
                }
              >
                {p.label}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/internships" element={<Internships />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/events" element={<Events />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/backup" element={<Backup />} />
        </Routes>
      </main>
    </div>
  )
}
