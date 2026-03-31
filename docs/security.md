# Security Notes

## Current Controls

- Cookie-based auth sessions with expiry handling
- Server-side route protection for authenticated app pages
- Role-based access control for workspace management
- In-memory rate limiting on auth and AI routes
- Security headers applied through `proxy.ts`
- Input validation through shared `zod` schemas

## Launch Caveats

- Rate limiting is process-local. It is not sufficient for horizontally scaled deployments.
- Local file mode is not appropriate for production.
- The local email outbox is a development convenience and not a real transactional mail provider.

## Recommended Post-Launch Upgrades

1. Move rate limiting to Redis or another shared backend.
2. Add centralized error monitoring.
3. Add audit coverage for billing and recurring-plan administration.
4. Add CSP headers once all required asset origins are finalized.
