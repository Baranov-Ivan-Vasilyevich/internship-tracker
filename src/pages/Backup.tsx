import { useState, type ChangeEvent } from 'react'
import { Card, buttonClass, secondaryButtonClass } from '../components/ui'
import { todayISO } from '../lib/dates'
import { collectDates } from '../lib/deadlines'
import { download } from '../lib/files'
import { buildIcs } from '../lib/ics'
import { useData } from '../state/context'
import { useEvents } from '../state/hooks'
import { emptyData, migrate } from '../state/migrate'
import { seedIds } from '../state/storage'

export default function Backup() {
  const { data, setData } = useData()
  const { rows: events } = useEvents()
  const [message, setMessage] = useState('')

  const exportJson = () => {
    download(`internship-tracker-backup-${todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json')
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
