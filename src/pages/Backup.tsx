import { useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { Card, buttonClass, secondaryButtonClass } from '../components/ui'
import { todayISO } from '../lib/dates'
import { collectDates } from '../lib/deadlines'
import { download } from '../lib/files'
import { buildIcs } from '../lib/ics'
import { useData } from '../state/context'
import { useDownloadBackup, useEvents } from '../state/hooks'
import { emptyData, migrate } from '../state/migrate'
import { seedIds } from '../state/storage'

const DEVICE_RULE = 'Mac (localhost) is the main device. The iPhone is for viewing. Move a backup Mac → iPhone weekly.'

export default function Backup() {
  const { setData } = useData()
  const { rows: events } = useEvents()
  const [message, setMessage] = useState('')

  const downloadBackup = useDownloadBackup()
  const exportJson = () => {
    downloadBackup()
    setMessage('Backup downloaded.')
  }

  const importJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // lets you pick the same file again later
    if (!file) return
    try {
      // Old backups (from before the upgrade) are converted to the current format
      const imported = migrate(JSON.parse(await file.text()), seedIds())
      if (!confirm('Replace ALL current data with this backup?')) return
      setData(() => imported)
      setMessage(`Imported ${file.name}.`)
    } catch (err) {
      setMessage(`Could not import ${file.name}: ${(err as Error).message}`)
    }
  }

  const reset = () => {
    if (!confirm('Delete all your statuses, notes and ticks, and start again from the seed data?')) return
    setData(() => emptyData())
    setMessage('Reset to the seed data.')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Backup & export</h1>

      <Card tone="note" className="text-sm">
        <b>{DEVICE_RULE}</b>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          On the Mac: Download backup. On the iPhone: Import backup and choose that file.
        </p>
      </Card>

      {message && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {message}
        </p>
      )}

      <Card className="space-y-3">
        <h2 className="font-medium">JSON backup</h2>
        <p className="text-sm text-slate-500">
          Your data lives only in this browser. Download a backup regularly, and use it to move your data to another
          device (for example, laptop → phone).
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportJson} className={buttonClass}>
            Download backup (.json)
          </button>
          <label className={`${secondaryButtonClass} cursor-pointer`}>
            Import backup…
            <input type="file" accept="application/json,.json" onChange={importJson} className="hidden" />
          </label>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-medium">Printable plan</h2>
        <p className="text-sm text-slate-500">
          One clean page with upcoming dates, internships, learning checklists and CV projects. Print it or save it as a
          PDF (in the print dialog, choose “Save as PDF”).
        </p>
        <Link to="/print" className={`${buttonClass} inline-block`}>
          Open printable plan
        </Link>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-medium">Calendar</h2>
        <p className="text-sm text-slate-500">
          Upcoming deadlines and event dates as one .ics file, with a reminder 7 days before each deadline. Open it with
          Apple Calendar or import it into Google Calendar. Expected and approximate dates are marked as tentative.
        </p>
        <button
          onClick={() =>
            download(
              'internship-deadlines.ics',
              buildIcs(collectDates(events), { skipBefore: todayISO() }),
              'text/calendar',
            )
          }
          className={buttonClass}
        >
          Export deadlines (.ics)
        </button>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-medium">Start over</h2>
        <p className="text-sm text-slate-500">Download a backup first, because this can't be undone.</p>
        <button onClick={reset} className={`${secondaryButtonClass} text-rose-600`}>
          Reset to seed data
        </button>
      </Card>
    </div>
  )
}
