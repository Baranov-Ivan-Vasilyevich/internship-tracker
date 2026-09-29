// All saving and loading lives here.
//
// How it works:
// - Internships and events: copied from internships.json / events.json into localStorage
//   on the first visit. After that your saved copy is used, so your statuses, notes and
//   round logs are never overwritten. A NEW row (new id) in those files is added on next load.
// - Learning items, projects and key dates are read straight from the JSON files,
//   so editing those files changes the app. Only your ticks are saved.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import seedEvents from './data/events.json'
import seedInternships from './data/internships.json'
import type { EventEntry, Internship, Round, SavedData } from './types'

const STORAGE_KEY = 'internship-tracker-v1'

function seed(): SavedData {
  return {
    version: 1,
    internships: seedInternships as Internship[],
    learningDone: [],
    projectsDone: [],
    events: seedEvents as EventEntry[],
  }
}

// Fills in anything missing from saved data (or an older backup):
// rows that exist in the seed JSON but not in your saved copy are added at the end.
export function withSeedRows(saved: Partial<SavedData>): SavedData {
  const base = seed()
  const addMissing = <T extends { id: string }>(mine: T[] | undefined, seedRows: T[]) => {
    const list = mine ?? []
    const known = new Set(list.map((r) => r.id))
    return [...list, ...seedRows.filter((r) => !known.has(r.id))]
  }
  return {
    ...base,
    ...saved,
    version: 1,
    internships: addMissing(saved.internships, base.internships),
    events: addMissing(saved.events, base.events),
  }
}

function load(): SavedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    return withSeedRows(JSON.parse(raw) as Partial<SavedData>)
  } catch {
    // Storage blocked or data broken: start from the seed instead of crashing
    return seed()
  }
}

type Store = {
  data: SavedData
  setData: (update: (old: SavedData) => SavedData) => void
}

const DataContext = createContext<Store | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SavedData>(load)

  // Save after every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      /* private mode etc. — the app still works, it just won't remember */
    }
  }, [data])

  return <DataContext.Provider value={{ data, setData }}>{children}</DataContext.Provider>
}

export function useData() {
  const store = useContext(DataContext)
  if (!store) throw new Error('useData must be used inside <DataProvider>')
  return store
}

// Small helper: change one internship by id
export function useInternships() {
  const { data, setData } = useData()
  const update = (id: string, changes: Partial<Internship>) =>
    setData((d) => ({
      ...d,
      internships: d.internships.map((i) => (i.id === id ? { ...i, ...changes } : i)),
    }))
  const add = (i: Internship) => setData((d) => ({ ...d, internships: [...d.internships, i] }))
  return { internships: data.internships, update, add }
}

// Tick / untick a learning item or a CV project
export function useToggle() {
  const { setData } = useData()
  return (list: 'learningDone' | 'projectsDone', id: string) =>
    setData((d) => ({
      ...d,
      [list]: d[list].includes(id) ? d[list].filter((x) => x !== id) : [...d[list], id],
    }))
}

// Used by the Backup page. (Backups made before the Events page have no "events"; that's fine.)
export function isSavedData(x: unknown): x is Partial<SavedData> {
  const d = x as SavedData
  return (
    !!d && d.version === 1 && Array.isArray(d.internships) && Array.isArray(d.learningDone) && Array.isArray(d.projectsDone)
  )
}

// Everything the Events page needs to change events and their round logs
export function useEvents() {
  const { data, setData } = useData()
  const change = (fn: (events: EventEntry[]) => EventEntry[]) => setData((d) => ({ ...d, events: fn(d.events) }))
  return {
    events: data.events,
    update: (id: string, changes: Partial<EventEntry>) =>
      change((list) => list.map((e) => (e.id === id ? { ...e, ...changes } : e))),
    add: (e: EventEntry) => change((list) => [...list, e]),
    remove: (id: string) => change((list) => list.filter((e) => e.id !== id)),
    addRound: (id: string, round: Round) =>
      change((list) => list.map((e) => (e.id === id ? { ...e, rounds: [...e.rounds, round] } : e))),
    removeRound: (id: string, roundId: string) =>
      change((list) => list.map((e) => (e.id === id ? { ...e, rounds: e.rounds.filter((r) => r.id !== roundId) } : e))),
  }
}
export { seed as freshData }
