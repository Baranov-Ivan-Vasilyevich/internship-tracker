import { describe, expect, it } from 'vitest'
import { backupsToDelete, localDate } from './diskSave.ts'

describe('daily backups', () => {
  it('keeps the 7 newest daily copies and deletes older ones', () => {
    const files = Array.from({ length: 9 }, (_, n) => `user-data-2026-10-${String(n + 1).padStart(2, '0')}.json`)
    expect(backupsToDelete(files)).toEqual(['user-data-2026-10-01.json', 'user-data-2026-10-02.json'])
  })

  it('ignores other files and deletes nothing when there are 7 or fewer', () => {
    expect(backupsToDelete(['user-data-2026-10-01.json', 'notes.txt', '.DS_Store'])).toEqual([])
  })

  it('names copies by the local date', () => {
    expect(localDate(new Date(2026, 9, 1, 23, 30))).toBe('2026-10-01')
  })
})
