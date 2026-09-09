# Orbis — start here

This source snapshot includes the latest dashboard, Wealth Atlas, navigation,
and light/dark sign-in updates. Dependencies and generated build files are not
included; install them using the included lockfile.

## Run the local demo

1. Install Node.js and npm (the project setup guide uses Node.js 22).
2. Extract the ZIP and open a terminal inside the `orbis-main` folder.
3. Run:

```bash
npm ci
npm run dev -- -p 3010
```

4. Open <http://localhost:3010/login>.
5. Use the prefilled demo login: `demo@orbis.local` / `demo123`.

No environment file, API key, or database is needed for the local demo. Leave
Supabase credentials unset to use the built-in mock workspace. This contains
sample data; demo edits are not durable and demo authentication is not suitable
for production. Real Google/Apple sign-in requires a configured backend.

If port 3010 is already in use, choose another port with `-p` and open that port
in your browser. Stop the server with Ctrl+C.

## Connect a real backend (optional)

Use `.env.example` as a template for your own `.env.local` and follow
`SETUP_GUIDE.md`. Apply **all** SQL files included in `supabase/migrations` in
filename order, not only the earlier migrations listed in the original guide.
Make sure Supabase's site URL and allowed callback URLs match your chosen port.
Original project documentation is preserved in `README.md` and `SETUP_GUIDE.md`;
this file is the quick-start guide for the shared demo snapshot.

Do not distribute real API keys or environment files. This ZIP does not include
local credentials, browser sessions, installed dependencies, or build caches.

## Development checks

```bash
npm run typecheck
npm run lint
```

For a production build, use `npm run build`, then `npm run start`. A successful
local demo is not verification of a production backend or deployment.
