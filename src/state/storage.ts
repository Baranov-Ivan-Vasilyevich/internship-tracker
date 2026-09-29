// Reading and writing your data in the browser's localStorage.
import { EVENTS, INTERNSHIPS } from '../seed'
import type { SavedData } from '../types'
import { emptyData, migrate } from './migrate'

export const STORAGE_KEY = 'internship-tracker'
// Where the first version saved its data. It is read once for the upgrade and then left
// untouched, so it doubles as a backup of your pre-upgrade data.
export const LEGACY_KEY = 'internship-tracker-v1'

export const seedIds = () => ({
  internships: new Set(INTERNSHIPS.map((i) => i.id)),
  events: new Set(EVENTS.map((e) => e.id)),
})

export type LoadResult = { data: SavedData; warning: string | null }

export function loadSaved(): LoadResult {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY)
  } catch {
    return { data: emptyData(), warning: 'This browser blocks storage, so nothing you change will be remembered.' }
  }
  if (!raw) return { data: emptyData(), warning: null }
  try {
    const data = migrate(JSON.parse(raw), seedIds())
    saveData(data) // store the upgraded version right away (the old key is left as it was)
    return { data, warning: null }
  } catch (err) {
    // Never throw data away: park the unreadable copy under its own key before starting fresh
    const parked = `${STORAGE_KEY}-unreadable-${Date.now()}`
    try {
      localStorage.setItem(parked, raw)
    } catch {
      /* ignore */
    }
    return {
      data: emptyData(),
      warning: `Your saved data could not be read (${(err as Error).message}). A copy was kept under "${parked}". Import a backup to restore.`,
    }
  }
}

// Returns false if saving failed (storage full or blocked)
export function saveData(data: SavedData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}
