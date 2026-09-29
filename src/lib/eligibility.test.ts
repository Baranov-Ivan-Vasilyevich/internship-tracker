import { describe, expect, it } from 'vitest'
import { INTERNSHIPS } from '../seed'
import { eligibilityText, isEligibleNow } from './eligibility'

describe('eligibility', () => {
  it('is eligible from the eligibleFrom month onwards', () => {
    expect(isEligibleNow('2027-03', '2027-02')).toBe(false)
    expect(isEligibleNow('2027-03', '2027-03')).toBe(true)
    expect(isEligibleNow('2027-03', '2028-01')).toBe(true)
  })

  it('treats an unknown month as not eligible', () => {
    expect(isEligibleNow(null, '2030-01')).toBe(false)
    expect(eligibilityText(null, '2030-01')).toBe('Not set')
  })

  it('shows the month when not yet eligible', () => {
    expect(eligibilityText('2027-09', '2026-09')).toBe('From Sep 2027')
    expect(eligibilityText('2026-09', '2026-09')).toBe('Eligible now')
  })

  it('matches the plan: 8 programs are open in September 2026', () => {
    const now = INTERNSHIPS.filter((i) => isEligibleNow(i.eligibleFrom, '2026-09')).map((i) => i.id)
    expect(now).toHaveLength(8)
    expect(now).not.toContain('moex-summer')
    // MOEX opens in March 2027, the core IB programs in September 2027
    expect(INTERNSHIPS.filter((i) => isEligibleNow(i.eligibleFrom, '2027-03'))).toHaveLength(9)
    expect(INTERNSHIPS.filter((i) => isEligibleNow(i.eligibleFrom, '2027-09'))).toHaveLength(12)
  })
})
