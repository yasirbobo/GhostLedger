# GhostLedger Runbook

## Pre-Launch

1. Confirm `.env.local` or production environment variables are set:
   - `DATABASE_URL`
   - `GHOSTLEDGER_STORAGE_MODE`
   - `OPENAI_API_KEY` if AI model responses are required
   - `OPENAI_MODEL` if overriding the default
2. Run:
   - `npm run db:generate`
   - `npm test`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
3. If launching with database mode, run:
   - `npm run db:push`
   - `npm run db:seed` if migrating from local JSON state

## Health Checks

- `GET /api/health`
- Expected `status`:
  - `ok`: environment and database checks passed
  - `degraded`: a required dependency failed or optional services are missing

## Operational Notes

- Auth and AI endpoints are rate limited in-memory. This is enough for a single-instance launch but should be replaced with shared storage for multi-instance deployment.
- The email outbox is local in file mode and database-backed in database mode.
- AI continues to work without `OPENAI_API_KEY`, but responses fall back to deterministic analytics.

## Deployment Guidance

- Preferred launch mode: `database`
- Use `file` mode only for demo/local usage
- Confirm `GET /api/health` returns `ok` after deployment
- Verify:
  - sign up / sign in
  - create group
  - add transaction
  - invite teammate
  - update billing plan
  - run recurring job

## Rollback

1. Revert to the previous deployment in your hosting provider.
2. If the issue is app-only and the schema is unchanged, no DB rollback is needed.
3. If the issue is tied to newly seeded data, restore from the previous database snapshot before re-enabling traffic.
