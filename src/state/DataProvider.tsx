import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { SavedData } from '../types'
import { DataContext } from './context'
import { chooseStartupData, diskAvailable, readDiskFile, writeDiskFile, type DiskStatus } from './diskSync'
import { loadSaved, saveData, seedIds } from './storage'

const DISK_DELAY_MS = 800 // wait until you stop typing before writing the file

export function DataProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadSaved)
  const [state, setState] = useState({ data: initial.data, saveFailed: false })
  const [notice, setNotice] = useState<string | null>(null)
  const [diskError, setDiskError] = useState<string | null>(null)
  // Saving to disk starts only after the startup check, so an empty browser can never
  // overwrite a good file before it has been restored.
  const [diskReady, setDiskReady] = useState(false)
  const [diskStatus, setDiskStatus] = useState<DiskStatus>(diskAvailable ? 'waiting' : 'off')

  // Every change is saved to the browser straight away. (Saving twice is harmless, so this is safe in strict mode.)
  const setData = (update: (old: SavedData) => SavedData) =>
    setState((prev) => {
      const data = update(prev.data)
      return { data, saveFailed: !saveData(data) }
    })

  // Startup (npm run dev only): restore from data/user-data.json if the browser has nothing
  useEffect(() => {
    if (!diskAvailable) return
    let cancelled = false
    readDiskFile()
      .then((text) => {
        if (cancelled) return
        const choice = chooseStartupData(initial.fromBrowser, text, seedIds())
        if (choice && 'restore' in choice) {
          setState({ data: choice.restore, saveFailed: !saveData(choice.restore) })
          setNotice('Browser storage was empty, so your data was restored from data/user-data.json.')
        }
        if (choice && 'error' in choice) {
          setDiskError(`${choice.error} Saving to disk is paused so the file isn't overwritten.`)
          setDiskStatus('error')
          return
        }
        setDiskReady(true)
      })
      .catch(() => !cancelled && setDiskStatus('error')) // server unreachable: never overwrite anything
    return () => {
      cancelled = true
    }
  }, [initial.fromBrowser])

  // After each change, wait a moment, then write the file
  const latest = useRef(state.data)
  useEffect(() => {
    latest.current = state.data
    if (!diskReady) return
    const timer = setTimeout(async () => {
      setDiskStatus((await writeDiskFile(state.data)) ? 'saved' : 'error')
    }, DISK_DELAY_MS)
    return () => clearTimeout(timer)
  }, [state.data, diskReady])

  // Closing the tab: send the last change right away
  useEffect(() => {
    if (!diskReady) return
    const flush = () => void writeDiskFile(latest.current, true)
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [diskReady])

  const warning = state.saveFailed
    ? 'Saving failed (storage full or blocked). Download a backup from the Backup page now.'
    : (diskError ?? initial.warning)

  return (
    <DataContext.Provider
      value={{ data: state.data, setData, warning, notice, dismissNotice: () => setNotice(null), diskStatus }}
    >
      {children}
    </DataContext.Provider>
  )
}
