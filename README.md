# GhostLedger

GhostLedger is a Next.js app for managing private team finance ledgers with:

- server-side group persistence
- account sign-up/sign-in with cookie sessions
- email-based group access control
- AI-backed ledger analysis with deterministic fallback

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local `.env.local` file:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
```

`OPENAI_API_KEY` is optional. If it is missing, the analyst falls back to built-in rule-based insights.

3. Start the app:

```bash
npm run dev
```

## Current architecture

- Auth and sessions are stored in `data/auth.json`
- Groups and transactions are stored in `data/groups.json`
- The AI analyst uses the OpenAI Responses API when configured
- Protected app routes require authentication in the client shell

## Verification

These commands currently pass:

```bash
npx tsc --noEmit
npm run lint
```

`npm run lint` still reports three existing warnings in generated/shared utility files, but no errors.
