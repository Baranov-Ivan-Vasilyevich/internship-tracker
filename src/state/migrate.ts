// Turns saved data of ANY older version into the current version (schemaVersion 2).
// Pure function (no localStorage here) so it can be tested.
//
// Version history:
//   v1 (first build): { version: 1, internships: [full rows incl. status/notes], learningDone,
//                       projectsDone, events?: [full rows incl. status/notes/rounds] }
//   v2 (now): your data kept apart from the plan data, keyed by id. See SavedDataSchema.
import {
  EventStateSchema,
  InternshipSchema,
  InternshipStateSchema,
  RoundSchema,
  SCHEMA_VERSION,
  SavedDataSchema,
} from '../schemas'
import type { EventEntry, Internship, SavedData } from '../types'

// Internship ids that were renamed in v2, so your saved statuses follow them
export const ID_RENAMES: Record<string, string> = {
  'bank-of-russia': 'cbr-spring',
  'alfa-bank': 'alfa',
  'b1-ta': 'b1-tas',
  'drt-school': 'drt-young-cfo',
  'vim-investments': 'vim',
}

export const emptyData = (): SavedData => SavedDataSchema.parse({ schemaVersion: SCHEMA_VERSION })

type SeedIds = { internships: Set<string>; events: Set<string> }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any // old data is untyped JSON

const str = (x: unknown) => (typeof x === 'string' ? x : '')

export function migrate(raw: unknown, seed: SeedIds): SavedData {
  const d = raw as Loose
  if (d && d.schemaVersion === SCHEMA_VERSION) return SavedDataSchema.parse(d) // fills in any missing fields
  if (d && d.version === 1) return fromV1(d, seed)
  throw new Error('This is not data from this app (no known version number).')
}

function fromV1(d: Loose, seed: SeedIds): SavedData {
  const out = emptyData()
  out.learningDone = Array.isArray(d.learningDone) ? d.learningDone.filter((x: unknown) => typeof x === 'string') : []
  out.projectsDone = Array.isArray(d.projectsDone) ? d.projectsDone.filter((x: unknown) => typeof x === 'string') : []

  for (const row of Array.isArray(d.internships) ? d.internships : []) {
    const id = ID_RENAMES[row.id] ?? str(row.id)
    const state = {
      status: row.status,
      notes: str(row.notes),
      dateApplied: str(row.dateApplied),
    }
    out.internships[id] = InternshipStateSchema.parse(safeStatus(state, row.status))
    if (!seed.internships.has(id)) out.customInternships.push(customInternship(id, row))
  }

  for (const row of Array.isArray(d.events) ? d.events : []) {
    const id = str(row.id)
    out.events[id] = EventStateSchema.parse({
      status: row.status,
      notes: str(row.notes),
      // keep only well-formed rounds, so one broken entry can't block the whole migration
      rounds: Array.isArray(row.rounds) ? row.rounds.filter((r: unknown) => RoundSchema.safeParse(r).success) : [],
    })
    if (!seed.events.has(id)) out.customEvents.push(customEvent(id, row))
  }
  return out
}

// An unknown status would fail the schema; fall back to "Not started" rather than losing the row
function safeStatus(state: Loose, status: unknown) {
  const ok = ['Not started', 'Preparing', 'Applied', 'Interview', 'Offer', 'Rejected'].includes(status as string)
  return ok ? state : { ...state, status: 'Not started' }
}

// Internships you had added yourself in v1 → the v2 shape (eligibleFrom unknown, no stages or sources)
function customInternship(id: string, row: Loose): Internship {
  const fit = (x: unknown) => (['High', 'Medium', 'Low'].includes(x as string) ? x : 'Medium')
  return InternshipSchema.parse({
    id,
    company: str(row.company) || '(no name)',
    role: str(row.role),
    whatYouDo: str(row.whatYouDo),
    qualify: str(row.qualify),
    eligibleFrom: null,
    hours: str(row.hours),
    applicationWindow: str(row.applicationWindow),
    ibFit: fit(row.ibFit),
    mlFit: fit(row.mlFit),
    link: str(row.link),
    tracks: Array.isArray(row.tracks) ? row.tracks : [],
    stages: [],
    sources: [],
  })
}

function customEvent(id: string, row: Loose): EventEntry {
  const kind = ['case', 'ml', 'event'].includes(row.kind) ? row.kind : 'event'
  return {
    id,
    name: str(row.name) || '(no name)',
    kind,
    track: str(row.track),
    info: str(row.info),
    resources: [],
    link: str(row.link),
    dates: [],
  }
}
