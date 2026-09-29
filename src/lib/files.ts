// Creating files for download: the JSON backup and the .ics calendar.
import { KEY_DATES } from '../seed'
import { addDays, todayISO } from './dates'

// Ask the browser to save some text as a file
export function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ---------- .ics (iCalendar) ----------
// The format is plain text: one BEGIN:VEVENT … END:VEVENT block per event.
// Rules we must follow: lines end with \r\n, dates look like 20261031,
// commas/semicolons in text are escaped, and lines longer than 75 bytes are "folded".

const icsDate = (iso: string) => iso.replaceAll('-', '')

const escapeText = (t: string) =>
  t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

// Split long lines: continuation lines start with a space. Counts bytes, because Cyrillic takes 2 bytes per letter.
function fold(line: string) {
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

export function buildIcs() {
  const today = todayISO()
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '') // 20260929T120000Z
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Internship Tracker//EN', 'CALSCALE:GREGORIAN']

  for (const d of KEY_DATES) {
    if (d.type === 'internship' || d.end < today) continue // skip the internship period itself and past dates

    // Deadlines become a one-day event on the deadline; other events cover their dates
    const start = d.deadline ? d.end : d.start
    const summary = d.deadline && d.start !== d.end ? `Deadline: ${d.label}` : d.label
    const description = [
      `Date is ${d.certainty}.`,
      d.start !== d.end ? `Window: ${d.start} to ${d.end}.` : '',
      d.note,
    ]
      .filter(Boolean)
      .join(' ')
    const tentative = d.certainty === 'expected' || d.certainty === 'approximate'

    lines.push(
      'BEGIN:VEVENT',
      `UID:${d.id}-${d.end}@internship-tracker`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(start)}`,
      `DTEND;VALUE=DATE:${icsDate(addDays(d.end, 1))}`, // all-day events end the day AFTER
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
