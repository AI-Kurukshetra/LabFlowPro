# Codex Instructions for LabFlow Pro

## Context
LabFlow Pro is a Laboratory Information System (LIS) SaaS application. When working on this codebase, always consider the clinical workflow: patients → orders → specimens → results → reports.

## Rules

1. **Never modify** the Supabase schema directly. Always create a new migration file in `supabase/migrations/`.
2. **Always check permissions** before any mutation. Use `checkActionPermission()` from `src/lib/rbac/check-access.ts`.
3. **Preserve preview mode**. Every page that fetches from Supabase must have a fallback when `isSupabaseConfigured()` returns false.
4. **Follow the style guide**. Read `STYLE_GUIDE.md` before making any UI changes.
5. **Mobile-first**. All new UI must work at 375px width. Wrap tables in `overflow-x-auto`.
6. **Test the build**. Run `npm run build` after making changes to verify no TypeScript or compilation errors.

## File Organization

- New pages go in `src/app/(workspace)/` for staff or `src/app/(patient-portal)/` for patients
- New server actions go in `src/lib/actions/`
- New query functions go in `src/lib/queries/`
- New UI components go in `src/components/workspace/` or `src/components/portal/`
- Shared UI primitives are in `src/components/ui/` (managed by shadcn)

## Important Patterns

### Adding a new module page
1. Create query functions in `src/lib/queries/<module>.ts`
2. Create server actions in `src/lib/actions/<module>.ts`
3. Add permissions to `src/lib/rbac/permissions.ts`
4. Create the page in `src/app/(workspace)/<module>/page.tsx`
5. Add navigation item to `src/lib/navigation.ts`

### Adding a new status transition
1. Define allowed transitions in the server action
2. Map the transition to a permission in `src/lib/rbac/permissions.ts`
3. Update the status action component to show the new button
4. Add color mapping to `src/components/workspace/status-badge.tsx`

## Testing Credentials

### Staff (password: LabFlow@2026)
- admin: mike.johnson@labflow.dev
- intake: sarah.williams@labflow.dev
- technician: brian.davis@labflow.dev
- reviewer: jessica.miller@labflow.dev

### Patient (password: Patient@2026)
- james.wilson@email.com
