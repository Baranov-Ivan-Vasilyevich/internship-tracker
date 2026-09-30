import { describe, expect, it } from 'vitest'
import { emptyData } from '../state/migrate'
import { backupReminder, hasUserData } from './backupReminder'

const withData = () => ({ ...emptyData(), learningDone: ['FND1'] })

describe('view-copy reminder (iPhone)', () => {
  it('stays quiet when there is nothing to back up', () => {
    expect(hasUserData(emptyData())).toBe(false)
    expect(backupReminder(emptyData(), '2026-11-01', false)).toBeNull()
  })

  it('reminds when you have data but never downloaded a backup', () => {
    expect(backupReminder(withData(), '2026-10-01', false)).toBe(Infinity)
  })

  it('reminds when the copy is a week old, not before', () => {
    const d = { ...withData(), lastBackupAt: '2026-10-01' }
    expect(backupReminder(d, '2026-10-07', false)).toBeNull()
    expect(backupReminder(d, '2026-10-08', false)).toBe(7)
  })

  it('never reminds while the data is saved to disk (npm run dev)', () => {
    expect(backupReminder(withData(), '2026-12-01', true)).toBeNull()
  })

  it('respects "remind me in a week"', () => {
    const d = { ...withData(), backupSnoozedUntil: '2026-10-08' }
    expect(backupReminder(d, '2026-10-07', false)).toBeNull()
    expect(backupReminder(d, '2026-10-08', false)).toBe(Infinity)
  })
})
