# Deploying Trainr (Vercel)

Production build is verified with `npm run build`. This checklist covers a first Vercel deployment with the InsForge backend (see `AGENTS.md`).

## Prerequisites

- GitHub repo pushed: [Imhaohao/trainr](https://github.com/Imhaohao/trainr)
- InsForge project provisioned and `scripts/insforge-schema.sql` applied
- `npm run seed` run once against production InsForge (demo owner + Happy Lemon fixture), if you want the demo login

## 1. Create the Vercel project

1. Import the GitHub repo in [Vercel](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected).
3. Root directory: repository root (where `package.json` lives).
4. Build command: `npm run build` (default).
5. Output: Next.js default (no custom `output` in `next.config.ts`).

## 2. Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** for Production (and Preview if you want PR previews to work).

| Variable | Required | Notes |
|----------|----------|--------|
| `SESSION_SECRET` | **Yes** (prod) | `openssl rand -base64 32` — never use the dev default |
| `APP_BASE_URL` | **Yes** | e.g. `https://your-app.vercel.app` — must match Google OAuth redirect URI |
| `USE_MOCKS` | **Yes** | Set to `false` for real InsForge |
| `INSFORGE_API_URL` | **Yes** | From InsForge dashboard |
| `INSFORGE_API_KEY` | **Yes** | From InsForge dashboard |
| `INSFORGE_PROJECT_ID` | If your adapter uses it | See `.env.local` |
| `INSFORGE_TABLE_PREFIX` | Optional | Default `trainr_` |
| `ANTHROPIC_API_KEY` | For pipeline + coach | Generation will fail without it |
| `AWS_ACCESS_KEY_ID` | For Tigris storage | Pipeline checkpoints + files |
| `AWS_SECRET_ACCESS_KEY` | For Tigris | |
| `AWS_ENDPOINT_URL_S3` | For Tigris | e.g. `https://t3.storage.dev` |
| `AWS_REGION` | For Tigris | e.g. `auto` |
| `TIGRIS_BUCKET` | For Tigris | e.g. `trainr` |
| `GOOGLE_CLIENT_ID` | Optional | Google sign-in |
| `GOOGLE_CLIENT_SECRET` | Optional | Pair with `GOOGLE_CLIENT_ID` |
| `RTRVR_API_KEY` | Optional | Research stage; mocks may apply if unset |

Do **not** commit `.env.local`. Copy from `env.local.example` and fill values in Vercel only.

### Google OAuth (if used)

In Google Cloud Console → Credentials → your OAuth client, add:

```text
https://<your-production-domain>/api/auth/google/callback
```

Must match `APP_BASE_URL` exactly (no trailing slash on the origin).

## 3. Deploy and verify

1. Deploy from `main` (or your release branch).
2. After deploy, open the production URL `/` — marketing page should load (static).
3. Log in as demo owner (after seed): `xiao@happylemon-demo.com` / password from your seed run (see `env.local.example` and `scripts/seed.ts`).
4. Open `/dashboard` — should not spin forever; pipeline status should stop on `ready` or `error`.
5. Optional: `POST /api/pipeline/<businessId>/run` only starts one active job at a time (duplicate calls return `{ alreadyRunning: true }`).

## 4. What is not production-ready yet

- **`/deploy` UI** — placeholder; publish flow is Track 4.
- **`POST /api/deploy/:businessId/publish`** — stub (status bump + audit only).
- **Opsera MCP** — IDE-only; not required for runtime.

## 5. Local dev stability (avoid runaway memory)

- Run dev only from this repo root: `cd trainr && npm run dev`.
- `next.config.ts` pins Turbopack root so Next does not follow `~/package-lock.json`.
- Quit stray `node` / `next` processes before restarting Cursor if RAM spikes.
- Avoid clicking **Generate** repeatedly; the API dedupes concurrent runs, but failed runs should use **Retry generation** on the dashboard.

## 6. Rollback

Use Vercel’s deployment history → **Promote** previous deployment, or revert the git commit and redeploy.
