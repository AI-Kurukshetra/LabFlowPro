import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardPlus,
  Clock,
  FileCheck2,
  FileOutput,
  FlaskConical,
  Search,
  Sparkles,
  TestTube2,
  TrendingUp,
  UserPlus,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/workspace/metric-card";
import { StatusBadge } from "@/components/workspace/status-badge";
import { dashboardMetrics } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/env";
import type { UserRole } from "@/lib/types/database";
import type { MetricCardData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// ---------- types ----------

type DashboardData = {
  profile: { full_name: string | null; role: UserRole } | null;
  samplesInFlight: number;
  urgentOrders: number;
  reviewQueue: number;
  releasedToday: number;
  totalPatients: number;
  totalOrders: number;
  totalSpecimens: number;
  totalReports: number;
  urgentOrderRows: UrgentOrderRow[];
  recentSpecimens: RecentSpecimenRow[];
  recentResults: RecentResultRow[];
  recentPatients: RecentPatientRow[];
};

type UrgentOrderRow = {
  id: string;
  order_ref: string;
  patient_name: string;
  panel_name: string;
  priority: string;
  status: string;
};

type RecentSpecimenRow = {
  id: string;
  specimen_ref: string;
  order_ref: string;
  patient_name: string;
  type: string;
  status: string;
};

type RecentResultRow = {
  id: string;
  order_ref: string;
  patient_name: string;
  panel_name: string;
  status: string;
};

type RecentPatientRow = {
  id: string;
  patient_ref: string;
  full_name: string;
  status: string;
  created_at: string;
};

// ---------- data fetching ----------

async function getDashboardData(): Promise<DashboardData | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const { getCurrentProfile } = await import("@/lib/queries/profiles");

    const supabase = await createServerSupabaseClient();
    const profile = await getCurrentProfile(supabase);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [
      samplesInFlightRes,
      urgentOrdersRes,
      reviewQueueRes,
      releasedTodayRes,
      totalPatientsRes,
      totalOrdersRes,
      totalSpecimensRes,
      totalReportsRes,
      urgentOrderRowsRes,
      recentSpecimensRes,
      recentResultsRes,
      recentPatientsRes,
    ] = await Promise.all([
      supabase.from("specimens").select("id", { count: "exact", head: true }).in("status", ["received", "processing"]),
      supabase.from("orders").select("id", { count: "exact", head: true }).in("priority", ["urgent", "stat"]).neq("status", "released"),
      supabase.from("results").select("order_id").eq("status", "review"),
      supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "released").gte("released_at", todayISO),
      supabase.from("patients").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("specimens").select("id", { count: "exact", head: true }),
      supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "released"),
      supabase.from("orders").select("id, order_ref, priority, status, patients(full_name), panels(name)").in("priority", ["urgent", "stat"]).neq("status", "released").order("created_at", { ascending: false }).limit(5),
      supabase.from("specimens").select("id, specimen_ref, type, status, orders(order_ref, patients(full_name))").eq("status", "received").order("created_at", { ascending: false }).limit(5),
      supabase.from("orders").select("id, order_ref, status, patients(full_name), panels(name)").eq("status", "review").order("created_at", { ascending: false }).limit(5),
      supabase.from("patients").select("id, patient_ref, full_name, status, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    const reviewOrderIds = new Set((reviewQueueRes.data ?? []).map((r: { order_id: string }) => r.order_id));

    const urgentOrderRows: UrgentOrderRow[] = (urgentOrderRowsRes.data ?? []).map((o: Record<string, unknown>) => {
      const patient = o.patients as { full_name: string } | null;
      const panel = o.panels as { name: string } | null;
      return { id: o.id as string, order_ref: o.order_ref as string, patient_name: patient?.full_name ?? "—", panel_name: panel?.name ?? "—", priority: o.priority as string, status: o.status as string };
    });

    const recentSpecimens: RecentSpecimenRow[] = (recentSpecimensRes.data ?? []).map((s: Record<string, unknown>) => {
      const order = s.orders as { order_ref: string; patients: { full_name: string } | null } | null;
      return { id: s.id as string, specimen_ref: s.specimen_ref as string, order_ref: order?.order_ref ?? "—", patient_name: order?.patients?.full_name ?? "—", type: s.type as string, status: s.status as string };
    });

    const recentResults: RecentResultRow[] = (recentResultsRes.data ?? []).map((o: Record<string, unknown>) => {
      const patient = o.patients as { full_name: string } | null;
      const panel = o.panels as { name: string } | null;
      return { id: o.id as string, order_ref: o.order_ref as string, patient_name: patient?.full_name ?? "—", panel_name: panel?.name ?? "—", status: "review" };
    });

    const recentPatients: RecentPatientRow[] = (recentPatientsRes.data ?? []).map((p: Record<string, unknown>) => ({
      id: p.id as string, patient_ref: p.patient_ref as string, full_name: p.full_name as string, status: p.status as string, created_at: p.created_at as string,
    }));

    return {
      profile: { full_name: profile.full_name, role: profile.role },
      samplesInFlight: samplesInFlightRes.count ?? 0,
      urgentOrders: urgentOrdersRes.count ?? 0,
      reviewQueue: reviewOrderIds.size,
      releasedToday: releasedTodayRes.count ?? 0,
      totalPatients: totalPatientsRes.count ?? 0,
      totalOrders: totalOrdersRes.count ?? 0,
      totalSpecimens: totalSpecimensRes.count ?? 0,
      totalReports: totalReportsRes.count ?? 0,
      urgentOrderRows,
      recentSpecimens,
      recentResults,
      recentPatients,
    };
  } catch {
    return null;
  }
}

