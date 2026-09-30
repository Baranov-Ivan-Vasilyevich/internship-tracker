// TypeScript types, generated from the schemas in schemas.ts so the two never disagree.
import type { z } from 'zod'
import type {
  DatedSchema,
  EventSchema,
  EventStateSchema,
  InternshipSchema,
  InternshipStateSchema,
  LearningItemSchema,
  ProjectSchema,
  ProjectStateSchema,
  ResourceSchema,
  RoundSchema,
  SavedDataSchema,
  SourceSchema,
  TestPrepSchema,
  TrackSchema,
  WindowSchema,
} from './schemas'

export {
  CERTAINTIES,
  EVENT_KINDS,
  EVENT_STATUSES,
  FITS,
  PROJECT_STATUSES,
  RESOURCE_TYPES,
  SOURCE_KINDS,
  STATUSES,
} from './schemas'

export type Resource = z.infer<typeof ResourceSchema>
export type Source = z.infer<typeof SourceSchema>
export type TestPrep = z.infer<typeof TestPrepSchema>
export type Internship = z.infer<typeof InternshipSchema>
export type Track = z.infer<typeof TrackSchema>
export type LearningItem = z.infer<typeof LearningItemSchema>
export type Project = z.infer<typeof ProjectSchema>
export type ProjectState = z.infer<typeof ProjectStateSchema>
export type Dated = z.infer<typeof DatedSchema>
export type Window = z.infer<typeof WindowSchema>
export type EventEntry = z.infer<typeof EventSchema>
export type InternshipState = z.infer<typeof InternshipStateSchema>
export type EventState = z.infer<typeof EventStateSchema>
export type Round = z.infer<typeof RoundSchema>
export type SavedData = z.infer<typeof SavedDataSchema>

export type Status = InternshipState['status']
export type EventStatus = EventState['status']
export type EventKind = EventEntry['kind']
export type Fit = Internship['ibFit']
export type Certainty = Dated['certainty']

// Tracks an internship or event can belong to. Items with no track show up as "Other".
export const INTERNSHIP_TRACKS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const
