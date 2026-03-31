# Database Foundation

This folder contains the Phase 2 persistence foundation:

- `client.ts` creates the shared Prisma client
- `mappers.ts` converts Prisma records into the existing app domain types
- `repositories/` contains the first query-layer building blocks for the migration away from JSON stores

The app still reads from `lib/auth-store.ts` and `lib/group-store.ts` today. The next migration steps are:

1. move auth/session reads to Prisma-backed repositories
2. move group/member/transaction reads and writes to Prisma-backed repositories
3. remove the file-backed stores after feature parity is reached
