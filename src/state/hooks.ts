// Everything pages need to read and change your data.
import { todayISO } from '../lib/dates'
import { EventStateSchema, InternshipStateSchema } from '../schemas'
import { EVENTS, INTERNSHIPS } from '../seed'
import type { EventEntry, EventState, Internship, InternshipState, Round } from '../types'
import { useData } from './context'

const defaultInternshipState = (): InternshipState => InternshipStateSchema.parse({})
const defaultEventState = (): EventState => EventStateSchema.parse({})

// An internship from the plan (or one you added), together with your data for it
export type InternshipRow = Internship & { custom: boolean; state: InternshipState }
export type EventRow = EventEntry & { custom: boolean; state: EventState }

export function useInternships() {
  const { data, setData } = useData()
  const rows: InternshipRow[] = [
    ...INTERNSHIPS.map((i) => ({ ...i, custom: false })),
    ...data.customInternships.map((i) => ({ ...i, custom: true })),
  ].map((i) => ({ ...i, state: data.internships[i.id] ?? defaultInternshipState() }))

  const update = (id: string, changes: Partial<InternshipState>) =>
    setData((d) => {
      const old = d.internships[id] ?? defaultInternshipState()
      const next = { ...old, ...changes }
      // Every status change is written to the application log automatically
      if (changes.status && changes.status !== old.status) {
        next.log = [...old.log, { id: crypto.randomUUID(), date: todayISO(), text: `Status: ${changes.status}` }]
      }
      return { ...d, internships: { ...d.internships, [id]: next } }
    })

  const add = (i: Internship) => setData((d) => ({ ...d, customInternships: [...d.customInternships, i] }))

  // Only internships you added can be deleted; plan rows come from the JSON file
  const remove = (id: string) =>
    setData((d) => {
      const internships = { ...d.internships }
      delete internships[id]
      return { ...d, internships, customInternships: d.customInternships.filter((i) => i.id !== id) }
    })

  return { rows, update, add, remove }
}

export function useEvents() {
  const { data, setData } = useData()
  const rows: EventRow[] = [
    ...EVENTS.map((e) => ({ ...e, custom: false })),
    ...data.customEvents.map((e) => ({ ...e, custom: true })),
  ].map((e) => ({ ...e, state: data.events[e.id] ?? defaultEventState() }))

  const changeState = (id: string, fn: (s: EventState) => EventState) =>
    setData((d) => ({ ...d, events: { ...d.events, [id]: fn(d.events[id] ?? defaultEventState()) } }))

  return {
    rows,
    update: (id: string, changes: Partial<EventState>) => changeState(id, (s) => ({ ...s, ...changes })),
    addRound: (id: string, round: Round) => changeState(id, (s) => ({ ...s, rounds: [...s.rounds, round] })),
    removeRound: (id: string, roundId: string) =>
      changeState(id, (s) => ({ ...s, rounds: s.rounds.filter((r) => r.id !== roundId) })),
    add: (e: EventEntry) => setData((d) => ({ ...d, customEvents: [...d.customEvents, e] })),
    remove: (id: string) =>
      setData((d) => {
        const events = { ...d.events }
        delete events[id]
        return { ...d, events, customEvents: d.customEvents.filter((e) => e.id !== id) }
      }),
  }
}

// Tick / untick a learning item or a CV project
export function useToggle() {
  const { setData } = useData()
  return (list: 'learningDone' | 'projectsDone', id: string) =>
    setData((d) => ({
      ...d,
      [list]: d[list].includes(id) ? d[list].filter((x) => x !== id) : [...d[list], id],
    }))
}
