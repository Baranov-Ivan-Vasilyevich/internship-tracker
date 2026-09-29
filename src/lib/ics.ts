// Builds an .ics (iCalendar) file. Plain text: one BEGIN:VEVENT … END:VEVENT block per event.
// Rules we must follow: lines end with \r\n, all-day dates look like 20261031, commas and
// semicolons in text are escaped, and lines longer than 75 bytes are "folded".
import { addDays } from './dates'
import type { DatedItem } from './deadlines'

const icsDate = (iso: string) => iso.replaceAll('-', '')

export const escapeText = (t: string) =>
  t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

// Split long lines: continuation lines start with a space. Counts bytes, because Cyrillic takes 2 bytes per letter.
export function fold(line: string) {
  const bytes = (s: string) => new TextEncoder().encode(s).length
  const parts: string[] = []
  let current = ''
  for (const ch of line) {
    if (bytes(current + ch) > (parts.length === 0 ? 75 : 74)) {
      parts.push(current)
      current = ''
    }
    current += ch
  }
  parts.push(current)
  return parts.join('\r\n ')
}

// "2026-10-13" + "15:00" Moscow time (UTC+3, no daylight saving) → "20261013T120000Z"
export function moscowToUtc(day: string, time: string) {
  const [y, m, d] = day.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return new Date(Date.UTC(y, m - 1, d, h - 3, min)).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
}

type Options = { now?: Date; skipBefore?: string }

export function buildIcs(items: DatedItem[], { now = new Date(), skipBefore }: Options = {}) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '') // 20260929T120000Z
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Internship Tracker//EN', 'CALSCALE:GREGORIAN']

  for (const d of items) {
    if (d.kind === 'internship') continue // the internship period itself is not a date to remember
    if (skipBefore && d.end < skipBefore) continue // past dates

    const isWindow = d.deadline && d.start !== d.end
    const summary = isWindow ? `Deadline: ${d.label}` : d.label
    const description = [`Date is ${d.certainty}.`, isWindow ? `Window: ${d.start} to ${d.end}.` : '', d.note]
      .filter(Boolean)
      .join(' ')
    const tentative = d.certainty === 'expected' || d.certainty === 'approximate'

    // Timed events use exact times; everything else is all-day.
    // Deadlines become one day on the deadline; other events cover all their days.
    const when =
      d.startTime && d.endTime
        ? [`DTSTART:${moscowToUtc(d.start, d.startTime)}`, `DTEND:${moscowToUtc(d.end, d.endTime)}`]
        : [
            `DTSTART;VALUE=DATE:${icsDate(d.deadline ? d.end : d.start)}`,
            `DTEND;VALUE=DATE:${icsDate(addDays(d.end, 1))}`, // all-day events end the day AFTER
          ]

    lines.push(
      'BEGIN:VEVENT',
      `UID:${d.id}-${d.end}@internship-tracker`,
      `DTSTAMP:${stamp}`,
      ...when,
      `SUMMARY:${escapeText(`${summary} [${d.certainty}]`)}`,
      `DESCRIPTION:${escapeText(description)}`,
      `STATUS:${tentative ? 'TENTATIVE' : 'CONFIRMED'}`,
    )
    if (d.deadline) {
      // Reminder one week before
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:-P7D', `DESCRIPTION:${escapeText(summary)}`, 'END:VALARM')
    }
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
