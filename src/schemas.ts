// Schemas describe the exact shape of every JSON file and of your saved data.
// zod checks the files when the app loads; if something is wrong you get a readable
// error message instead of a half-broken page. Types for the code come from here too.
import { z } from 'zod'

const month = z.string().regex(/^\d{4}-\d{2}$/, 'must look like 2027-03')
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must look like 2027-03-31')
const time = z.string().regex(/^\d{2}:\d{2}$/, 'must look like 15:00')
const verified = day.nullable() // null = "TODO: verify"

export const STATUSES = ['Not started', 'Preparing', 'Applied', 'Interview', 'Offer', 'Rejected'] as const
export const FITS = ['High', 'Medium', 'Low'] as const
export const CERTAINTIES = ['official', 'expected', 'target', 'approximate'] as const
export const EVENT_STATUSES = ['Interested', 'Registered', 'In progress', 'Finished', 'Skipped'] as const
export const EVENT_KINDS = { case: 'Case championship', ml: 'ML / data competition', event: 'Event' } as const
export const SOURCE_KINDS = ['official', 'vacancy', 'guide', 'registration'] as const
export const RESOURCE_TYPES = [
  'course',
  'book',
  'docs',
  'tool',
  'practice',
  'guide',
  'regulation',
  'competition',
  'event',
  'feed',
] as const

// ---------- plan data (src/data/*.json) ----------

export const ResourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.url().nullable(), // null for books without a link
  type: z.enum(RESOURCE_TYPES),
  lang: z.string().nullable(),
  cost: z.enum(['free', 'paid']).nullable(),
  verified,
})

export const SourceSchema = z.object({
  kind: z.enum(SOURCE_KINDS),
  url: z.url(),
  verified,
})

export const InternshipSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  whatYouDo: z.string(),
  qualify: z.string(), // wording from the doc
  eligibleFrom: month.nullable(), // null = not known
  eligibilityNote: z.string().optional(),
  hours: z.string(),
  applicationWindow: z.string(),
  ibFit: z.enum(FITS),
  mlFit: z.enum(FITS),
  link: z.string(), // main link ("" allowed for ones you add)
  tracks: z.array(z.string()),
  stages: z.array(z.string()),
  stagesNote: z.string().optional(),
  sources: z.array(SourceSchema),
  // A next action suggested by the plan. Shown until you set your own or mark it done.
  plannedAction: z.object({ text: z.string(), due: day }).optional(),
})

export const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  resources: z.array(z.string()),
  // From the doc: what the programs in this track test (Tracks A–D)
  whatTheyTest: z.object({ title: z.string(), items: z.array(z.string()) }).optional(),
})

// One row of the doc's "Test and interview prep" table
export const TestPrepSchema = z.object({
  id: z.string(),
  stage: z.string(),
  whoUsesIt: z.string(), // wording from the doc
  howToPrepare: z.string(),
  note: z.string(),
  internshipIds: z.array(z.string()), // used to show the stage in the tracks of these programs
  resources: z.array(z.string()),
})

export const LearningItemSchema = z.object({
  id: z.string(),
  track: z.string(),
  when: z.string(),
  start: month.nullable(), // null for recurring items like "Monthly"
  end: month.nullable(), // null = open-ended ("From Jul 2027")
  title: z.string(),
  resources: z.array(z.string()), // resource ids
  proof: z.string().nullable(),
  project: z.string().nullable(), // CV project id, e.g. "P7"
})

export const LearningFileSchema = z.object({ tracks: z.array(TrackSchema), items: z.array(LearningItemSchema) })

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  when: z.string(),
  month,
  tracks: z.array(z.string()),
  output: z.string(),
})

export const ProjectsFileSchema = z.object({ rules: z.array(z.string()), projects: z.array(ProjectSchema) })

// A date with a badge. For deadlines, `end` is the deadline.
export const DatedSchema = z.object({
  id: z.string(),
  label: z.string(),
  start: day,
  end: day,
  startTime: time.optional(), // Moscow time
  endTime: time.optional(),
  certainty: z.enum(CERTAINTIES),
  deadline: z.boolean(),
  note: z.string(),
})

