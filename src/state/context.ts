import { createContext, useContext } from 'react'
import type { SavedData } from '../types'
import type { DiskStatus } from './diskSync'

export type Store = {
  data: SavedData
  setData: (update: (old: SavedData) => SavedData) => void
  warning: string | null // shown as an amber banner at the top of the app
  notice: string | null // shown as a green banner (e.g. "restored from disk")
  dismissNotice: () => void
  diskStatus: DiskStatus // for the "Saved to disk ✓" indicator
}

export const DataContext = createContext<Store | null>(null)

export function useData() {
  const store = useContext(DataContext)
  if (!store) throw new Error('useData must be used inside <DataProvider>')
  return store
}
