import { describe, expect, it } from 'vitest'
import type { DatedItem } from './deadlines'
import { buildIcs, escapeText, fold, moscowToUtc } from './ics'

const base: DatedItem = {
  id: 'x',
  label: 'Test',
  start: '2026-10-01',
  end: '2026-11-02',
  certainty: 'official',
  deadline: true,
  note: '',
  kind: 'application',
}
const now = new Date('2026-09-29T10:00:00Z')

describe('.ics export', () => {
  it('uses CRLF line endings and wraps events in a calendar', () => {
    const ics = buildIcs([base], { now })
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics).not.toMatch(/[^\r]\n/)
  })

  it('puts a deadline on its last day, as an all-day event with a 7-day reminder', () => {
    const ics = buildIcs([base], { now })
    expect(ics).toContain('DTSTART;VALUE=DATE:20261102')
    expect(ics).toContain('DTEND;VALUE=DATE:20261103')
    expect(ics).toContain('SUMMARY:Deadline: Test [official]')
    expect(ics).toContain('TRIGGER:-P7D')
  })

  it('marks expected and approximate dates as TENTATIVE', () => {
    expect(buildIcs([{ ...base, certainty: 'expected' }], { now })).toContain('STATUS:TENTATIVE')
    expect(buildIcs([{ ...base, certainty: 'approximate' }], { now })).toContain('STATUS:TENTATIVE')
    expect(buildIcs([{ ...base, certainty: 'target' }], { now })).toContain('STATUS:CONFIRMED')
  })

  it('converts timed events from Moscow time to UTC', () => {
    expect(moscowToUtc('2026-10-13', '15:00')).toBe('20261013T120000Z')
    const ics = buildIcs(
      [{ ...base, start: '2026-10-13', end: '2026-10-13', startTime: '15:00', endTime: '19:00', deadline: false }],
      { now },
    )
    expect(ics).toContain('DTSTART:20261013T120000Z')
    expect(ics).toContain('DTEND:20261013T160000Z')
    expect(ics).not.toContain('VALARM')
  })

  it('skips past dates and the internship period', () => {
    const ics = buildIcs([base, { ...base, id: 'y', kind: 'internship' }], { now, skipBefore: '2026-12-01' })
    expect(ics).not.toContain('BEGIN:VEVENT')
  })

  it('escapes commas and semicolons', () => {
    expect(escapeText('a, b; c')).toBe('a\\, b\\; c')
  })

  it('folds long lines at 75 bytes, counting Cyrillic as 2 bytes', () => {
    const folded = fold('SUMMARY:' + 'Ж'.repeat(60))
    for (const line of folded.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    expect(folded.replace(/\r\n /g, '')).toBe('SUMMARY:' + 'Ж'.repeat(60))
  })
})
