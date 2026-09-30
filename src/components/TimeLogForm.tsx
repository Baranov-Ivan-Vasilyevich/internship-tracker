import { useState } from 'react'
import { todayISO } from '../lib/dates'
import type { TimeEntry } from '../lib/timeLog'
import { buttonClass, inputClass } from './ui'

type Props = {
  onSave: (entry: TimeEntry) => void
  // Either let me pick what I studied from a list, or log time for one fixed item
  items?: { id: string; label: string }[]
  fixedItemId?: string
  onCancel?: () => void
}

export function TimeLogForm({ onSave, items = [], fixedItemId, onCancel }: Props) {
  const [itemId, setItemId] = useState(fixedItemId ?? items[0]?.id ?? '')
  const [hours, setHours] = useState('1')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const value = Number(hours.replace(',', '.')) // accept "1,5" as well as "1.5"
  const valid = value > 0 && value <= 24

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        onSave({ id: crypto.randomUUID(), date, itemId, hours: value, note: note.trim() })
        setHours('1')
        setNote('')
      }}
      className="flex flex-wrap items-end gap-2 text-sm"
    >
      {fixedItemId === undefined && (
        <label className="flex min-w-0 flex-1 basis-full flex-col gap-1 sm:basis-auto">
          What I studied
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={`${inputClass} w-full min-w-0`}>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
            <option value="">Other / general</option>
          </select>
        </label>
      )}
      <label className="flex w-20 flex-col gap-1">
        Hours
        <input
          inputMode="decimal"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          aria-invalid={!valid}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1">
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
      </label>
      <label className="flex min-w-32 flex-1 flex-col gap-1">
        Note
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" className={inputClass} />
      </label>
      <button type="submit" disabled={!valid} className={`${buttonClass} disabled:opacity-40`}>
        Log time
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="px-2 text-slate-500 underline">
          Cancel
        </button>
      )}
    </form>
  )
}