// ---------- helpers ----------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getRoleTagline(role: UserRole): string {
  const taglines: Record<UserRole, string> = {
    admin: "Full operations overview at your fingertips.",
    intake: "Your intake queue is ready.",
    technician: "Your processing workbench awaits.",
    reviewer: "Your review pipeline is loaded.",
    patient: "Welcome to your patient portal.",
  };
  return taglines[role];
}

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  admin: "bg-teal-100 text-teal-700 border-teal-200",
  intake: "bg-sky-100 text-sky-700 border-sky-200",
  technician: "bg-amber-100 text-amber-700 border-amber-200",
  reviewer: "bg-violet-100 text-violet-700 border-violet-200",
  patient: "bg-rose-100 text-rose-700 border-rose-200",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

type QuickAction = { title: string; description: string; href: string; icon: LucideIcon; color: string };

function getQuickActions(role: UserRole): QuickAction[] {
  const all: Record<UserRole, QuickAction[]> = {
    admin: [
      { title: "Register Patient", description: "New patient record", href: "/patients/new", icon: UserPlus, color: "text-sky-600 bg-sky-50" },
      { title: "Create Order", description: "New lab order", href: "/orders/new", icon: ClipboardPlus, color: "text-teal-600 bg-teal-50" },
      { title: "Review Results", description: "Verify pending results", href: "/results?status=review", icon: Search, color: "text-violet-600 bg-violet-50" },
      { title: "Generate Report", description: "Package approved results", href: "/reports/new", icon: FileOutput, color: "text-emerald-600 bg-emerald-50" },
    ],
    intake: [
      { title: "Register Patient", description: "New patient record", href: "/patients/new", icon: UserPlus, color: "text-sky-600 bg-sky-50" },
      { title: "Create Order", description: "New lab order", href: "/orders/new", icon: ClipboardPlus, color: "text-teal-600 bg-teal-50" },
      { title: "Collect Specimen", description: "Log collection", href: "/specimens/new", icon: TestTube2, color: "text-amber-600 bg-amber-50" },
    ],
    technician: [
      { title: "Process Specimens", description: "Work the queue", href: "/specimens?status=received", icon: FlaskConical, color: "text-amber-600 bg-amber-50" },
      { title: "Enter Results", description: "Record test values", href: "/results", icon: FileCheck2, color: "text-teal-600 bg-teal-50" },
    ],
    reviewer: [
      { title: "Review Results", description: "Verify pending results", href: "/results?status=review", icon: Search, color: "text-violet-600 bg-violet-50" },
      { title: "Generate Report", description: "Package approved results", href: "/reports/new", icon: FileOutput, color: "text-emerald-600 bg-emerald-50" },
    ],
    patient: [],
  };
  return all[role];
}

// ---------- component ----------

