// Side panel (full screen on a phone) with everything about one internship.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SourcesBlock } from '../components/SourcesBlock'
import {
  CertaintyBadge,
  ExternalLink,
  TrackTags,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from '../components/ui'
import { currentMonth, formatDate, todayISO } from '../lib/dates'
import { eligibilityText } from '../lib/eligibility'
import { hostOf } from '../lib/url'
import { WINDOWS } from '../seed'
import { useInternships, type InternshipRow } from '../state/hooks'
import { StatusSelect } from '../components/StatusSelect'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

export default function InternshipDetail({ row, onClose }: { row: InternshipRow; onClose: () => void }) {
  const { update, remove } = useInternships()
  const s = row.state
  const set = (changes: Partial<typeof s>) => update(row.id, changes)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [logText, setLogText] = useState('')
  const windows = WINDOWS.filter((w) => w.internshipIds.includes(row.id))

  // Always call the latest onClose, without re-running the effect below on every render
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  // When the panel opens: move keyboard focus into it, and let Esc close it
  useEffect(() => {
    headingRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [row.id])

  const toggleStage = (stage: string) =>
    set({
      stagesDone: s.stagesDone.includes(stage) ? s.stagesDone.filter((x) => x !== stage) : [...s.stagesDone, stage],
    })

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-xl space-y-4 overflow-y-auto bg-white p-5 shadow-xl dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="detail-title" ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">
              {row.company}
              {row.role && `: ${row.role}`}
            </h2>
            <p className="text-sm text-slate-500">{row.whatYouDo}</p>
          </div>
          <button onClick={onClose} className={secondaryButtonClass} aria-label="Close">
            ✕
          </button>
        </div>

        <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-slate-500">Eligibility</dt>
          <dd>
            {eligibilityText(row.eligibleFrom, currentMonth())}
            {row.eligibilityNote && <span className="text-slate-500"> · {row.eligibilityNote}</span>}
          </dd>
          <dt className="text-slate-500">Doc says</dt>
          <dd>{row.qualify || '—'}</dd>
          <dt className="text-slate-500">Hours</dt>
          <dd>{row.hours || '—'}</dd>
          <dt className="text-slate-500">Applications</dt>
          <dd>{row.applicationWindow || '—'}</dd>
          <dt className="text-slate-500">Fit</dt>
          <dd>
            IB {row.ibFit} · ML {row.mlFit}
          </dd>
          <dt className="text-slate-500">Tracks</dt>
          <dd>
            <TrackTags tracks={row.tracks} />
          </dd>
          {row.link && (
            <>
              <dt className="text-slate-500">Main link</dt>
              <dd className="break-all">
                <ExternalLink href={row.link}>{hostOf(row.link)}</ExternalLink>
              </dd>
            </>
          )}
        </dl>

        {windows.length > 0 && (
          <ul className="space-y-1 text-sm">
            {windows.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center gap-2">
                {w.label}: {formatDate(w.start)} – {formatDate(w.end)} <CertaintyBadge value={w.certainty} />
              </li>
            ))}
          </ul>
        )}

        <Section title="My status">
          <div className="flex flex-wrap items-center gap-3">
            <StatusSelect label="Status" value={s.status} onChange={(status) => set({ status })} />
            <label className="flex items-center gap-2 text-sm text-slate-500">
              Applied on
              <input
                type="date"
                value={s.dateApplied}
                onChange={(e) => set({ dateApplied: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>
        </Section>

        <Section title="Next action">
          <div className="flex flex-wrap gap-2">
            <input
              aria-label="Next action"
              placeholder="e.g. Finish the cover letter"
              value={s.nextAction.text}
              onChange={(e) => set({ nextAction: { ...s.nextAction, text: e.target.value } })}
              className={`${inputClass} flex-1`}
            />
            <input
              type="date"
              aria-label="Next action due date"
              value={s.nextAction.due}
              onChange={(e) => set({ nextAction: { ...s.nextAction, due: e.target.value } })}
              className={inputClass}
            />
          </div>
        </Section>

        <Section title="Selection stages">
          {row.stagesNote && <p className="text-sm text-amber-700 dark:text-amber-400">{row.stagesNote}</p>}
          {row.stages.length === 0 && !row.stagesNote && <p className="text-sm text-slate-500">No stages listed.</p>}
          <ol className="space-y-1">
            {row.stages.map((stage, n) => (
              <li key={stage}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={s.stagesDone.includes(stage)}
                    onChange={() => toggleStage(stage)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <span className="text-slate-400">{n + 1}.</span> {stage}
                </label>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Contacts">
          <textarea
            aria-label="Contacts"
            rows={2}
            placeholder="Recruiter name, email, Telegram…"
            value={s.contacts}
            onChange={(e) => set({ contacts: e.target.value })}
            className={`${inputClass} w-full`}
          />
        </Section>

        <Section title="Notes">
          <textarea
            aria-label="Notes"
            rows={4}
            value={s.notes}
            onChange={(e) => set({ notes: e.target.value })}
            className={`${inputClass} w-full`}
          />
        </Section>

        <Section title="Application log">
          <p className="text-xs text-slate-500">Status changes are added here automatically.</p>
          {s.log.length > 0 && (
            <ul className="space-y-1 text-sm">
              {[...s.log].reverse().map((entry) => (
                <li key={entry.id} className="flex gap-2">
                  <span className="w-24 shrink-0 text-slate-500">{formatDate(entry.date)}</span>
                  <span className="flex-1">{entry.text}</span>
                  <button
                    onClick={() => set({ log: s.log.filter((x) => x.id !== entry.id) })}
                    className="text-xs text-slate-400 hover:text-rose-600"
                    aria-label={`Delete log entry: ${entry.text}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!logText.trim()) return
              set({ log: [...s.log, { id: crypto.randomUUID(), date: todayISO(), text: logText.trim() }] })
              setLogText('')
            }}
            className="flex gap-2"
          >
            <input
              aria-label="New log entry"
              placeholder="e.g. Sent CV to recruiter"
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              className={`${inputClass} flex-1`}
            />
            <button type="submit" className={buttonClass}>
              Add
            </button>
          </form>
        </Section>

        <Section title="Sources">
          <SourcesBlock sources={row.sources} />
        </Section>

        {row.custom && (
          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              onClick={() => {
                if (confirm(`Delete “${row.company}” and all your notes for it?`)) {
                  remove(row.id)
                  onClose()
                }
              }}
              className={`${secondaryButtonClass} text-rose-600`}
            >
              Delete this internship
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
