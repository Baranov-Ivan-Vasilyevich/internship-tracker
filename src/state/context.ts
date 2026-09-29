import { createContext, useContext } from 'react'
import type { SavedData } from '../types'

export type Store = {
  data: SavedData
  setData: (update: (old: SavedData) => SavedData) => void
  warning: string | null // shown as a banner at the top of the app
}

export const DataContext = createContext<Store | null>(null)

export function useData() {
  const store = useContext(DataContext)
  if (!store) throw new Error('useData must be used inside <DataProvider>')
  return store
}
