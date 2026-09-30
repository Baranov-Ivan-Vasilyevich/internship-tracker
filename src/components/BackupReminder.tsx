import { backupReminder, SNOOZE_DAYS } from '../lib/backupReminder'
import { formatDate, todayISO } from '../lib/dates'
import { useData } from '../state/context'
import { useDownloadBackup, useSnoozeBackupReminder } from '../state/hooks'
import { buttonClass, secondaryButtonClass } from './ui'

// Banner at the top of every page when a backup is due (see lib/backupReminder.ts for the rules)
export function BackupReminder() {
  const { data, diskStatus } = useData()
  const downloadBackup = useDownloadBackup()
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
          ? "You haven't downloaded a backup yet."
          : `Your last backup was ${days} days ago (${formatDate(data.lastBackupAt)}).`}{' '}
        Your data lives only in this browser, so keep a copy.
      </span>
      <button onClick={downloadBackup} className={buttonClass}>
        Download backup
      </button>
      <button onClick={() => snooze(SNOOZE_DAYS)} className={secondaryButtonClass}>
        Remind me in a week
      </button>
    </div>
  )
}
