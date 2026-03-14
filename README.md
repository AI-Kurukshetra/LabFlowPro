# LabFlow Pro

LabFlow Pro is a modern laboratory workflow SaaS for clinical chemistry labs. It brings patient intake, test ordering, specimen tracking, manual result entry, review, reporting, EMR-friendly export, analytics, and a patient-facing AI assistant into one web app.

## What Problem Does This Solve?

Small and mid-sized labs often run critical work across disconnected tools: paper intake forms, spreadsheets, status calls, manual report handling, and patient follow-up outside the main workflow. That creates slow turnaround times, weak traceability, and poor visibility for both staff and patients.

LabFlow Pro solves that by putting the core lab workflow in one system:

- register patients and keep demographics in one place
- create and manage chemistry orders
- track specimens from collection to completion
- enter results manually and route them for review
- release reports and structured exports
- give patients secure self-service access to released results
- let patients use an AI assistant to understand results in plain language

## Who Is It For?

- independent and mid-sized diagnostic labs
- clinical chemistry teams proving a focused MVP before expanding into hematology, microbiology, and other departments
- intake staff, lab technicians, reviewers, and lab administrators
- patients who want a simple portal to view results, reports, and AI-assisted explanations

## Live App: Key User Flows

This project is designed to be deployed on Vercel. In a live deployment, these are the core flows to demo:

1. Staff sign in at `/login`
2. Intake staff register patients at `/patients/new`
3. Intake staff place chemistry orders at `/orders/new`
4. Staff create and track specimens in `/specimens`
5. Technicians enter or update results in `/results/order/[orderId]`
6. Reviewers approve results and manage reports in `/results` and `/reports`
7. Admins monitor KPIs and exports in `/analytics` and `/integrations`
8. Patients sign up at `/patient-signup`, view results in `/portal`, and ask follow-up questions in `/portal/chat`

Useful seeded demo records:

- `LF-2001`: released order with released report path
- `LF-2015`: in-process order with result-entry workflow
- `LF-2016`: in-process order with dynamic reference range behavior
- `LF-2021`: newly collected order/specimen state
- `RP-50011`: released report
- `RP-50012`: queued report

## Main Features

- Patient management with search, create, edit, status changes, and order history
- Panel-based test ordering with priority and workflow status tracking
- Specimen management with collection, processing, completion, and rejection states
- Manual result entry with draft save, review, approval, return, and release actions
- Dynamic reference range management based on sex, age band, methodology, and population
- Printable report download plus structured result export
- EMR integration through CSV, JSON, and FHIR R4 export formats
- Role-based access across the staff workspace and patient portal
- Patient portal for released results and report download
- AI chatbot that explains released lab results and preparation guidance in plain language
- Analytics for operational volume, approval rates, rejection trends, abnormal results, and staff activity

## What Data Is Included?

The seeded demo environment is centered on a single organization, `Metro Clinical Labs`, and includes:

- 5 staff profiles across admin, intake, technician, and reviewer roles
- 30 patients
- 40 orders
- 35 specimens
- 12 reports
- 26 clinical chemistry tests
- 6 panels: BMP, CMP, Electrolytes, Liver Function, Lipid Panel, and Renal Function

The data is intentionally distributed across real workflow states so the app is demo-ready:

- orders in `draft`, `collected`, `in_process`, `review`, and `released`
- specimens in `received`, `processing`, `completed`, and `rejected`
- results in draft, review, approved, and released scenarios
- reports in `queued`, `formatting`, `release_ready`, and `released`

## Sample User Logins

Verified demo login:

- `mike.johnson@labflow.dev` — admin

Important note:

- Staff profiles for intake, technician, and reviewer roles are seeded in the demo data.
- Passwords are managed in Supabase Auth and are intentionally not stored in this repository.
- Patient users are created through the `/patient-signup` flow rather than being committed as source-controlled demo credentials.

If you want fixed public demo credentials in this README, set or reset the demo account passwords in Supabase Auth first, then update this section.

## How Is It Different From Existing Alternatives?

Most legacy LIS/LIMS products are strong on internal lab workflow but weak on patient experience, modern web UX, and fast deployment. LabFlow Pro is different in a few important ways:

- it focuses on a clinical chemistry MVP first instead of trying to model every department on day one
- it includes a patient portal as part of the core product, not as a bolt-on
- it adds an AI chatbot that uses the patient portal context to explain released results, reference ranges, and test prep in plain language
- it uses dynamic reference ranges rather than relying only on one static range per test
- it supports lightweight EMR handoff with CSV, JSON, and FHIR R4 exports
- it is built as a modern web app on Next.js, Supabase, and Vercel instead of a legacy on-prem deployment model

The AI assistant is a major differentiator in this MVP. It does not diagnose or prescribe. It is designed to help patients understand what a test measures, whether a value is in or out of range, and what questions to bring back to their healthcare provider.

## Stack

- Next.js 16 + React 19
- Supabase Postgres + Auth + Row Level Security
- Vercel for deployment
- OpenAI API for the patient AI assistant
- Tailwind CSS v4 + shadcn/ui for the UI layer

## AI CLI Tooling Used

- OpenAI Codex CLI was used for implementation, refactoring, UI iteration, migration work, and documentation updates.
- Supabase CLI was used for database migrations, schema changes, and seed execution.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Configure the app:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# optional fallback for older projects
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# needed for AI chat
OPENAI_API_KEY=your-openai-api-key

# needed for seed scripts / admin tasks
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# needed if you want to push migrations directly with the Supabase CLI
DATABASE_URL=your-direct-or-pooler-postgres-url
```

4. Start the app:

```bash
npm run dev
```

5. Verify the production build:

```bash
npm run build
```

## Database and Seeding

To apply migrations and seed demo data with the Supabase CLI:

```bash
npx supabase db push --db-url "$DATABASE_URL" --include-seed
```

To run the richer TypeScript seed directly:

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx supabase/seed-full.ts
```

## Deployment

This app is intended to be deployed on Vercel with Supabase as the backend. Set the same environment variables in Vercel that you use locally, especially:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `OPENAI_API_KEY`

For database administration and seeding, keep `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` server-only.
