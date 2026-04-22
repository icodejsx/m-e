# M&E Platform (Frontend)

A Next.js App Router frontend for the M&E Application API hosted at
[`https://app-service.icadpays.com`](https://app-service.icadpays.com/).
Swagger reference: <https://app-service.icadpays.com/swagger/index.html>.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure the backend
cp .env.example .env.local
# edit NEXT_PUBLIC_API_BASE_URL if pointing at a different environment

# 3. Run the dev server
npm run dev
```

Visit <http://localhost:3000>. Unauthenticated users are redirected to
`/login`; new accounts can be created at `/register`.

## Backend integration

### How requests reach the API (CORS-safe proxy)

The browser does **not** talk to `https://app-service.icadpays.com` directly
because that host does not send CORS headers and rejects `OPTIONS` preflights
with `405`. Instead, Next.js proxies the backend on the same origin:

```
browser  →  GET  http://localhost:3000/be-api/Auth/login
Next.js  →  POST https://app-service.icadpays.com/api/Auth/login  (server-side)
```

The rewrite lives in `next.config.ts` and uses the `BACKEND_ORIGIN` env var
(default: `https://app-service.icadpays.com`). `lib/api/config.ts` picks the
same-origin path `/be-api` for the browser automatically. Override with
`NEXT_PUBLIC_API_BASE_URL` only if the backend is configured to send proper
CORS headers for your origin.

### Typed API layer

All network traffic goes through a small typed API layer:

- `lib/api/config.ts` – base URL + local-storage keys for the JWT session.
- `lib/api/client.ts` – `fetch` wrapper that injects `Authorization: Bearer`,
  serialises query/body, handles `401` by clearing the session and broadcasting
  an `auth-change` event.
- `lib/api/types.ts` – TypeScript DTOs mirroring the Swagger schema (users,
  reports, projects, targets, templates, assignments, ...).
- `lib/api/endpoints.ts` – per-resource modules (`AuthApi`, `UsersApi`,
  `ReportsApi`, `ProjectsApi`, `TargetsApi`, `TemplatesApi`,
  `TemplateDataApi`, `TargetProgressApi`, `AssignmentsApi`, etc.).
- `lib/api/hooks.ts` – React hooks for loading common reference lists
  (`useUsers`, `useReports`, `useTargets`, `useTemplates`, ...).
- `lib/auth.tsx` – `AuthProvider` storing the session in `localStorage`,
  exposing `login`, `register`, `logout`, `refreshUser`. Public routes
  (`/login`, `/register`) bypass the auth gate in `components/shell/AppShell`.

### Pages backed by the API

| Page              | Endpoint(s)                                           |
| ----------------- | ----------------------------------------------------- |
| `/login`          | `POST /Auth/login`                                    |
| `/register`       | `POST /Auth/register`                                 |
| `/users`          | `/Users` CRUD                                         |
| `/reports`        | `/Reports` CRUD                                       |
| `/projects`       | `/Projects` CRUD                                      |
| `/targets`        | `/Targets` CRUD                                       |
| `/report-classes` | `/ReportClasses` CRUD                                 |
| `/report-categories` | `/ReportCategories` CRUD                           |
| `/report-types`   | `/ReportTypes` CRUD                                   |
| `/templates`      | `/Templates` CRUD (+ `/Templates/{id}/fields`)        |
| `/capture`        | `POST /TemplateData` upsert per field                 |
| `/progress`       | `POST /TargetProgress`, `/TargetProgress/recalculate` |
| `/assignments`    | `/UserReports` and `/UserLgas` CRUD                   |

`components/resource/RemoteResourcePage.tsx` is the generic paged CRUD
component driving the list screens.

## Reference data still served locally

MDAs, departments, LGAs, reporting periods and units do not yet have matching
Swagger endpoints. Pages that need them read from the legacy local store
(`lib/store.tsx`) until those endpoints ship.

## Useful scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run lint    # eslint
```