export default async function DashboardPage() {
  const data = await getDashboardData();
  const isPreview = !data;
  const role: UserRole = data?.profile?.role ?? "admin";
  const userName = data?.profile?.full_name ?? "there";
  const firstName = userName.split(" ")[0];

  const metrics: (MetricCardData & { accentColor?: string; href?: string; icon?: LucideIcon })[] = isPreview
    ? dashboardMetrics.map((m, i) => ({
        ...m,
        accentColor: ["border-t-sky-500", "border-t-amber-500", "border-t-violet-500", "border-t-emerald-500"][i],
        href: ["/specimens?status=processing", "/orders?priority=urgent", "/results?status=review", "/reports?status=released"][i],
        icon: [TestTube2, AlertTriangle, Search, FileCheck2][i],
      }))
    : [
        { label: "Samples In Flight", value: String(data.samplesInFlight), helper: "Received + processing", accentColor: "border-t-sky-500", href: "/specimens?status=processing", icon: TestTube2 },
        { label: "Urgent Orders", value: String(data.urgentOrders), helper: "Urgent & STAT, not released", accentColor: "border-t-amber-500", href: "/orders?priority=urgent", icon: AlertTriangle },
        { label: "Review Queue", value: String(data.reviewQueue), helper: "Orders pending verification", accentColor: "border-t-violet-500", href: "/results?status=review", icon: Search },
        { label: "Released Today", value: String(data.releasedToday), helper: "Reports released since midnight", accentColor: "border-t-emerald-500", href: "/reports?status=released", icon: FileCheck2 },
      ];

  const quickActions = getQuickActions(role);
  const urgentOrderRows = isPreview ? [] : data.urgentOrderRows;
  const recentSpecimens = isPreview ? [] : data.recentSpecimens;
  const recentResults = isPreview ? [] : data.recentResults;
  const recentPatients = isPreview ? [] : data.recentPatients;

  return (
    <div className="space-y-6">
      {/* ── Welcome ── */}
      <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-5 py-6 text-white sm:px-8 sm:py-7">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 size-48 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {getGreeting()}, {firstName}
              </h1>
              <Badge variant="outline" className={cn("border text-xs capitalize", ROLE_BADGE_COLORS[role])}>
                {role}
              </Badge>
            </div>
            <p className="text-sm text-slate-300">
              {getRoleTagline(role)}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300">
            <CalendarDays className="size-4 text-slate-400" />
            {formatDate(new Date())}
          </div>
        </div>

        {/* Totals strip */}
        {!isPreview && (
          <div className="relative mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 sm:grid-cols-4">
            {[
              { label: "Patients", value: data.totalPatients, href: "/patients" },
              { label: "Orders", value: data.totalOrders, href: "/orders" },
              { label: "Specimens", value: data.totalSpecimens, href: "/specimens" },
              { label: "Reports", value: data.totalReports, href: "/reports" },
            ].map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="group flex items-center justify-between rounded-lg px-1 transition-colors hover:bg-white/5"
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums">{stat.value}</p>
                </div>
                <ArrowUpRight className="size-3.5 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Key metrics ── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.label} metric={m} accentColor={m.accentColor} href={m.href} icon={m.icon} />
        ))}
      </section>

      {/* ── Quick actions ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-amber-500" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Quick actions</p>
        </div>
        <div className={cn("grid gap-3", quickActions.length <= 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4")}>
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} className="group">
              <Card className="h-full border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105", a.color)}>
                    <a.icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.description}</p>
                  </div>
                  <ArrowRight className="ml-auto size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Urgent orders ── */}
      {urgentOrderRows.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-amber-100">
                <AlertTriangle className="size-3.5 text-amber-600" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Urgent orders
              </p>
              <Badge variant="secondary" className="text-xs">{urgentOrderRows.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders?priority=urgent" className="text-xs">
                View all <ArrowRight className="ml-1 size-3" />
              </Link>
            </Button>
          </div>
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-xs">Order</TableHead>
                  <TableHead className="text-xs">Patient</TableHead>
                  <TableHead className="text-xs">Panel</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {urgentOrderRows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-sm font-medium text-slate-900">{row.order_ref}</TableCell>
                    <TableCell className="text-sm font-medium text-slate-700">{row.patient_name}</TableCell>
                    <TableCell className="text-sm text-slate-600">{row.panel_name}</TableCell>
                    <TableCell><StatusBadge status={row.priority} /></TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                    <TableCell>
                      <Link href={`/orders/${row.id}`} className="text-slate-400 hover:text-primary">
                        <ArrowRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </Card>
        </section>
      )}

      {/* ── Pending items (role-based) ── */}
      {!isPreview && (
        <RoleBasedActivity
          role={role}
          recentSpecimens={recentSpecimens}
          recentResults={recentResults}
          recentPatients={recentPatients}
        />
      )}

      {/* ── Workflow status strip ── */}
      {!isPreview && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="size-4 text-teal-500" />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Workflow pipeline</p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { label: "Draft", icon: Clock, count: null, color: "text-slate-500 bg-slate-100" },
              { label: "Collected", icon: TestTube2, count: null, color: "text-sky-600 bg-sky-50" },
              { label: "Processing", icon: FlaskConical, count: null, color: "text-amber-600 bg-amber-50" },
              { label: "Review", icon: Search, count: null, color: "text-violet-600 bg-violet-50" },
              { label: "Released", icon: CheckCircle2, count: null, color: "text-emerald-600 bg-emerald-50" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <span className={cn("flex size-7 items-center justify-center rounded-md", step.color)}>
                    <step.icon className="size-3.5" />
                  </span>
                  <span className="font-medium text-slate-700 whitespace-nowrap">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <TrendingUp className="size-4 shrink-0 text-slate-300" />
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Every order follows this pipeline: Draft → Collected → Processing → Review → Released
          </p>
        </section>
      )}
    </div>
  );
}

// ---------- role-based activity ----------

function RoleBasedActivity({ role, recentSpecimens, recentResults, recentPatients }: {
  role: UserRole;
  recentSpecimens: RecentSpecimenRow[];
  recentResults: RecentResultRow[];
  recentPatients: RecentPatientRow[];
}) {
  const showSpecimens = (role === "technician" || role === "admin") && recentSpecimens.length > 0;
  const showResults = (role === "reviewer" || role === "admin") && recentResults.length > 0;
  const showPatients = (role === "intake" || role === "admin") && recentPatients.length > 0;

  if (!showSpecimens && !showResults && !showPatients) return null;

  const isAdmin = role === "admin";

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="size-4 text-teal-500" />
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pending items</p>
      </div>
      <div className={cn(isAdmin ? "grid gap-4 lg:grid-cols-2" : "space-y-4")}>
        {showSpecimens && <SpecimensCard specimens={recentSpecimens} />}
        {showResults && <ResultsCard results={recentResults} />}
        {showPatients && <PatientsCard patients={recentPatients} />}
      </div>
    </section>
  );
}

