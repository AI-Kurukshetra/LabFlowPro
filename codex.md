# Codex Project Notes

## What this project is
LabFlow Pro — a full-stack Laboratory Information System (LIS) for clinical chemistry labs, built with Next.js 16, Supabase, and shadcn/ui.

## How it was built
This project was developed iteratively using AI-assisted coding, starting from a PRD/blueprint document. The development followed this order:

1. **Scaffold** — Next.js app with Supabase auth, shadcn/ui, Tailwind CSS v4
2. **Schema** — PostgreSQL schema with organizations, profiles, patients, orders, specimens, results, reports
3. **Core modules** — Sample tracking, test ordering, result entry with reference range validation
4. **Reporting** — Report generation with downloadable HTML output
5. **EMR integration** — CSV/JSON/FHIR export APIs
6. **RBAC** — Role-based access control with 5 roles and 37 permissions
7. **Patient portal** — Separate auth flow, results/reports viewing, AI chatbot
8. **AI chatbot** — OpenAI GPT-4o-mini integration for patient result interpretation
9. **Dashboard** — Real-time operational metrics with role-aware content
10. **Admin** — User management, test catalog, panel configuration
11. **Mobile responsive** — Full mobile support across all pages

## Current state
- All MVP requirements complete
- Patient portal with AI chatbot (innovative feature)
- 30 seeded patients, 40 orders, 35 specimens, 134 results, 12 reports
- 5 staff users + 1 patient user for testing
- Mobile responsive across all roles

## Next steps
- Add more test types (microbiology, hematology)
- Real PDF generation (currently HTML-based)
- HL7v2 bidirectional messaging
- Audit trail page
- Notification system
