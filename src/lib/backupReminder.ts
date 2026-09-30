// When to remind you to download a backup (mainly for the phone / GitHub Pages version,
// where nothing is saved to disk).
import type { SavedData } from '../types'
import { daysBetween } from './dates'

export const REMIND_AFTER_DAYS = 30
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

// Returns null (no reminder) or the number of days since the last backup (Infinity = never)
export function backupReminder(d: SavedData, today: string, savedToDisk: boolean): number | null {
  if (savedToDisk || !hasUserData(d)) return null
  if (d.backupSnoozedUntil && today < d.backupSnoozedUntil) return null
  if (!d.lastBackupAt) return Infinity
  const days = daysBetween(d.lastBackupAt, today)
  return days >= REMIND_AFTER_DAYS ? days : null
}
