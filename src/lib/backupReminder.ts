// When to remind you that the iPhone (view) copy is out of date.
// The Mac is the main device; the iPhone gets a fresh backup from it every week. The backup
// carries the date the Mac made it (lastBackupAt), so on the iPhone that date = "last update".
// Never shown on the Mac while npm run dev saves to disk.
import type { SavedData } from '../types'
import { daysBetween } from './dates'

export const REMIND_AFTER_DAYS = 7
export const SNOOZE_DAYS = 7

// Is there anything worth backing up?
export function hasUserData(d: SavedData) {
  return (
    d.learningDone.length > 0 ||
    d.timeLog.length > 0 ||
    d.customInternships.length > 0 ||
    d.customEvents.length > 0 ||
    Object.keys(d.internships).length > 0 ||
    Object.keys(d.events).length > 0 ||
    Object.keys(d.projects).length > 0
  )
}

// Returns null (no reminder) or how many days old this copy is (Infinity = never updated from the Mac)
export function backupReminder(d: SavedData, today: string, savedToDisk: boolean): number | null {
  if (savedToDisk || !hasUserData(d)) return null
  if (d.backupSnoozedUntil && today < d.backupSnoozedUntil) return null
  if (!d.lastBackupAt) return Infinity
  const days = daysBetween(d.lastBackupAt, today)
  return days >= REMIND_AFTER_DAYS ? days : null
}
