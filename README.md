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

## Live Demo

**Deployed at: [https://lab-flow-pro.vercel.app](https://lab-flow-pro.vercel.app)**

LabFlow Pro is a fully responsive web application — works on desktop, tablet, and mobile. The live deployment on Vercel is connected to a Supabase backend with 1,800+ seeded records ready for demo.

### Quick Access

| Portal | URL | Login |
|--------|-----|-------|
| **Landing Page** | [lab-flow-pro.vercel.app](https://lab-flow-pro.vercel.app) | No login required |
| **Staff Workspace** | [lab-flow-pro.vercel.app/login](https://lab-flow-pro.vercel.app/login) | See staff credentials below |
| **Patient Portal** | [lab-flow-pro.vercel.app/login](https://lab-flow-pro.vercel.app/login) | See patient credentials below |
| **Patient Signup** | [lab-flow-pro.vercel.app/patient-signup](https://lab-flow-pro.vercel.app/patient-signup) | Self-registration with email verification |

## Key User Flows

These are the core flows to explore in the live app:

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
- 2 patient portal accounts (Emily Carter, James Wilson)
- 130 patients (diverse US names, mixed demographics and statuses)
- 300 orders across all workflow stages and priority levels
- 249 specimens including rejected samples with realistic reasons
- 1,200+ individual test results with ~200 abnormal values
- 103 reports (mostly released, some in the generation pipeline)
- 26 clinical chemistry tests with reference ranges
- 6 panels: BMP, CMP, Electrolytes, Liver Function, Lipid Panel, and Renal Function

The data is intentionally distributed across real workflow states so the app is demo-ready:

- orders in `draft`, `collected`, `in_process`, `review`, and `released`
- specimens in `received`, `processing`, `completed`, and `rejected`
- results in draft, review, approved, and released scenarios
- reports in `queued`, `formatting`, `release_ready`, and `released`

## Sample User Logins

### Staff Accounts

All staff accounts share the password: **`LabFlow@2026!`**

| Email | Name | Role | What they can access |
|-------|------|------|---------------------|
| `mike.johnson@labflow.dev` | Mike Johnson | **Admin** | Full access — dashboard, analytics, all modules, user management, integrations |
| `sarah.williams@labflow.dev` | Sarah Williams | **Intake** | Patient registration, order creation, specimen collection |
| `brian.davis@labflow.dev` | Brian Davis | **Technician** | Specimen processing, result entry, draft/submit workflow |
| `jessica.miller@labflow.dev` | Jessica Miller | **Reviewer** | Result approval/rejection, report generation and release |
| `chris.anderson@labflow.dev` | Chris Anderson | **Technician** | Same as Brian — second technician for workload distribution |

### Patient Accounts

All patient accounts share the password: **`Patient@2026!`**

| Email | Name | Patient Ref | Released Results | Released Reports | Best for demo |
|-------|------|-------------|-----------------|-----------------|---------------|
| `emily.carter@email.com` | Emily Carter | PT-10001 | CMP + BMP (multi-visit history) | Multiple reports | Multi-visit patient with full history |
| `james.wilson@email.com` | James Wilson | PT-10002 | Lipid Panel (all 4 values abnormal) | 1 released report | Abnormal results + AI chatbot demo |

### Demo Tips

- **Admin demo**: Login as Mike Johnson → explore Dashboard, Analytics (KPIs, pipeline, staff activity), Admin (users, test catalog)
- **Workflow demo**: Login as Sarah (intake) → create patient → create order → login as Brian (technician) → enter results → login as Jessica (reviewer) → approve → release report
- **Patient demo**: Login as James Wilson → view abnormal lipid results → click "Ask AI" → watch the chatbot explain high cholesterol in plain language
- **Role enforcement demo**: Login as Brian (technician) → notice no "Patients" or "Reports" in sidebar, no approve/release buttons on results

Notes:

- These are demo-only credentials for the seeded users in Supabase Auth.
- New patients can self-register at `/patient-signup` with email verification.
- Rotate or remove these credentials before using the project outside a demo environment.

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

**Production deployment: [https://lab-flow-pro.vercel.app](https://lab-flow-pro.vercel.app)**

This app is deployed on Vercel with Supabase as the backend. To deploy your own instance:

1. Push to GitHub
2. Import in Vercel
3. Add environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Your deployment URL (e.g., `https://lab-flow-pro.vercel.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase public/anon key |
| `OPENAI_API_KEY` | Yes | For the AI patient chatbot |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | For admin operations and seeding |
| `DATABASE_URL` | Server only | For direct database access and migrations |

4. Deploy — Vercel auto-builds and deploys on every push

The app uses Next.js App Router with Server Components, optimized for Vercel's edge runtime. All pages are server-rendered on demand for real-time data.
