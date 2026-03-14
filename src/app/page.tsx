import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileOutput,
  FlaskConical,
  Gauge,
  Heart,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Users2,
  Zap,
} from "lucide-react";

import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Modules", href: "#modules" },
  { label: "For your team", href: "#roles" },
  { label: "FAQ", href: "#faq" },
];

const heroStats = [
  { value: "< 2 min", label: "Patient intake" },
  { value: "99.9%", label: "Specimen traceability" },
  { value: "40%", label: "Faster approvals" },
  { value: "Zero", label: "Paper forms required" },
];

const previewRows = [
  { id: "LF-1042", patient: "Mia Patel", panel: "CMP", priority: "STAT", status: "Ready for review", statusColor: "bg-amber-400" },
  { id: "LF-1046", patient: "Noah Kim", panel: "Electrolytes", priority: "Urgent", status: "Analyzer queued", statusColor: "bg-sky-400" },
  { id: "LF-1051", patient: "Ava Singh", panel: "Liver function", priority: "Urgent", status: "Specimen received", statusColor: "bg-emerald-400" },
  { id: "LF-1058", patient: "Arjun Shah", panel: "Lipid panel", priority: "Routine", status: "In processing", statusColor: "bg-violet-400" },
];

const workflowSteps = [
  {
    step: "01",
    title: "Register & order",
    description: "Capture patient demographics, select tests or panels, and generate specimen barcodes — all in one flow.",
    icon: Users2,
    color: "bg-teal-500 text-white",
  },
  {
    step: "02",
    title: "Track specimens",
    description: "Follow every specimen from collection through processing with real-time status visible to the whole team.",
    icon: TestTube2,
    color: "bg-sky-500 text-white",
  },
  {
    step: "03",
    title: "Enter results",
    description: "Type-aware validation, draft saves, and required-field enforcement keep data quality high from the start.",
    icon: ClipboardList,
    color: "bg-violet-500 text-white",
  },
  {
    step: "04",
    title: "Review & approve",
    description: "Supervisors approve or reject in an explicit review step. No report leaves without sign-off.",
    icon: FileCheck2,
    color: "bg-amber-500 text-white",
  },
  {
    step: "05",
    title: "Release reports",
    description: "Generate branded PDFs, CSV, or JSON exports. Every release is timestamped and auditable.",
    icon: FileOutput,
    color: "bg-emerald-500 text-white",
  },
];

const bentoModules = [
  {
    title: "Patients",
    description: "Demographics, duplicate detection, and complete order history for every patient in your organization.",
    icon: Users2,
    span: "lg:col-span-2",
    accent: "border-teal-100 bg-teal-50/50",
    iconBg: "bg-teal-500 text-white",
  },
  {
    title: "Orders",
    description: "Create orders with test/panel selection, priority levels, and full lifecycle status tracking.",
    icon: ClipboardList,
    span: "",
    accent: "border-sky-100 bg-sky-50/50",
    iconBg: "bg-sky-500 text-white",
  },
  {
    title: "Specimens",
    description: "Barcode-ready identifiers, collection logging, and chain-of-custody state management.",
    icon: TestTube2,
    span: "",
    accent: "border-violet-100 bg-violet-50/50",
    iconBg: "bg-violet-500 text-white",
  },
  {
    title: "Results",
    description: "Draft entry, validation, supervisor review with full revision history and approval tracking.",
    icon: FileCheck2,
    span: "",
    accent: "border-amber-100 bg-amber-50/50",
    iconBg: "bg-amber-500 text-white",
  },
  {
    title: "Reports",
    description: "PDF generation, structured exports, versioning, and a complete release audit trail.",
    icon: FileOutput,
    span: "",
    accent: "border-emerald-100 bg-emerald-50/50",
    iconBg: "bg-emerald-500 text-white",
  },
  {
    title: "Admin",
    description: "Manage users, assign roles, configure your test catalog, and review the full audit log.",
    icon: ShieldCheck,
    span: "lg:col-span-2",
    accent: "border-slate-200 bg-slate-50/50",
    iconBg: "bg-slate-800 text-white",
  },
];

