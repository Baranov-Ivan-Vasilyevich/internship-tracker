import { useData } from '../state/context'

const TEXT = {
  saved: {
    label: 'Saved to disk ✓',
    tip: 'Also saved to data/user-data.json on your Mac',
    cls: 'text-emerald-700 dark:text-emerald-400',
  },
  waiting: { label: 'Checking disk…', tip: 'Connecting to the dev server', cls: 'text-slate-500' },
  error: {
    label: 'Not saved to disk',
    tip: 'The dev server could not save the file. Your data is still in this browser.',
    cls: 'text-rose-600',
  },
  off: {
    label: 'Not saved to disk',
    tip: 'This version has no dev server. Use Backup → Download backup to keep a copy.',
    cls: 'text-slate-500',
  },
} as const

// Small status line: is my data also being saved to a file on my Mac?
export function DiskIndicator() {
  const { diskStatus } = useData()
  const t = TEXT[diskStatus]
  return (
    <span className={`text-xs ${t.cls}`} title={t.tip} role="status">
      {t.label}
    </span>
  )
}