export const WindowSchema = DatedSchema.extend({
  type: z.enum(['application', 'internship']),
  internshipIds: z.array(z.string()),
})

export const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(Object.keys(EVENT_KINDS) as [keyof typeof EVENT_KINDS]),
  track: z.string(), // "" = none
  info: z.string(),
  resources: z.array(z.string()),
  link: z.string().optional(), // only for events you add yourself
  dates: z.array(DatedSchema),
})

// ---------- your saved data (localStorage and backups) ----------

const LogEntrySchema = z.object({ id: z.string(), date: z.string(), text: z.string() })

export const InternshipStateSchema = z.object({
  status: z.enum(STATUSES).default('Not started'),
  notes: z.string().default(''),
  dateApplied: z.string().default(''),
  contacts: z.string().default(''),
  stagesDone: z.array(z.string()).default([]),
  log: z.array(LogEntrySchema).default([]),
  nextAction: z.object({ text: z.string(), due: z.string() }).default({ text: '', due: '' }),
  plannedActionDone: z.boolean().default(false),
  // Links you checked yourself with "Mark verified": url → date
  verifiedSources: z.record(z.string(), z.string()).default({}),
})

export const RoundSchema = z.object({
  id: z.string(),
  date: z.string(),
  round: z.string(),
  whatIDid: z.string(),
  result: z.string(),
})

export const EventStateSchema = z.object({
  status: z.enum(EVENT_STATUSES).default('Interested'),
  notes: z.string().default(''),
  rounds: z.array(RoundSchema).default([]),
})

// One entry in the learning time log. itemId = learning item id, or "" for general study time.
export const TimeEntrySchema = z.object({
  id: z.string(),
  date: day,
  itemId: z.string(),
  hours: z.number().positive().max(24),
  note: z.string(),
})

export const PROJECT_STATUSES = ['Not started', 'In progress', 'Done'] as const

// Your progress on one CV project
export const ProjectStateSchema = z.object({
  status: z.enum(PROJECT_STATUSES).default('Not started'),
  url: z.string().default(''), // GitHub / Kaggle link
  // The 4-part project note
  question: z.string().default(''),
  whatIDid: z.string().default(''),
  result: z.string().default(''),
  nextStep: z.string().default(''),
  selfWritten: z.boolean().default(false), // "I wrote this myself; AI only explained"
})

export const SCHEMA_VERSION = 2

export const SavedDataSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  internships: z.record(z.string(), InternshipStateSchema).default({}), // keyed by internship id
  customInternships: z.array(InternshipSchema).default([]), // ones you added in the app
  learningDone: z.array(z.string()).default([]),
  projectsDone: z.array(z.string()).default([]), // old "done" ticks; moved into `projects` when loading
  projects: z.record(z.string(), ProjectStateSchema).default({}), // keyed by project id
  events: z.record(z.string(), EventStateSchema).default({}), // keyed by event id
  customEvents: z.array(EventSchema).default([]),
  timeLog: z.array(TimeEntrySchema).default([]),
  weeklyTargetHours: z.number().positive().max(80).default(6), // the plan: about 6 h a week
  lastBackupAt: z.string().default(''), // date of your last Download backup
  backupSnoozedUntil: z.string().default(''), // set by Remind me in a week
})

// Turn zod's error into short lines like
// "learning.json → items.0 (FND1).start: must look like 2027-03" — the id helps you find the row.
export function explain(file: string, error: z.ZodError, data?: unknown) {
  return error.issues.map((issue) => {
    let node: unknown = data
    const parts = issue.path.map((key) => {
      node = node && typeof node === 'object' ? (node as Record<PropertyKey, unknown>)[key as PropertyKey] : undefined
      const id = node && typeof node === 'object' && 'id' in node ? (node as { id: unknown }).id : undefined
      return typeof key === 'number' && typeof id === 'string' ? `${key} (${id})` : String(key)
    })
    return `${file} → ${parts.join('.') || '(top level)'}: ${issue.message}`
  })
}