const roleCards = [
  {
    role: "Intake staff",
    description: "Register patients, create orders, and log specimen collection details.",
    tasks: ["Patient registration", "Order creation", "Specimen logging"],
    icon: Users2,
    gradient: "from-teal-600 to-teal-500",
  },
  {
    role: "Lab technician",
    description: "Process specimens, update statuses, and enter test results with validation.",
    tasks: ["Specimen processing", "Status updates", "Result entry"],
    icon: TestTube2,
    gradient: "from-sky-600 to-sky-500",
  },
  {
    role: "Reviewer",
    description: "Approve or reject result sets and control report release with full audit trail.",
    tasks: ["Result approval", "Report release", "Quality oversight"],
    icon: FileCheck2,
    gradient: "from-violet-600 to-violet-500",
  },
  {
    role: "Admin",
    description: "Manage users, roles, test catalog, and organization-wide settings.",
    tasks: ["User management", "Catalog config", "Audit monitoring"],
    icon: ShieldCheck,
    gradient: "from-slate-700 to-slate-600",
  },
  {
    role: "Patient",
    description: "View your released results, get AI-powered explanations, and track your health history.",
    tasks: ["View results online", "AI result interpretation", "Health tracking"],
    icon: Heart,
    gradient: "from-rose-600 to-rose-500",
  },
];

const stats = [
  { value: "< 2 min", label: "Patient + order intake", icon: Zap },
  { value: "99.9%", label: "Specimen traceability target", icon: Activity },
  { value: "40%", label: "Faster result approval", icon: Gauge },
  { value: "< 1%", label: "Post-release correction rate", icon: ShieldCheck },
];

const patientPortalFeatures = [
  { text: "View released lab results online", icon: FileCheck2 },
  { text: "AI-powered result interpretation", icon: Bot },
  { text: "Test preparation guidance", icon: ClipboardList },
  { text: "Secure, HIPAA-ready access", icon: ShieldCheck },
];

const aiFeatures = [
  "Natural language result explanations",
  "Test preparation guidance",
  "Reference range context",
  "Always recommends consulting your doctor",
];

