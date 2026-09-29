// Date helpers. Dates are stored as text: "2026-10-31" (day) or "2026-10" (month).
// We build Date objects in local time so "today" matches your own clock.

const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const todayISO = () => toISO(new Date())
export const currentMonth = () => todayISO().slice(0, 7)

// "2026-10-31" or "2026-10" → Date (a month means its 1st day)
export function parseDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d || 1)
}

export function addDays(iso: string, days: number) {
  const d = parseDate(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

// "2026-10" → "2026-10-31"
export function monthEnd(month: string) {
  const [y, m] = month.split('-').map(Number)
  return `${month}-${pad(new Date(y, m, 0).getDate())}` // day 0 of next month = last day of this one
}

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "2026-10-31" → "31 Oct 2026"
export function formatDate(iso: string) {
  const d = parseDate(iso)
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

// "2026-10" → "Oct 2026"
export function formatMonth(month: string) {
  const d = parseDate(month)
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

export function daysUntil(iso: string) {
  return Math.round((parseDate(iso).getTime() - parseDate(todayISO()).getTime()) / 86_400_000)
}

export function inDaysText(iso: string) {
  const n = daysUntil(iso)
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  return n > 0 ? `in ${n} days` : `${-n} days ago`
}
