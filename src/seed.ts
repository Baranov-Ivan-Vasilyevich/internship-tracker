// Loads the plan data from src/data/*.json and checks it with the schemas.
// Any problems end up in SEED_ERRORS, and the app shows them instead of the pages.
import type { z } from 'zod'
import windowsJson from './data/application-windows.json'
import eventsJson from './data/events.json'
import internshipsJson from './data/internships.json'
import learningJson from './data/learning.json'
import projectsJson from './data/projects.json'
import resourcesJson from './data/resources.json'
import {
  EventSchema,
  InternshipSchema,
  LearningFileSchema,
  ProjectsFileSchema,
  ResourceSchema,
  WindowSchema,
  explain,
} from './schemas'
import type { LearningItem } from './types'

export const SEED_ERRORS: string[] = []

// Check one file; on failure remember the errors and use the fallback so the app can still start
function check<S extends z.ZodType>(file: string, schema: S, data: unknown, fallback: z.infer<S>): z.infer<S> {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  SEED_ERRORS.push(...explain(file, result.error, data))
  return fallback
}

export const RESOURCES = check('resources.json', ResourceSchema.array(), resourcesJson, [])
export const INTERNSHIPS = check('internships.json', InternshipSchema.array(), internshipsJson, [])
const learning = check('learning.json', LearningFileSchema, learningJson, { tracks: [], items: [] })
export const TRACKS = learning.tracks
export const LEARNING = learning.items
const projects = check('projects.json', ProjectsFileSchema, projectsJson, { rules: [], projects: [] })
export const PROJECTS = projects.projects
export const PROJECT_RULES = projects.rules
export const WINDOWS = check('application-windows.json', WindowSchema.array(), windowsJson, [])
export const EVENTS = check('events.json', EventSchema.array(), eventsJson, [])

// ---------- cross-checks: every id that is referenced must exist ----------

function duplicates(file: string, ids: string[]) {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) SEED_ERRORS.push(`${file} → id "${id}" is used twice`)
    seen.add(id)
  }
}
duplicates(
  'resources.json',
  RESOURCES.map((r) => r.id),
)
duplicates(
  'internships.json',
  INTERNSHIPS.map((i) => i.id),
)
duplicates(
  'learning.json',
  LEARNING.map((i) => i.id),
)
duplicates(
  'events.json',
  EVENTS.map((e) => e.id),
)

const resourceIds = new Set(RESOURCES.map((r) => r.id))
const unknownResource = (file: string, where: string, ids: string[]) =>
  ids
    .filter((id) => !resourceIds.has(id))
    .forEach((id) => SEED_ERRORS.push(`${file} → ${where}: resource "${id}" is not in resources.json`))

TRACKS.forEach((t) => unknownResource('learning.json', `track ${t.id}`, t.resources))
LEARNING.forEach((i) => unknownResource('learning.json', `item ${i.id}`, i.resources))
EVENTS.forEach((e) => unknownResource('events.json', `event ${e.id}`, e.resources))

const trackIds = new Set(TRACKS.map((t) => t.id))
LEARNING.filter((i) => !trackIds.has(i.track)).forEach((i) =>
  SEED_ERRORS.push(`learning.json → item ${i.id}: track "${i.track}" does not exist`),
)
const projectIds = new Set(PROJECTS.map((p) => p.id))
LEARNING.filter((i) => i.project && !projectIds.has(i.project)).forEach((i) =>
  SEED_ERRORS.push(`learning.json → item ${i.id}: project "${i.project}" is not in projects.json`),
)
const internshipIds = new Set(INTERNSHIPS.map((i) => i.id))
WINDOWS.forEach((w) =>
  w.internshipIds
    .filter((id) => !internshipIds.has(id))
    .forEach((id) => SEED_ERRORS.push(`application-windows.json → ${w.id}: internship "${id}" does not exist`)),
)

// ---------- small lookups used by several pages ----------

const resourceMap = new Map(RESOURCES.map((r) => [r.id, r]))
export const resourceById = (id: string) => resourceMap.get(id)
export const projectById = (id: string) => PROJECTS.find((p) => p.id === id)
export const trackLabel = (id: string) => (id === 'foundation' ? 'Foundation' : `Track ${id}`)

// Is a learning item scheduled for this month? ("YYYY-MM" strings compare correctly as text)
export function isActive(item: LearningItem, month: string) {
  if (!item.start) return false
  return item.start <= month && (item.end === null || month <= item.end)
}

// Which tracks use a resource (directly on the track, or on one of its items)
export function tracksUsing(resourceId: string): string[] {
  const set = new Set<string>()
  TRACKS.forEach((t) => t.resources.includes(resourceId) && set.add(t.id))
  LEARNING.forEach((i) => i.resources.includes(resourceId) && set.add(i.track))
  return TRACKS.map((t) => t.id).filter((id) => set.has(id))
}

// Resources for a CV project = the resources of the learning items that lead to it
export function projectResources(projectId: string): string[] {
  return [...new Set(LEARNING.filter((i) => i.project === projectId).flatMap((i) => i.resources))]
}
