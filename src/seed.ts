// The read-only plan data from src/data/*.json, with proper types.
// Edit the JSON files to change the plan; this file only wires them in.
import datesJson from './data/dates.json'
import learningJson from './data/learning.json'
import projectsJson from './data/projects.json'
import type { KeyDate, LearningItem, Project, Track } from './types'

export const TRACKS = learningJson.tracks as Track[]
export const LEARNING = learningJson.items as LearningItem[]
export const PROJECTS = projectsJson.projects as Project[]
export const PROJECT_RULES: string[] = projectsJson.rules
export const KEY_DATES = datesJson as KeyDate[]

export const projectById = (id: string) => PROJECTS.find((p) => p.id === id)

export const trackLabel = (id: string) => (id === 'foundation' ? 'Foundation' : `Track ${id}`)

// Is a learning item scheduled for this month? ("YYYY-MM" strings compare correctly as text)
export function isActive(item: LearningItem, month: string) {
  if (!item.start) return false
  return item.start <= month && (item.end === null || month <= item.end)
}
