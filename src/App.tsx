import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { BackupReminder } from './components/BackupReminder'
import { DiskIndicator } from './components/DiskIndicator'
import { SearchPalette } from './components/SearchPalette'
import Backup from './pages/Backup'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import Internships from './pages/Internships'
import Learning from './pages/Learning'
import Projects from './pages/Projects'
import Resources from './pages/Resources'
import Timeline from './pages/Timeline'
import { SEED_ERRORS } from './seed'
import { useData } from './state/context'

const PAGES = [
  { path: '/', label: 'Dashboard' },
  { path: '/internships', label: 'Internships' },
  { path: '/learning', label: 'Learning' },
  { path: '/projects', label: 'Projects' },
  { path: '/events', label: 'Events' },
  { path: '/resources', label: 'Resources' },
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

// Shown instead of the app when a JSON file in src/data has a mistake
function DataErrors() {
  return (
    <main className="mx-auto max-w-3xl space-y-3 px-4 py-10">
      <h1 className="text-xl font-semibold text-rose-600">There is a mistake in the data files</h1>
      <p className="text-sm">Fix these in src/data/ and save; the page reloads by itself.</p>
      <ul className="list-disc space-y-1 pl-5 font-mono text-sm">
        {SEED_ERRORS.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </main>
  )
}

export default function App() {
  if (SEED_ERRORS.length > 0) return <DataErrors />
  return <Layout />
}

function Layout() {
  const { warning, notice, dismissNotice } = useData()
  const [searching, setSearching] = useState(false)

  // Cmd+K (Mac) or Ctrl+K (Windows) opens search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearching((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
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
                end={p.path === '/'}
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
          <button
            onClick={() => setSearching(true)}
            className="shrink-0 rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Search (Cmd+K)"
            title="Search (⌘K / Ctrl+K)"
          >
            <svg
              viewBox="0 0 20 20"
              className="inline h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4.5 4.5" strokeLinecap="round" />
            </svg>
            <span className="ml-1 hidden text-xs text-slate-400 lg:inline">⌘K</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {warning && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
          >
            {warning}
          </p>
        )}
        <BackupReminder />
        {notice && (
          <p
            role="status"
            className="mb-4 flex items-start gap-3 rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200"
          >
            <span className="flex-1">{notice}</span>
            <button onClick={dismissNotice} aria-label="Dismiss" className="text-emerald-700 dark:text-emerald-300">
              ✕
            </button>
          </p>
        )}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/internships" element={<Internships />} />
          <Route path="/internships/:id" element={<Internships />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/events" element={<Events />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/backup" element={<Backup />} />
        </Routes>
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-6">
        <DiskIndicator />
      </footer>
      {searching && <SearchPalette onClose={() => setSearching(false)} />}
    </div>
  )
}
