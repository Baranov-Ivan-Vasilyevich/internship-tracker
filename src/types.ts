// Shapes of the data in src/data/*.json and in localStorage.

export const STATUSES = ['Not started', 'Preparing', 'Applied', 'Interview', 'Offer', 'Rejected'] as const
export type Status = (typeof STATUSES)[number]

export const FITS = ['High', 'Medium', 'Low'] as const
export type Fit = (typeof FITS)[number]

// Tracks an internship can belong to. Internships with no track show up as "Other".
export const INTERNSHIP_TRACKS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

export type Internship = {
  id: string
  company: string
  role: string
  whatYouDo: string
  qualify: string // text from the doc, e.g. "Autumn 2027 (3rd year)"
  qualifyNow: boolean
  hours: string
  applicationWindow: string
  ibFit: Fit
  mlFit: Fit
  link: string
  tracks: string[]
  status: Status
  notes: string
  dateApplied: string // "YYYY-MM-DD" or ""
}

export type Resource = { label: string; url: string | null }

export type LearningItem = {
  id: string
  track: string
  when: string // text from the doc, e.g. "Autumn 2027"
  start: string | null // "YYYY-MM"; null for recurring items like "Monthly"
  end: string | null // null = open-ended ("From Jul 2027")
  title: string
  resources: Resource[]
  proof: string | null
  project: string | null // id of an own CV project, e.g. "P7"
}

export type Track = { id: string; name: string }

export type Project = {
  id: string
  title: string
  when: string
  month: string // "YYYY-MM"
  tracks: string[]
  output: string
}

export type Certainty = 'official' | 'expected' | 'target' | 'approximate'

export type KeyDate = {
  id: string
  label: string
  type: 'application' | 'competition' | 'internship'
  start: string // "YYYY-MM-DD"
  end: string // "YYYY-MM-DD"; for deadlines, this is the deadline
  certainty: Certainty
  deadline: boolean
  note: string
}

// Everything that is saved in the browser (and in the JSON backup).
export type SavedData = {
  version: 1
  internships: Internship[]
  learningDone: string[] // ids of ticked learning items
  projectsDone: string[] // ids of finished CV projects
  events: EventEntry[]
}

// ---------- Case championships, competitions and other events ----------

export const EVENT_STATUSES = ['Interested', 'Registered', 'In progress', 'Finished', 'Skipped'] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

export const EVENT_KINDS = {
  case: 'Case championship',
  ml: 'ML / data competition',
  event: 'Event',
} as const
export type EventKind = keyof typeof EVENT_KINDS

// One entry in the round log: what happened in a round and what I personally did
export type Round = {
  id: string
  date: string // "YYYY-MM-DD" or ""
  round: string // e.g. "Qualifying round"
  whatIDid: string
  result: string
}

export type EventEntry = {
  id: string
  name: string
  kind: EventKind
  track: string // "E", "G", … or "" for none
  info: string
  link: string
  status: EventStatus
  notes: string
  rounds: Round[]
  custom?: boolean // true = added by me in the app (only these can be deleted)
}
