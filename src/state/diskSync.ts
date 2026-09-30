// Talking to the dev-server plugin (vite-plugins/diskSave.ts) that saves your data to
// ~/internship-tracker/data/user-data.json. Only works with `npm run dev`.
import type { SavedData } from '../types'
import { migrate } from './migrate'

const ENDPOINT = '/__disk/user-data'

// true while running `npm run dev`; false on the GitHub Pages site
export const diskAvailable = import.meta.env.DEV

export type DiskStatus = 'off' | 'waiting' | 'saved' | 'error'

type Seed = Parameters<typeof migrate>[1]
export type StartupChoice = { restore: SavedData } | { error: string } | null

// Decide what to do at startup. Pure function, so it's tested (diskSync.test.ts).
// - The browser already has data → keep it (null): the browser copy is the newest.
// - The browser is empty and the file exists → restore from the file.
// - The file can't be read → report an error and leave everything as it is.
export function chooseStartupData(browserHadData: boolean, fileText: string | null, seed: Seed): StartupChoice {
  if (browserHadData || fileText === null) return null
  try {
    return { restore: migrate(JSON.parse(fileText), seed) }
  } catch (err) {
    return { error: `data/user-data.json could not be read (${(err as Error).message}).` }
  }
}

// null = no file yet; throws if the server can't be reached
export async function readDiskFile(): Promise<string | null> {
  const res = await fetch(ENDPOINT)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

export async function writeDiskFile(data: SavedData, keepalive = false): Promise<boolean> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
      keepalive, // lets the last save finish even while the tab is closing
    })
    return res.ok
  } catch {
    return false
  }
}
