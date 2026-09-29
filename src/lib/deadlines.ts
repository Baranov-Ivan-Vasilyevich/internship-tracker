// One list of every date in the app: application windows + the dates of each event.
// The Dashboard, Events page, Timeline and calendar export all read from here.
import { WINDOWS } from '../seed'
import type { Dated, EventEntry } from '../types'

export type DatedItem = Dated & {
  kind: 'application' | 'internship' | 'event'
  eventId?: string
  internshipIds?: string[]
}

export function collectDates(events: EventEntry[]): DatedItem[] {
  return [
    ...WINDOWS.map((w) => ({ ...w, kind: w.type })),
    ...events.flatMap((e) => e.dates.map((d) => ({ ...d, kind: 'event' as const, eventId: e.id }))),
  ]
}

// Deadlines that haven't passed, soonest first (the end date is the deadline)
export function upcomingDeadlines(items: DatedItem[], today: string) {
  return items.filter((d) => d.deadline && d.end >= today).sort((a, b) => a.end.localeCompare(b.end))
}

// Anything (deadline or not) that hasn't finished yet, by start date
export function upcomingDates(items: DatedItem[], today: string) {
  return items.filter((d) => d.end >= today).sort((a, b) => a.start.localeCompare(b.start))
}