const faqItems = [
  {
    question: "How quickly can my lab get started?",
    answer: "Create your workspace, invite your team, and configure your test catalog. Most labs are operational within a single shift.",
  },
  {
    question: "Who is LabFlow Pro built for?",
    answer: "Small and mid-sized diagnostic labs that need operational traceability without the cost and complexity of enterprise LIS platforms.",
  },
  {
    question: "How does result approval work?",
    answer: "Result entry and supervisor sign-off are separate steps. Reports can only be generated after every required test is reviewed and approved.",
  },
  {
    question: "Can we export data to other systems?",
    answer: "Yes. Released results can be exported as PDF reports, CSV, or JSON — keeping downstream handoff simple and integration-ready.",
  },
  {
    question: "What about data security?",
    answer: "All data is organization-scoped with role-based access. Every critical action is logged with timestamps and user identity.",
  },
  {
    question: "Is this a full enterprise LIS?",
    answer: "Not yet, by design. LabFlow Pro focuses on the operational core first so your team ships value before scope creep.",
  },
  {
    question: "Can patients view their own results?",
    answer: "Yes. Patients can sign up for the Patient Portal to view their released lab results, download reports, and use the AI assistant for general result explanations — all in a secure, self-service interface.",
  },
  {
    question: "How does the AI assistant work?",
    answer: "Our AI chatbot helps patients understand their lab results in plain language. It explains what tests measure, what reference ranges mean, and how to prepare for upcoming tests. It always recommends consulting a healthcare provider for personalized medical advice.",
  },
  {
    question: "Is patient data secure?",
    answer: "Yes. Patients can only see their own released results. Access is scoped to the individual patient record, and all actions are logged. The portal is designed with HIPAA-ready security controls.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ---- Navbar ---- */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <span className="hidden md:inline-flex">
              <LogoMark inverted />
            </span>
            <span className="inline-flex md:hidden">
              <LogoMark compact inverted />
            </span>
          </div>
          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="hidden text-slate-300 hover:bg-white/10 hover:text-white sm:inline-flex" asChild>
              <Link href="/portal">Patient Portal</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-white/10 hover:text-white" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="rounded-lg px-3 sm:px-4" asChild>
              <Link href="/signup">Get started free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ---- Hero (dark) ---- */}
      <section className="relative overflow-hidden bg-slate-950 pb-24 pt-16 lg:pb-32 lg:pt-24">
        {/* Subtle gradient accent */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-teal-500/8 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3.5 py-1.5 text-sm font-medium text-teal-400">
              <FlaskConical className="size-3.5" />
              Laboratory workflow platform
            </div>

            <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              The operating system for
              <span className="text-teal-400"> modern laboratories.</span>
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
              LabFlow Pro replaces spreadsheets, paper logs, and disconnected
              tools with one structured workspace — from patient intake and
              specimen tracking to result verification, report release, and
              patient self-service.
            </p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <Button size="lg" className="h-12 rounded-lg px-6 text-base" asChild>
                <Link href="/signup">
                  Start your workspace
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 rounded-lg border-slate-700 bg-transparent px-6 text-base text-slate-300 hover:bg-white/5 hover:text-white"
                asChild
              >
                <Link href="#how-it-works">See how it works</Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-12 rounded-lg px-6 text-base text-slate-400 hover:bg-white/5 hover:text-white"
                asChild
              >
                <Link href="/portal">Patient Portal</Link>
              </Button>
            </div>

            {/* Mini stats */}
            <div className="flex flex-wrap gap-4 pt-4 sm:gap-8">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Product preview mockup */}
          <div className="mt-16 rounded-xl border border-white/10 bg-white/5 p-1.5 shadow-2xl lg:mt-20">
            <div className="rounded-lg border border-white/5 bg-slate-900">
              {/* Mock toolbar */}
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="size-3 rounded-full bg-slate-700" />
                    <span className="size-3 rounded-full bg-slate-700" />
                    <span className="size-3 rounded-full bg-slate-700" />
                  </div>
                  <span className="text-xs font-medium text-slate-500">Urgent Order Queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-500">4 priority items</span>
                </div>
              </div>

              {/* Mock table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-xs text-slate-500">
                      <th className="px-4 py-2.5 font-medium">Order</th>
                      <th className="px-4 py-2.5 font-medium">Patient</th>
                      <th className="px-4 py-2.5 font-medium">Panel</th>
                      <th className="px-4 py-2.5 font-medium">Priority</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row.id} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs text-teal-400">{row.id}</td>
                        <td className="px-4 py-3 text-slate-300">{row.patient}</td>
                        <td className="px-4 py-3 text-slate-400">{row.panel}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                            row.priority === "STAT"
                              ? "bg-red-500/15 text-red-400"
                              : row.priority === "Urgent"
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-slate-500/15 text-slate-400"
                          )}>
                            {row.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn("size-1.5 rounded-full", row.statusColor)} />
                            <span className="text-slate-400">{row.status}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Trusted by / social proof strip ---- */}
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            Built for labs that need clarity, not complexity
          </p>
          <div className="mx-auto mt-6 grid max-w-3xl gap-6 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, text: "Role-based access control" },
              { icon: FlaskConical, text: "Full audit trail on every action" },
              { icon: Gauge, text: "Sub-2-minute intake workflow" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center justify-center gap-2.5 text-sm text-slate-600">
                <Icon className="size-4 text-primary" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- How it works (timeline) ---- */}
      <section id="how-it-works" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              How it works
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              From intake to released report, in five steps.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Every step in the specimen lifecycle has a dedicated surface with
              validation, status tracking, and audit logging built in.
            </p>
          </div>

          <div className="relative mt-16">
            {/* Vertical line connector */}
            <div className="absolute left-6 top-0 hidden h-full w-px bg-slate-200 lg:left-1/2 lg:block" />

            <div className="space-y-8 lg:space-y-12">
              {workflowSteps.map(({ step, title, description, icon: Icon, color }, i) => (
                <div
                  key={step}
                  className={cn(
                    "relative flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-12",
                    i % 2 === 1 && "lg:flex-row-reverse"
                  )}
                >
                  {/* Content */}
                  <div className={cn("flex-1", i % 2 === 1 ? "lg:text-right" : "")}>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">Step {step}</p>
                    <h3 className="mt-2 text-xl font-bold text-slate-950">{title}</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                      {description}
                    </p>
                  </div>

                  {/* Center icon */}
                  <div className="relative z-10 hidden lg:flex lg:shrink-0">
                    <span className={cn("flex size-12 items-center justify-center rounded-xl shadow-lg", color)}>
                      <Icon className="size-5" />
                    </span>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden flex-1 lg:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Stats (dramatic) ---- */}
      <section className="bg-slate-950">
        <div className="mx-auto grid max-w-6xl divide-y divide-white/5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-start gap-4 px-6 py-10 lg:px-8 lg:py-14">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-teal-400">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Modules (bento) ---- */}
      <section id="modules" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Modules
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Everything your lab needs. Nothing it doesn&apos;t.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Six purpose-built modules covering the full specimen lifecycle —
              no enterprise bloat.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bentoModules.map(({ title, description, icon: Icon, span, accent, iconBg }) => (
              <div
                key={title}
                className={cn(
                  "group rounded-xl border p-6 transition-all hover:shadow-md",
                  accent,
                  span
                )}
              >
                <span className={cn("flex size-10 items-center justify-center rounded-lg", iconBg)}>
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Roles ---- */}
      <section id="roles" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              For your team
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              One workspace. Clear responsibilities.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Each team member sees the work that matters to them, with
              permissions that match their role.
            </p>
          </div>

          <div className="mt-14 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {roleCards.map(({ role, description, tasks, icon: Icon, gradient }) => (
              <div key={role} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className={cn("bg-gradient-to-br px-5 py-6 text-white", gradient)}>
                  <span className="flex size-10 items-center justify-center rounded-lg bg-white/20">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-3 text-base font-bold">{role}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/80">{description}</p>
                </div>
                <div className="px-5 py-4">
                  <ul className="space-y-2">
                    {tasks.map((task) => (
                      <li key={task} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Patient Portal ---- */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">
                Patient Portal
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Your patients, connected.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Give patients secure, self-service access to their released lab
                results. No phone calls, no faxes — just a clean portal they
                can check anytime.
              </p>

              <ul className="mt-8 space-y-4">
                {patientPortalFeatures.map(({ text, icon: Icon }) => (
                  <li key={text} className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-sm font-medium text-slate-700">{text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button size="lg" className="h-12 rounded-lg px-6 text-base" asChild>
                  <Link href="/patient-signup">
                    Sign up as a patient
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-8">
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <FileCheck2 className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Complete Metabolic Panel</p>
                      <p className="text-xs text-slate-500">Released Jan 15, 2026</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Glucose</span>
                      <span className="font-medium text-emerald-700">92 mg/dL</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Creatinine</span>
                      <span className="font-medium text-emerald-700">0.9 mg/dL</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">BUN</span>
                      <span className="font-medium text-emerald-700">15 mg/dL</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Bot className="size-4" />
                    </span>
                    <p className="text-sm text-slate-600">
                      &ldquo;Your glucose is 92 mg/dL, which is within the normal
                      fasting range of 70&ndash;100 mg/dL.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Powered by AI ---- */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              AI assistant
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Intelligence built in.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              An AI chatbot helps patients understand their lab results in plain
              language — what tests measure, what reference ranges mean, and how
              to prepare for upcoming tests.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-2">
            {aiFeatures.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <Sparkles className="size-4" />
                </span>
                <span className="text-sm font-medium text-slate-700">{feature}</span>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-xs text-slate-500">
            The AI assistant provides general health information only. It is not a
            substitute for professional medical advice. Always consult your
            healthcare provider for personalized guidance.
          </p>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section id="faq" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">FAQ</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Common questions, answered.
            </h2>
          </div>

          <div className="mx-auto mt-14 max-w-3xl divide-y divide-slate-200">
            {faqItems.map((item) => (
              <div key={item.question} className="py-6 first:pt-0 last:pb-0">
                <h3 className="text-base font-semibold text-slate-950">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Give your lab the operating system it deserves.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400">
              Replace fragmented workflows with one structured, auditable
              workspace — and start seeing results from day one.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-12 rounded-lg bg-white px-6 text-base text-slate-950 hover:bg-slate-100" asChild>
                <Link href="/signup">
                  Start your lab workspace
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 rounded-lg border-slate-700 bg-transparent px-6 text-base text-slate-300 hover:bg-white/5 hover:text-white"
                asChild
              >
                <Link href="/portal">
                  Access Patient Portal
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <LogoMark compact />
          <nav className="flex flex-wrap items-center gap-6">
            {navLinks.map((link) => (
              <Link key={`f-${link.href}`} href={link.href} className="hover:text-slate-950">
                {link.label}
              </Link>
            ))}
            <Link href="/portal" className="hover:text-slate-950">
              Patient Portal
            </Link>
            <Link href="/login" className="font-medium text-slate-950 hover:text-primary">
              Sign in
            </Link>
          </nav>
        </div>
        <div className="border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-6 py-4 lg:px-8">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} LabFlow Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