function SpecimensCard({ specimens }: { specimens: RecentSpecimenRow[] }) {
  return (
    <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/60 py-3 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-amber-100">
              <FlaskConical className="size-3.5 text-amber-600" />
            </span>
            <CardTitle className="text-sm font-semibold text-slate-800">Specimens awaiting processing</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/specimens?status=received" className="text-xs">View all <ArrowRight className="ml-1 size-3" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
        <Table>
          <TableBody>
            {specimens.map((s) => (
              <TableRow key={s.id} className="hover:bg-slate-50/50">
                <TableCell className="font-mono text-sm text-slate-700">{s.specimen_ref}</TableCell>
                <TableCell className="text-sm text-slate-600">{s.order_ref}</TableCell>
                <TableCell className="text-sm font-medium text-slate-700">{s.patient_name}</TableCell>
                <TableCell><StatusBadge status={s.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsCard({ results }: { results: RecentResultRow[] }) {
  return (
    <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/60 py-3 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-violet-100">
              <FileCheck2 className="size-3.5 text-violet-600" />
            </span>
            <CardTitle className="text-sm font-semibold text-slate-800">Results pending review</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/results?status=review" className="text-xs">View all <ArrowRight className="ml-1 size-3" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
        <Table>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <Link href={`/results/order/${r.id}`} className="font-mono text-sm text-primary hover:underline">{r.order_ref}</Link>
                </TableCell>
                <TableCell className="text-sm font-medium text-slate-700">{r.patient_name}</TableCell>
                <TableCell className="text-sm text-slate-600">{r.panel_name}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function PatientsCard({ patients }: { patients: RecentPatientRow[] }) {
  return (
    <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/60 py-3 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-sky-100">
              <UserPlus className="size-3.5 text-sky-600" />
            </span>
            <CardTitle className="text-sm font-semibold text-slate-800">Recent patients</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/patients" className="text-xs">View all <ArrowRight className="ml-1 size-3" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
        <Table>
          <TableBody>
            {patients.map((p) => (
              <TableRow key={p.id} className="hover:bg-slate-50/50">
                <TableCell className="font-mono text-sm text-slate-700">{p.patient_ref}</TableCell>
                <TableCell className="text-sm font-medium text-slate-700">{p.full_name}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
