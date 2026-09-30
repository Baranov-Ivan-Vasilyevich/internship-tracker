import { describe, expect, it } from 'vitest'
import { hoursByItem, hoursInWeek, streak, weekStart, type TimeEntry } from './timeLog'

let n = 0
const e = (date: string, hours: number, itemId = 'FND1'): TimeEntry => ({
  id: String(n++),
  date,
  itemId,
  hours,
  note: '',
})

describe('weeks', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart('2026-10-01')).toBe('2026-09-28') // Thursday → Monday
    expect(weekStart('2026-10-04')).toBe('2026-09-28') // Sunday belongs to the same week
    expect(weekStart('2026-10-05')).toBe('2026-10-05') // Monday
  })

  it('adds up hours in a week, ignoring other weeks', () => {
    const log = [e('2026-09-28', 2), e('2026-10-04', 1.5), e('2026-10-05', 3)]
    expect(hoursInWeek(log, '2026-10-01')).toBe(3.5)
    expect(hoursInWeek(log, '2026-10-05')).toBe(3)
  })

  it('adds up hours per learning item', () => {
    const map = hoursByItem([e('2026-10-01', 1, 'FND1'), e('2026-10-02', 0.5, 'FND1'), e('2026-10-02', 2, 'A1')])
    expect(map.get('FND1')).toBe(1.5)
    expect(map.get('A1')).toBe(2)
  })
})

describe('streak', () => {
  const target = 6
  it('is 0 with no time logged', () => {
    expect(streak([], target, '2026-10-01')).toEqual({ current: 0, best: 0 })
  })

  it('counts weeks in a row that reached the target', () => {
    const log = [e('2026-10-05', 6), e('2026-10-12', 3), e('2026-10-14', 3), e('2026-10-19', 7)]
    expect(streak(log, target, '2026-10-21')).toEqual({ current: 3, best: 3 })
  })

  it("doesn't break the streak while this week is still in progress", () => {
    const log = [e('2026-10-05', 6), e('2026-10-12', 6), e('2026-10-19', 2)]
    expect(streak(log, target, '2026-10-21').current).toBe(2)
  })

  it('resets after a missed week but remembers the best run', () => {
    const log = [e('2026-10-05', 6), e('2026-10-12', 6), e('2026-10-26', 6)]
    expect(streak(log, target, '2026-10-28')).toEqual({ current: 1, best: 2 })
  })
})
