import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSION } from '../schemas'
import { emptyData, migrate } from './migrate'

const seed = {
  internships: new Set(['tedo-valuation', 'cbr-spring', 'alfa']),
  events: new Set(['cup-russia']),
}

// What the first version stored in localStorage
const v1 = {
  version: 1,
  internships: [
    { id: 'tedo-valuation', company: 'ТеДо', status: 'Applied', notes: 'sent CV', dateApplied: '2026-10-01' },
    { id: 'bank-of-russia', company: 'Bank of Russia', status: 'Preparing', notes: '', dateApplied: '' },
    { id: 'abc-123', company: 'My own', role: 'Analyst', status: 'Weird', notes: 'x', tracks: ['C'], ibFit: 'Top' },
  ],
  learningDone: ['FND1', 42],
  projectsDone: ['P1'],
  events: [
    {
      id: 'cup-russia',
      status: 'Registered',
      notes: 'team',
      rounds: [{ id: 'r1', date: '2026-10-01', round: 'Q', whatIDid: 'DCF', result: '' }, { broken: true }],
    },
    { id: 'e-1', name: 'Career fair', kind: 'event', track: '', info: '', link: 'https://a.b', custom: true },
  ],
}

describe('migrate', () => {
  it('turns v1 data into the current version without losing statuses, notes or ticks', () => {
    const d = migrate(v1, seed)
    expect(d.schemaVersion).toBe(SCHEMA_VERSION)
    expect(d.internships['tedo-valuation']).toMatchObject({
      status: 'Applied',
      notes: 'sent CV',
      dateApplied: '2026-10-01',
    })
    expect(d.learningDone).toEqual(['FND1'])
    expect(d.projectsDone).toEqual(['P1'])
  })

  it('follows renamed internship ids', () => {
    const d = migrate(v1, seed)
    expect(d.internships['cbr-spring'].status).toBe('Preparing')
    expect(d.internships['bank-of-russia']).toBeUndefined()
  })

  it('keeps internships you added yourself, fixing invalid values instead of dropping them', () => {
    const d = migrate(v1, seed)
    expect(d.customInternships).toHaveLength(1)
    expect(d.customInternships[0]).toMatchObject({
      id: 'abc-123',
      company: 'My own',
      ibFit: 'Medium',
      eligibleFrom: null,
    })
    expect(d.internships['abc-123'].status).toBe('Not started')
  })

  it('keeps event status and valid rounds, and your own events', () => {
    const d = migrate(v1, seed)
    expect(d.events['cup-russia'].status).toBe('Registered')
    expect(d.events['cup-russia'].rounds).toHaveLength(1)
    expect(d.customEvents.map((e) => e.name)).toEqual(['Career fair'])
  })

  it('fills in missing fields of current-version data', () => {
    const d = migrate({ schemaVersion: SCHEMA_VERSION, internships: { alfa: { status: 'Offer' } } }, seed)
    expect(d.internships.alfa).toMatchObject({ status: 'Offer', notes: '', stagesDone: [], log: [] })
    expect(d.customEvents).toEqual([])
  })

  it('never keeps a rename target and old id at once, and leaves unknown ids alone', () => {
    const d = migrate({ ...emptyData(), internships: { 'removed-row': { status: 'Applied' } } }, seed)
    expect(d.internships['removed-row'].status).toBe('Applied') // kept, just not shown
  })

  it('rejects files that are not from this app', () => {
    expect(() => migrate({ hello: 1 }, seed)).toThrow()
    expect(() => migrate(null, seed)).toThrow()
  })
})
