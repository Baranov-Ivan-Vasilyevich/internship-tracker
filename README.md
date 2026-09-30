# Internship Tracker

Personal tracker for internships, learning tracks, CV projects and events (2026–27).
React + Vite + TypeScript + Tailwind. No backend: your data is saved in your browser (localStorage).

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

Or double-click **Start Tracker.command** in Finder: it starts the app and opens the browser.
Keep its Terminal window open while you use the tracker; close it to stop.

| Command               | What it does                                                      |
| --------------------- | ----------------------------------------------------------------- |
| `npm run dev`         | Start the app with live reload                                    |
| `npm test`            | Run the tests (dates, eligibility, calendar export, data upgrade) |
| `npm run lint`        | Check the code for mistakes                                       |
| `npm run format`      | Tidy the formatting of all files                                  |
| `npm run check-links` | Open every link in `src/data` and write `reports/link-report.md`  |
| `npm run build`       | Build the site into `dist/`                                       |

## How your data is kept safe

- **Plan data** (internships, courses, dates…) lives in `src/data/*.json` and is read fresh on every load.
- **Your data** (statuses, notes, ticks, logs, things you added) is saved separately in the browser, by id.
  Editing the JSON files never overwrites it.
- If you rename an `id` in a JSON file, your saved data for the old id is no longer shown (but not deleted).
- If a JSON file has a mistake, the app shows a list of errors (file, row id, what's wrong) instead of the pages.
- Backups: **Backup → Download backup**. Do this regularly and to move data between devices.

## Automatic save to disk (npm run dev only)

While `npm run dev` is running, the app also saves your data to `data/user-data.json`
(about a second after each change) and keeps the last 7 daily copies in `data/backups/`.
The footer shows **Saved to disk ✓** when this works.

- If the browser's storage is empty (for example Safari cleared site data) but the file exists,
  the app restores your data from the file and tells you so.
- If the file is damaged, the app does not overwrite it and pauses saving. Restore a daily copy
  from `data/backups/` (rename it to `user-data.json`), or import a backup.
- `data/` is in `.gitignore`: it is never committed or published.
- The GitHub Pages version has no dev server, so it always shows **Not saved to disk**.

## Editing the plan (src/data)

Every file is checked when the app loads. Dates are `"YYYY-MM-DD"`, months are `"YYYY-MM"`.
Badges (`certainty`) are one of `official`, `expected`, `target`, `approximate`.
`verified` is the date you last checked a link, or `null` for "TODO: verify".

### Test prep (`test-prep.json`) and "What they test" (`learning.json`)

Each row in `test-prep.json` is one stage from the doc's prep table. Its `internshipIds` decide which
tracks show it (a stage appears in every track that contains one of those internships). A track's
`whatTheyTest` in `learning.json` is the doc's list for that track.

### Add a resource (`resources.json`)

```json
{
  "id": "my-course",
  "title": "Course title",
  "url": "https://example.com",
  "type": "course",
  "lang": "RU",
  "cost": "free",
  "verified": null
}
```

`type` is one of: course, book, docs, tool, practice, guide, regulation, competition, event, feed.
Then use it anywhere by id, e.g. `"resources": ["my-course"]` on a learning item or track in `learning.json`.

### Add an internship (`internships.json`)

Copy an existing row and change it. The important fields:

```json
{
  "id": "new-bank",
  "company": "New Bank",
  "role": "Summer internship",
  "whatYouDo": "Credit analysis",
  "qualify": "3rd year and above",
  "eligibleFrom": "2027-09",
  "hours": "20–40",
  "applicationWindow": "Mar–Apr 2027",
  "ibFit": "High",
  "mlFit": "Low",
  "link": "https://…",
  "tracks": ["A"],
  "stages": ["Application", "Online tests", "Interview"],
  "sources": [{ "kind": "official", "url": "https://…", "verified": null }]
}
```

`eligibleFrom` drives "Eligible now". Application dates go in `application-windows.json`
(with `"internshipIds": ["new-bank"]`) so they appear on the Dashboard, Timeline and calendar.
You can also add internships in the app (**+ Add internship**).

### Add an event (`events.json`)

```json
{
  "id": "career-fair",
  "name": "Career fair",
  "kind": "event",
  "track": "",
  "info": "Moscow",
  "resources": [],
  "dates": [
    {
      "id": "career-fair-2026",
      "label": "Career fair, Moscow",
      "start": "2026-11-10",
      "end": "2026-11-10",
      "startTime": "12:00",
      "endTime": "18:00",
      "certainty": "official",
      "deadline": false,
      "note": ""
    }
  ]
}
```

`kind` is `case`, `ml` or `event`. Times are Moscow time and optional. Set `"deadline": true` for
registration deadlines so they appear in "Next deadlines" with a 7-day reminder in the calendar file.
You can also add events in the app (**+ Add event**).

## Online version (GitHub Pages)

Live at **https://baranov-ivan-vasilyevich.github.io/internship-tracker/** (use it on the iPhone).
The site shows the plan from `src/data`; your own data (statuses, notes, hours) is never uploaded.

### Publish a change

After editing code or the JSON files and checking them with `npm run dev`:

```bash
git add -A
git commit -m "Describe the change"
git push
```

`git push` starts `.github/workflows/deploy.yml`: lint → tests → build → publish. If lint or a test
fails, nothing is published. Follow it with `gh run watch` (or the repo's **Actions** tab); the site
updates about a minute after it turns green. On the iPhone, close and reopen the tracker to load it.

One-time setup (already done): repo **Settings → Pages → Source: GitHub Actions**.

### Keep the Mac and the iPhone in sync

**Mac (localhost) is the main device. The iPhone is for viewing. Move a backup Mac → iPhone weekly.**
The online version shows a note: “This is a view copy. Edit on the Mac.”

Each device (and each browser) keeps its **own** copy of your data. Nothing syncs by itself.
To update the iPhone (at least weekly):

1. On the Mac: **Backup → Download backup** (a `.json` file).
2. Send it to the iPhone (AirDrop, iCloud Drive, Telegram "Saved Messages"…).
3. On the iPhone: **More → Backup → Import backup…** and choose the file. This replaces the data there.

Tips:

- Import **replaces** everything on the iPhone, so changes made there are lost at the next import. Make changes on the Mac.
- The Mac also saves to `data/user-data.json` while `npm run dev` runs. The iPhone shows a reminder
  when its copy is more than a week old.
- Safari on iPhone may delete site data for sites you haven't opened for a few weeks. Open the
  tracker regularly and keep recent backups.
