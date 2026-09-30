// Time log maths: hours per week, per item, and the weekly streak.
// Weeks run Monday–Sunday.
import { addDays, parseDate, toISO } from './dates'

export type TimeEntry = { id: string; date: string; itemId: string; hours: number; note: string }

// Monday of the week that contains `iso`
export function weekStart(iso: string) {
  const d = parseDate(iso)
  const daysSinceMonday = (d.getDay() + 6) % 7 // Sunday = 6, Monday = 0
  d.setDate(d.getDate() - daysSinceMonday)
  return toISO(d)
}

export function hoursInWeek(entries: TimeEntry[], anyDayOfWeek: string) {
  const from = weekStart(anyDayOfWeek)
  const to = addDays(from, 6)
  return round(entries.filter((e) => e.date >= from && e.date <= to).reduce((sum, e) => sum + e.hours, 0))
}

export function hoursByItem(entries: TimeEntry[]) {
  const map = new Map<string, number>()
  for (const e of entries) map.set(e.itemId, round((map.get(e.itemId) ?? 0) + e.hours))
  return map
}

// Streak = weeks in a row where you logged at least `target` hours.
// This week only counts once you reach the target; until then it doesn't break the streak.
export function streak(entries: TimeEntry[], target: number, today: string) {
  const met = (week: string) => hoursInWeek(entries, week) >= target
  const thisWeek = weekStart(today)

  let current = 0
  let week = met(thisWeek) ? thisWeek : addDays(thisWeek, -7)
  while (met(week)) {
    current++
    week = addDays(week, -7)
  }

  let best = 0
  let run = 0
  if (entries.length > 0) {
    const first = weekStart(entries.reduce((min, e) => (e.date < min ? e.date : min), entries[0].date))
    for (let w = first; w <= thisWeek; w = addDays(w, 7)) {
      run = met(w) ? run + 1 : 0
      best = Math.max(best, run)
    }
  }
  return { current, best }
}

const round = (n: number) => Math.round(n * 100) / 100
