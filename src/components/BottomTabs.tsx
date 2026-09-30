// Tab bar at the bottom of the screen on phones (hidden from tablet width up, where the top menu shows).
// Four main pages + "More" for the rest.
import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

// Simple line icons (24×24), drawn with the current text colour
const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    {d}
  </svg>
)
const ICONS = {
  home: icon(<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />),
  internships: icon(
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </>,
  ),
  learning: icon(<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z" />),
  events: icon(
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </>,
  ),
  more: icon(
    <>
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="19" cy="12" r="1.3" />
    </>,
  ),
}

const MAIN = [
  { path: '/', label: 'Home', icon: ICONS.home },
  { path: '/internships', label: 'Internships', icon: ICONS.internships },
  { path: '/learning', label: 'Learning', icon: ICONS.learning },
  { path: '/events', label: 'Events', icon: ICONS.events },
]
const MORE = [
  { path: '/projects', label: 'Projects' },
  { path: '/resources', label: 'Resources' },
  { path: '/timeline', label: 'Timeline' },
  { path: '/backup', label: 'Backup' },
  { path: '/print', label: 'Print plan' },
]

const tabClass = (active: boolean) =>
  `flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] ${
    active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
  }`

export function BottomTabs() {
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const inMore = MORE.some((p) => pathname.startsWith(p.path))

  // Close the "More" sheet after navigating, and with Esc
  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moreOpen])

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setMoreOpen(false)}>
          <nav
            aria-label="More pages"
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] rounded-t-xl border-t border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900"
          >
            {MORE.map((p) => (
              <NavLink
                key={p.path}
                to={p.path}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-4 py-3 ${isActive ? 'bg-slate-100 font-medium dark:bg-slate-800' : ''}`
                }
              >
                {p.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <nav
        aria-label="Main"
        className="no-print fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-slate-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/95"
      >
        {MAIN.map((p) => (
          <NavLink key={p.path} to={p.path} end={p.path === '/'} className={({ isActive }) => tabClass(isActive)}>
            {p.icon}
            {p.label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          aria-expanded={moreOpen}
          className={tabClass(inMore || moreOpen)}
        >
          {ICONS.more}
          More
        </button>
      </nav>
    </>
  )
}
