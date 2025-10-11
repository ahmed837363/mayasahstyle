What's included

- A lightweight SQLite helper at `backend/db.js` which creates an on-disk `data/mayasah.sqlite` DB and tables for `payments`, `sessions`, `consents`, and `email_errors`.
- An admin UI at `http://<host>:<port>/admin/` (serves `backend/admin/index.html`) which lists `email_failed` payments and allows retries via the existing `/admin/retry-failed-emails` endpoint.

How it works

- The server will still write JSON file backups to `backend/data/*.json` for compatibility. When `sqlite3` is available, session creation also persists sessions to SQLite by calling `db.upsertSession(...)`.
- There's a migration helper `db.migrateFromFiles(filesDir)` to import existing JSON files into SQLite.

How to enable SQLite locally

1. In `backend` folder run (PowerShell with script execution enabled or CMD):

   npm install

2. Start the server as normal: `node server.js`.

   On startup, the DB file `backend/data/mayasah.sqlite` will be created automatically when db functions are used. You can also call `db.init()` or `db.migrateFromFiles('./data')` from a small script to import existing JSON files.

Admin UI

- Visit `/admin/` to view failed emails. Click `Retry` to call the retry endpoint for that order.

Notes

- I couldn't run `npm install` from this environment due to PowerShell execution policy. Please run `npm install` locally to fetch `sqlite3`.
- The changes remove the local card capture inputs from `checkout.html` so the site no longer collects card numbers.

If you'd like, I can:
- Add a small migration script `bin/migrate.js` to run import from JSON to SQLite.
- Add a server-side health check showing whether DB is available.
- Implement a richer admin UI with filtering and CSV export.
