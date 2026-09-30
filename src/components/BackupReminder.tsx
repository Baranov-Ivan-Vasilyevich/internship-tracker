import { Link } from 'react-router-dom'
import { backupReminder, SNOOZE_DAYS } from '../lib/backupReminder'
import { formatDate, todayISO } from '../lib/dates'
import { useData } from '../state/context'
import { useSnoozeBackupReminder } from '../state/hooks'
import { buttonClass, secondaryButtonClass } from './ui'

// Banner on the iPhone (view copy) when it hasn't been refreshed from the Mac for a week (rules: lib/backupReminder.ts)
export function BackupReminder() {
  const { data, diskStatus } = useData()
  const snooze = useSnoozeBackupReminder()
  const days = backupReminder(data, todayISO(), diskStatus === 'saved')
  if (days === null) return null

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center gap-3 rounded-md bg-sky-100 px-3 py-2 text-sm text-sky-900 dark:bg-sky-900/40 dark:text-sky-100"
    >
      <span className="min-w-0 flex-1">
        {days === Infinity
          ? "This view copy hasn't been updated from the Mac yet."
          : `This view copy is ${days} days old (Mac backup from ${formatDate(data.lastBackupAt)}).`}{' '}
        Download a backup on the Mac and import it here.
      </span>
      <Link to="/backup" className={buttonClass}>
        Import backup
      </Link>
      <button onClick={() => snooze(SNOOZE_DAYS)} className={secondaryButtonClass}>
        Remind me in a week
      </button>
    </div>
  )
}
