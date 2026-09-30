// Dev-server plugin: keeps a copy of your tracker data on your Mac.
//
// Only runs with `npm run dev` (the GitHub Pages site has no server, so it can't save to disk).
//   GET  /__disk/user-data  → the saved file, or 404 if there is none yet
//   PUT  /__disk/user-data  → save the app's data to data/user-data.json
// Each save also writes today's copy to data/backups/user-data-YYYY-MM-DD.json,
// and only the 7 most recent daily copies are kept.
import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises'
import type { IncomingMessage } from 'node:http'
import path from 'node:path'
import type { Plugin } from 'vite'

export const ENDPOINT = '/__disk/user-data'
const KEEP_DAILY_COPIES = 7
const MAX_BYTES = 5 * 1024 * 1024 // far more than the tracker will ever need

const BACKUP_NAME = /^user-data-(\d{4}-\d{2}-\d{2})\.json$/

// Which daily copies to delete: everything except the newest `keep` (names sort by date)
export function backupsToDelete(fileNames: string[], keep = KEEP_DAILY_COPIES): string[] {
  const daily = fileNames.filter((f) => BACKUP_NAME.test(f)).sort()
  return daily.slice(0, Math.max(0, daily.length - keep))
}

export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > MAX_BYTES) reject(new Error('too large'))
      else chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export function diskSave(): Plugin {
  let dataDir = ''
  return {
    name: 'tracker-disk-save',
    apply: 'serve', // dev server only
    configResolved(config) {
      // TRACKER_DATA_DIR lets a test server use a different folder, so it never touches your real file
      dataDir = process.env.TRACKER_DATA_DIR ?? path.join(config.root, 'data')
    },
    configureServer(server) {
      const file = () => path.join(dataDir, 'user-data.json')
      const backups = () => path.join(dataDir, 'backups')

      server.middlewares.use(ENDPOINT, async (req, res) => {
        try {
          if (req.method === 'GET') {
            const text = await readFile(file(), 'utf8').catch(() => null)
            res.statusCode = text === null ? 404 : 200
            res.setHeader('content-type', 'application/json')
            res.end(text ?? '{}')
            return
          }
          if (req.method === 'PUT') {
            const text = await readBody(req)
            const parsed = JSON.parse(text) // refuse anything that isn't valid JSON
            if (typeof parsed?.schemaVersion !== 'number') throw new Error('not tracker data')
            const pretty = JSON.stringify(parsed, null, 2) + '\n'

            await mkdir(backups(), { recursive: true })
            // Write to a temporary file first, then rename: a crash mid-write can't corrupt the file
            await writeFile(file() + '.tmp', pretty)
            await rename(file() + '.tmp', file())
            await writeFile(path.join(backups(), `user-data-${localDate()}.json`), pretty)
            for (const old of backupsToDelete(await readdir(backups()))) await unlink(path.join(backups(), old))

            res.statusCode = 204
            res.end()
            return
          }
          res.statusCode = 405
          res.end()
        } catch (err) {
          res.statusCode = 400
          res.end((err as Error).message)
        }
      })
    },
  }
}
