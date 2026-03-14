# LabFlow Pro — Agent Instructions

This file provides guidance for AI coding agents working on this codebase.

## Project Overview

LabFlow Pro is a next-generation Laboratory Information System (LIS) built for clinical chemistry labs. It covers the full specimen lifecycle: patient intake, test ordering, specimen tracking, result entry/verification, report generation, and EMR integration.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **UI**: shadcn/ui + Tailwind CSS v4
- **AI**: OpenAI GPT-4o-mini (patient chatbot)
- **Package Manager**: npm

## Architecture

```
src/
├── app/
│   ├── (auth)/           # Login, signup, patient-signup
│   ├── (workspace)/      # Staff workspace (dashboard, patients, orders, specimens, results, reports, admin, integrations)
│   ├── (patient-portal)/ # Patient portal (dashboard, results, reports, chat)
│   └── api/              # API routes (chat, export, report download)
├── components/
│   ├── auth/             # Auth forms and shell
│   ├── brand/            # Logo component
│   ├── portal/           # Patient portal components (shell, chat)
│   ├── ui/               # shadcn/ui primitives
│   └── workspace/        # Workspace components (shell, nav, forms, tables)
├── lib/
│   ├── actions/          # Server actions (patients, orders, specimens, results, reports)
│   ├── auth/             # Auth actions (signIn, signUp, signOut)
│   ├── emr/              # EMR export functions (CSV, JSON, FHIR)
│   ├── queries/          # Data access layer (per-module query functions)
│   ├── rbac/             # Role-based access control (permissions, check-access)
│   ├── supabase/         # Supabase client (server, browser, middleware)
│   └── types/            # TypeScript type definitions
└── supabase/
    ├── migrations/       # Database migrations
    ├── schema.sql        # Full schema reference
    ├── seed.sql          # SQL seed data
    ├── seed.ts           # Original seed script
    └── seed-full.ts      # Comprehensive seed with 30 patients, 40 orders, etc.
```

## Key Patterns

### Server Components vs Client Components
- Pages are async Server Components (data fetching at the top)
- Forms and interactive elements are `"use client"` components
- Use `useActionState` from React 19 for form state management

### Data Access
- All queries go through `src/lib/queries/` functions
- Each function accepts a Supabase client parameter
- Queries use Supabase `.select()` with relation joins
- Pagination via `.range(from, to)` with `{ count: "exact" }`

### Server Actions
- All mutations in `src/lib/actions/` with `"use server"` directive
- Every action calls `checkActionPermission()` for RBAC enforcement
- Actions return `{ status: "success" | "error", message: string }`
- Call `revalidatePath()` after mutations

### RBAC
- 5 roles: admin, intake, technician, reviewer, patient
- 37 granular permissions defined in `src/lib/rbac/permissions.ts`
- Server-side enforcement in actions and page guards
- UI-level enforcement: buttons/nav hidden per role

### Preview Mode
- When Supabase env vars are missing, the app runs in preview mode
- Pages fall back to mock data from `src/lib/mock-data.ts`
- Auth screens show setup guidance

## Coding Guidelines

- Follow `STYLE_GUIDE.md` for all UI work
- No glassmorphism, no custom shadows beyond `shadow-sm`
- Max border radius: `rounded-xl`
- Sans-serif fonts only (no `font-display` / serif)
- Use existing UI components from `src/components/ui/`
- Reference ranges use `{ min, max }` format in the database
- All interactive elements must have `cursor: pointer`
- Tables must be wrapped in `overflow-x-auto` for mobile
- Use responsive Tailwind classes: mobile-first with `sm:`, `lg:`, `xl:` breakpoints

## Database

- Schema defined in `supabase/schema.sql`
- Migrations in `supabase/migrations/`
- RLS policies enforce org-scoped access for staff, patient-scoped for patients
- Auto-create profile trigger on auth.users insert

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

## Verification Commands

```bash
npm run lint
npm run build
```
