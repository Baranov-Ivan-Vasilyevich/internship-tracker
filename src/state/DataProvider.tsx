import { useState, type ReactNode } from 'react'
import type { SavedData } from '../types'
import { DataContext } from './context'
import { loadSaved, saveData } from './storage'

export function DataProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadSaved)
  const [state, setState] = useState({ data: initial.data, saveFailed: false })

  // Every change is saved straight away. (Saving twice is harmless, so this is safe in React's strict mode.)
  const setData = (update: (old: SavedData) => SavedData) =>
    setState((prev) => {
      const data = update(prev.data)
      return { data, saveFailed: !saveData(data) }
    })

  const warning = state.saveFailed
    ? 'Saving failed (storage full or blocked). Download a backup from the Backup page now.'
    : initial.warning

  return <DataContext.Provider value={{ data: state.data, setData, warning }}>{children}</DataContext.Provider>
}
