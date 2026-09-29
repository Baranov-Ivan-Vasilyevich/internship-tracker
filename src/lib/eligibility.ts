// "Eligible now" is calculated from today's month and the internship's eligibleFrom ("YYYY-MM").
import { formatMonth } from './dates'

export function isEligibleNow(eligibleFrom: string | null, month: string) {
  return eligibleFrom !== null && month >= eligibleFrom // "YYYY-MM" strings compare correctly as text
}

export function eligibilityText(eligibleFrom: string | null, month: string) {
  if (eligibleFrom === null) return 'Not set'
  return isEligibleNow(eligibleFrom, month) ? 'Eligible now' : `From ${formatMonth(eligibleFrom)}`
}
