import { describe, expect, it } from 'vitest'
import { addDays, formatDate, formatMonth, monthEnd } from './dates'
import { collectDates, upcomingDeadlines } from './deadlines'
import { EVENTS } from '../seed'

describe('date helpers', () => {
  it('finds the last day of a month, including February', () => {
    expect(monthEnd('2027-02')).toBe('2027-02-28')
    expect(monthEnd('2028-02')).toBe('2028-02-29')
    expect(monthEnd('2026-11')).toBe('2026-11-30')
  })

  it('adds days across month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-11-02', 1)).toBe('2026-11-03')
  })

  it('formats dates without the "Sept" quirk', () => {
    expect(formatDate('2027-09-01')).toBe('1 Sep 2027')
    expect(formatMonth('2026-10')).toBe('Oct 2026')
  })
})

describe('deadlines', () => {
  it('lists the next deadlines from windows and events, soonest first', () => {
    const next = upcomingDeadlines(collectDates(EVENTS), '2026-09-29').slice(0, 4)
    expect(next.map((d) => d.end)).toEqual(['2026-10-18', '2026-10-26', '2026-10-31', '2026-10-31'])
  })

  it('drops deadlines that have passed', () => {
    const next = upcomingDeadlines(collectDates(EVENTS), '2026-11-03')
    expect(next.every((d) => d.end >= '2026-11-03')).toBe(true)
  })
})
