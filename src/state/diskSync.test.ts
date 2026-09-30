import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSION } from '../schemas'
import { chooseStartupData } from './diskSync'

const seed = { internships: new Set(['alfa']), events: new Set<string>() }
const file = JSON.stringify({
  schemaVersion: SCHEMA_VERSION,
  learningDone: ['FND1'],
  internships: { alfa: { status: 'Applied' } },
})

describe('restore from data/user-data.json at startup', () => {
  it('restores when the browser is empty and the file exists', () => {
    const choice = chooseStartupData(false, file, seed)
    expect(choice && 'restore' in choice && choice.restore.learningDone).toEqual(['FND1'])
    expect(choice && 'restore' in choice && choice.restore.internships.alfa.status).toBe('Applied')
  })

  it('keeps the browser data when the browser already has some', () => {
    expect(chooseStartupData(true, file, seed)).toBeNull()
  })

  it('does nothing when there is no file yet', () => {
    expect(chooseStartupData(false, null, seed)).toBeNull()
  })

  it('upgrades an old (v1) file while restoring', () => {
    const v1 = JSON.stringify({ version: 1, internships: [{ id: 'alfa-bank', status: 'Offer' }], learningDone: [] })
    const choice = chooseStartupData(false, v1, seed)
    expect(choice && 'restore' in choice && choice.restore.internships.alfa.status).toBe('Offer')
  })

  it('reports a broken file instead of restoring it', () => {
    const choice = chooseStartupData(false, 'not json', seed)
    expect(choice && 'error' in choice).toBe(true)
  })
})
