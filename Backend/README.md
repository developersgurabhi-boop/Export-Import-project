# TMS Backend

NestJS API for the Transport Management System. Full specification: [.md](.md).

Status: sprint 1 foundation (identity and role-based access control). See "Not yet built" below.

## Prerequisites

Node 22, npm, Docker (for PostgreSQL locally).

## Local setup

```bash
cd Backend
npm install
cp .env.example .env          # then edit JWT_ACCESS_SECRET and SEED_ADMIN_PASSWORD
docker run -d --name tms-pg -e POSTGRES_USER=tms -e POSTGRES_PASSWORD=tms -e POSTGRES_DB=tms -p 5432:5432 postgres:16
npx prisma migrate deploy     # applies prisma/migrations
npm run db:seed               # permissions, roles, demo org/branches, first admin
npm run start:dev             # API on http://localhost:3001/api/v1
```

## Scripts

| Script | What it does |
|---|---|
| `npm run start:dev` | Dev server with watch |
| `npm run build` / `npm start` | Production build and run |
| `npm test` | Unit tests (no database needed) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:migrate` | Create and apply a new migration (dev) |
| `npm run db:seed` | Idempotent seed |

## Authorization model

- Every route must declare one of: `@RequirePermission('<resource>:<action>')`, `@Authenticated()`, or `@Public()`. Undeclared routes are denied. A unit test scans all routes and fails if one is undeclared.
- Permissions come from the catalogue in `src/platform/authorization/permissions.ts`. The `RequirePermission` decorator is typed against it, so a typo fails to compile.
- Roles are assigned per branch (`user_branch_role`). A user's permissions are the union of their roles. Head office roles see all branches.
- Routes listed in `MFA_REQUIRED_PERMISSIONS` need an MFA-verified session (token claim `mfa=true`).
- Permissions are cached for 45 seconds per process and cleared immediately when a user is updated.
- Error responses are RFC 7807 problem+json with a stable `code` (see `src/platform/errors/app-error.ts`).

## API (so far)

| Method | Path | Permission |
|---|---|---|
| GET | `/health`, `/health/ready` | public |
| POST | `/auth/login` | public |
| GET | `/auth/me` | any authenticated user |
| GET / POST | `/users` | `user:manage` (MFA required) |
| GET / PATCH | `/users/:id` | `user:manage` (MFA required) |
| GET | `/roles`, `/permissions` | `user:manage` (MFA required) |

## Not yet built (next steps, in order)

1. TOTP MFA enrolment and verification, so MFA-gated routes can be used.
2. Refresh-token rotation with reuse detection (httpOnly cookie).
3. Audit log writes for permission and user changes.
4. OpenAPI generation and an `/api/v1` drift check in CI.
5. Dockerfile, CI workflow, and the route permission registry as a generated document.
