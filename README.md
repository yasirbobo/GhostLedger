# GhostLedger

GhostLedger is a professional team finance workspace for tracking shared budgets, contributions, expenses, and AI-backed financial insights.

## Product Focus

GhostLedger is designed for:

- startup teams managing pooled operating funds
- creators and communities tracking shared spending
- clubs, cohorts, and small organizations that need lightweight financial accountability

## Current Capabilities

- account sign-up and sign-in with cookie-based sessions
- private group workspaces with owner/admin/member/viewer access controls
- contribution and expense tracking
- encrypted-style private amount masking for sensitive transactions
- AI-backed ledger analysis with deterministic fallback when no API key is configured
- recurring plans with run, pause, resume, and delete controls
- CSV export, monthly reporting, notification preferences, and local delivery outbox
- billing plans with launch-ready workspace limits

## Architecture Today

- Next.js App Router frontend and API routes
- Prisma-backed database mode for auth, groups, recurring plans, invites, notifications, billing, and outbox state
- file mode fallback for local/demo workflows still exists, but launch mode should be `database`
- client providers for session and active group state
- OpenAI Responses API integration for insight generation
- proxy-based security headers and route hardening

## Local Setup

1. Install dependencies.

```bash
npm install
```

2. Create `.env.local`.

```env
DATABASE_URL="file:./prisma/dev.db"
GHOSTLEDGER_STORAGE_MODE=file
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
```

You can start from `.env.example` and copy values into `.env.local`.

`OPENAI_API_KEY` is optional. If it is missing, GhostLedger falls back to built-in rule-based insights.

`GHOSTLEDGER_STORAGE_MODE` controls the active persistence backend:

- `file`: current default, backed by JSON files in `data/`
- `database`: recommended launch mode, routed through Prisma-backed repositories

3. Start the app.

```bash
npm run dev
```

## Database Commands

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

For launch readiness, prefer `database` mode. File mode remains useful for local demos and isolated testing.

## Launch Checklist

1. Set production environment variables.
2. Run `npm run db:generate`.
3. Run `npm run db:push`.
4. Run `npm run db:seed` if migrating from file-backed local data.
5. Run:
   - `npm test`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
6. Deploy.
7. Verify `GET /api/health` returns `ok`.
8. Smoke test:
   - sign in
   - create/open workspace
   - add transaction
   - invite teammate
   - change billing plan
   - run recurring jobs

## Quality Checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Automated CI now runs the same verification flow on pushes and pull requests.

## Operational Checks

- `GET /api/health` returns a lightweight deployment health response
- health validation checks environment readiness, database connectivity in database mode, storage mode, AI configuration presence, and billing plan availability
- local delivery jobs support summary/reminder output through a development outbox in file mode and a Prisma-backed outbox in database mode
- auth and AI endpoints have in-memory rate limiting for launch protection
- see [docs/runbook.md](/workspace/docs/runbook.md) and [docs/security.md](/workspace/docs/security.md) for launch operations

## Current Limitations

- in-memory rate limiting is single-instance only
- billing is launch-ready as an internal plan system, but not yet connected to a payment processor
- the email outbox is not a production mail integration
- AI forecasting and anomaly detection are not yet implemented

## Roadmap

### Phase 1

- branding and repository cleanup
- stronger auth validation and session handling
- server-side route protection
- project structure cleanup and test scaffolding

### Phase 2

- database-backed persistence
- invitations and team roles
- recurring transactions, budgets, exports, and audit trails

### Phase 3

- advanced AI recommendations and forecasting
- notifications and automations
- billing, observability, and operational hardening
