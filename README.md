# Internship Tracker

Personal tracker for internships, learning tracks and CV projects (2026–27).
React + Vite + TypeScript + Tailwind. No backend: your data is saved in the browser (localStorage).

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Edit the plan

All plan data is in `src/data/`:

| File               | What it holds                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `internships.json` | Internship rows (used once, as the starting data; later edits happen in the app)            |
| `learning.json`    | Tracks and checklist items                                                                  |
| `projects.json`    | Own CV projects P1–P8 and the rules                                                         |
| `dates.json`       | Deadlines and key dates (`certainty`: official / expected / target / approximate)           |
| `events.json`      | Case championships, competitions and events (used once, as starting data, like internships) |

Changes to `learning`, `projects` and `dates` show up immediately.
A new row (new `id`) in `internships.json` or `events.json` is added on the next page load; existing rows are never overwritten.

## Backup

Your data lives only in the browser you use. Use **Backup → Download backup** regularly,
and **Import backup** to move data between devices.

## Deploy

Push to `main` on GitHub; `.github/workflows/deploy.yml` builds and publishes to GitHub Pages
(one-time setup: Settings → Pages → Source: **GitHub Actions**).
