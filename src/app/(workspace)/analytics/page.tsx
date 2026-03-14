import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileOutput,
  FlaskConical,
  Percent,
  Search,
  TestTube2,
  TrendingUp,
  Users2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/workspace/metric-card";
import { StatusBadge } from "@/components/workspace/status-badge";
import { isSupabaseConfigured } from "@/lib/env";
import { hasPermission } from "@/lib/rbac/permissions";
import type { AnalyticsData } from "@/lib/queries/analytics";

// ---------- data fetching ----------

async function getPageData(): Promise<{
  data: AnalyticsData | null;
  authorized: boolean;
}> {
  if (!isSupabaseConfigured()) return { data: null, authorized: false };

  try {
    const { createServerSupabaseClient } = await import(
      "@/lib/supabase/server"
    );
    const { getCurrentProfile } = await import("@/lib/queries/profiles");
    const { getAnalyticsData } = await import("@/lib/queries/analytics");

    const supabase = await createServerSupabaseClient();
    const profile = await getCurrentProfile(supabase);

    if (!hasPermission(profile.role, "analytics:access")) {
      return { data: null, authorized: false };
    }

    const data = await getAnalyticsData(supabase);
    return { data, authorized: true };
  } catch {
    return { data: null, authorized: false };
  }
}

// ---------- helpers ----------

function formatTurnaround(minutes: number): string {
  if (minutes <= 0) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFormatLabel(format: string): string {
  const map: Record<string, string> = {
    pdf: "PDF",
    pdf_csv: "PDF + CSV",
    pdf_json: "PDF + JSON",
  };
  return map[format] ?? format;
}

function formatSpecimenType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------- sub-components ----------

const PIPELINE_STAGES = [
  { key: "draft", label: "Draft", color: "bg-slate-500" },
  { key: "collected", label: "Collected", color: "bg-sky-500" },
  { key: "in_process", label: "In Process", color: "bg-amber-500" },
  { key: "review", label: "Review", color: "bg-violet-500" },
  { key: "released", label: "Released", color: "bg-emerald-500" },
] as const;

function PipelineVisualization({
  pipeline,
}: {
  pipeline: Record<string, number>;
}) {
  const maxCount = Math.max(...Object.values(pipeline), 1);

  return (
    <div className="space-y-3">
      {PIPELINE_STAGES.map((stage) => {
        const count = pipeline[stage.key] ?? 0;
        const percentage = (count / maxCount) * 100;
        return (
          <div key={stage.key} className="flex items-center gap-3">
            <span className="w-24 text-sm font-medium text-slate-700">
              {stage.label}
            </span>
            <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
              <div
                className={`h-full ${stage.color} rounded-lg transition-all`}
                style={{ width: `${Math.max(percentage, count > 0 ? 2 : 0)}%` }}
              />
            </div>
            <span className="w-12 text-right font-mono text-sm font-bold text-slate-900">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBarChart({
  data,
  colors,
  formatLabel,
}: {
  data: Record<string, number>;
  colors: Record<string, string>;
  formatLabel?: (key: string) => string;
}) {
  const maxCount = Math.max(...Object.values(data), 1);
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-3">
      {entries.map(([key, count]) => {
        const percentage = (count / maxCount) * 100;
        const color = colors[key] ?? "bg-slate-400";
        const label = formatLabel ? formatLabel(key) : key;
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-28 text-sm font-medium text-slate-700 truncate">
              {label}
            </span>
            <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
              <div
                className={`h-full ${color} rounded-lg transition-all`}
                style={{
                  width: `${Math.max(percentage, count > 0 ? 2 : 0)}%`,
                }}
              />
            </div>
            <span className="w-10 text-right font-mono text-sm font-bold text-slate-900">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className={`rounded-xl border-t-2 ${color} border border-slate-200/80 bg-white p-4 shadow-sm`}
    >
      <p className="text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

// ---------- tab sections ----------

function OrderPipelineTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Order Pipeline (Last 30 Days)
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Distribution of orders across workflow stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PipelineVisualization pipeline={data.orderPipeline} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 py-3 px-5">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-xs">Order</TableHead>
                  <TableHead className="text-xs">Patient</TableHead>
                  <TableHead className="text-xs">Panel</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-slate-400 py-8"
                    >
                      No orders in the last 30 days
                    </TableCell>
                  </TableRow>
                )}
                {data.recentOrders.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-sm font-medium text-slate-900">
                      <Link
                        href={`/orders/${row.id}`}
                        className="text-primary hover:underline"
                      >
                        {row.order_ref}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-700">
                      {row.patient_name}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {row.panel_name}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(row.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const SPECIMEN_TYPE_COLORS: Record<string, string> = {
  serum: "bg-amber-500",
  plasma: "bg-sky-500",
  whole_blood: "bg-red-500",
  urine: "bg-yellow-500",
  csf: "bg-violet-500",
  other: "bg-slate-400",
};

function SpecimenAnalyticsTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Received"
          value={data.specimenStatusCounts["received"] ?? 0}
          color="border-t-sky-500"
        />
        <StatCard
          label="Processing"
          value={data.specimenStatusCounts["processing"] ?? 0}
          color="border-t-amber-500"
        />
        <StatCard
          label="Completed"
          value={data.specimenStatusCounts["completed"] ?? 0}
          color="border-t-emerald-500"
        />
        <StatCard
          label="Rejected"
          value={data.specimenStatusCounts["rejected"] ?? 0}
          color="border-t-red-500"
        />
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Specimen Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HorizontalBarChart
            data={data.specimenTypeCounts}
            colors={SPECIMEN_TYPE_COLORS}
            formatLabel={formatSpecimenType}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 py-3 px-5">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Top Rejection Reasons
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-xs">Reason</TableHead>
                    <TableHead className="text-xs text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rejectionReasons.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center text-sm text-slate-400 py-8"
                      >
                        No rejections recorded
                      </TableCell>
                    </TableRow>
                  )}
                  {data.rejectionReasons.map((r) => (
                    <TableRow key={r.reason} className="hover:bg-slate-50/50">
                      <TableCell className="text-sm text-slate-700">
                        {r.reason}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold text-slate-900">
                        {r.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 py-3 px-5">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Recent Rejected Specimens
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-xs">Specimen</TableHead>
                    <TableHead className="text-xs">Patient</TableHead>
                    <TableHead className="text-xs">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentRejectedSpecimens.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-sm text-slate-400 py-8"
                      >
                        No rejected specimens
                      </TableCell>
                    </TableRow>
                  )}
                  {data.recentRejectedSpecimens.map((s) => (
                    <TableRow key={s.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-sm font-medium text-slate-900">
                        {s.specimen_ref}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {s.patient_name}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {s.rejection_reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResultMetricsTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Draft"
          value={data.resultStatusCounts["draft"] ?? 0}
          color="border-t-sky-500"
        />
        <StatCard
          label="Review"
          value={data.resultStatusCounts["review"] ?? 0}
          color="border-t-violet-500"
        />
        <StatCard
          label="Approved"
          value={data.resultStatusCounts["approved"] ?? 0}
          color="border-t-emerald-500"
        />
        <StatCard
          label="Released"
          value={data.resultStatusCounts["released"] ?? 0}
          color="border-t-teal-500"
        />
        <StatCard
          label="Returned"
          value={data.resultStatusCounts["returned"] ?? 0}
          color="border-t-red-500"
        />
      </div>

      <Card className="border-t-2 border-t-amber-500 border border-slate-200 bg-white shadow-sm">
        <CardContent className="flex items-center gap-5 p-6">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <AlertTriangle className="size-7 text-amber-600" />
          </span>
          <div>
            <p className="text-3xl font-bold tracking-tight text-slate-900">
              {formatPct(data.abnormalRate)}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Abnormal Rate (Last 30 Days)
            </p>
            <p className="text-xs text-slate-400">
              Percentage of results flagged as abnormal across all tests
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 py-3 px-5">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Tests with Highest Abnormal Rate
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Valuable clinical insight for quality monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-xs">Test Name</TableHead>
                  <TableHead className="text-xs text-right">
                    Total Results
                  </TableHead>
                  <TableHead className="text-xs text-right">
                    Abnormal
                  </TableHead>
                  <TableHead className="text-xs text-right">
                    Abnormal %
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topAbnormalTests.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-slate-400 py-8"
                    >
                      No abnormal results recorded
                    </TableCell>
                  </TableRow>
                )}
                {data.topAbnormalTests.map((t) => (
                  <TableRow key={t.test_name} className="hover:bg-slate-50/50">
                    <TableCell className="text-sm font-medium text-slate-800">
                      {t.test_name}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-slate-600">
                      {t.total}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-red-600">
                      {t.abnormal_count}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          t.abnormal_pct > 20
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }
                      >
                        {formatPct(t.abnormal_pct)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StaffActivityTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 py-3 px-5">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Staff Workload Overview
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Activity summary for each team member
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs text-right">
                    Results Reviewed
                  </TableHead>
                  <TableHead className="text-xs">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.staffActivity.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-slate-400 py-8"
                    >
                      No staff data available
                    </TableCell>
                  </TableRow>
                )}
                {data.staffActivity.map((s) => (
                  <TableRow key={s.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-sm font-medium text-slate-800">
                      {s.full_name}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.role} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-slate-900">
                      {s.results_reviewed}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {s.last_seen_at ? formatDate(s.last_seen_at) : "\u2014"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const REPORT_FORMAT_COLORS: Record<string, string> = {
  pdf: "bg-sky-500",
  pdf_csv: "bg-emerald-500",
  pdf_json: "bg-violet-500",
};

function ReportOutputTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Queued"
          value={data.reportStatusCounts["queued"] ?? 0}
          color="border-t-sky-500"
        />
        <StatCard
          label="Formatting"
          value={data.reportStatusCounts["formatting"] ?? 0}
          color="border-t-amber-500"
        />
        <StatCard
          label="Release Ready"
          value={data.reportStatusCounts["release_ready"] ?? 0}
          color="border-t-violet-500"
        />
        <StatCard
          label="Released"
          value={data.reportStatusCounts["released"] ?? 0}
          color="border-t-emerald-500"
        />
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800">
            Report Format Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HorizontalBarChart
            data={data.reportFormatCounts}
            colors={REPORT_FORMAT_COLORS}
            formatLabel={formatFormatLabel}
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 py-3 px-5">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-xs">Report</TableHead>
                  <TableHead className="text-xs">Patient</TableHead>
                  <TableHead className="text-xs">Format</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Released</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentReports.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-slate-400 py-8"
                    >
                      No reports found
                    </TableCell>
                  </TableRow>
                )}
                {data.recentReports.map((r) => (
                  <TableRow key={r.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-sm font-medium text-slate-900">
                      {r.report_ref}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-700">
                      {r.patient_name}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatFormatLabel(r.format)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {r.released_at ? formatDate(r.released_at) : "\u2014"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- main page ----------

export default async function AnalyticsPage() {
  const { data, authorized } = await getPageData();

  if (!authorized || !data) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <XCircle className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-3 text-lg font-semibold text-slate-800">
            Access Restricted
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Analytics is available to administrators only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <section>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-teal-100">
            <BarChart3 className="size-5 text-teal-600" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Analytics &amp; Insights
            </h1>
            <p className="text-sm text-slate-500">
              Real-time operational performance across your laboratory
            </p>
          </div>
        </div>
      </section>

      {/* ── KPI Strip — Row 1: Volume ── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          metric={{
            label: "Total Patients",
            value: String(data.totalPatients),
            helper: "Active patient records",
          }}
          accentColor="border-t-sky-500"
          href="/patients"
          icon={Users2}
        />
        <MetricCard
          metric={{
            label: "Total Orders (30d)",
            value: String(data.totalOrders30d),
            helper: "Orders created in last 30 days",
          }}
          accentColor="border-t-teal-500"
          href="/orders"
          icon={Activity}
        />
        <MetricCard
          metric={{
            label: "Total Specimens (30d)",
            value: String(data.totalSpecimens30d),
            helper: "Specimens in last 30 days",
          }}
          accentColor="border-t-amber-500"
          href="/specimens"
          icon={TestTube2}
        />
        <MetricCard
          metric={{
            label: "Total Results (30d)",
            value: String(data.totalResults30d),
            helper: "Results entered in last 30 days",
          }}
          accentColor="border-t-violet-500"
          href="/results"
          icon={FileCheck2}
        />
      </section>

      {/* ── KPI Strip — Row 2: Performance ── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          metric={{
            label: "Avg Turnaround",
            value: formatTurnaround(data.avgTurnaroundMinutes),
            helper: "Order creation to release (30d)",
          }}
          accentColor="border-t-emerald-500"
          href="/orders"
          icon={Clock}
        />
        <MetricCard
          metric={{
            label: "Approval Rate",
            value: formatPct(data.approvalRate),
            helper: "Approved or released vs total",
          }}
          accentColor="border-t-teal-500"
          href="/results"
          icon={CheckCircle2}
        />
        <MetricCard
          metric={{
            label: "Rejection Rate",
            value: formatPct(data.rejectionRate),
            helper: "Rejected specimens vs total",
          }}
          accentColor="border-t-red-500"
          href="/specimens?status=rejected"
          icon={XCircle}
        />
        <MetricCard
          metric={{
            label: "Reports Released (30d)",
            value: String(data.reportsReleased30d),
            helper: "Finalized report outputs",
          }}
          accentColor="border-t-sky-500"
          href="/reports"
          icon={FileOutput}
        />
      </section>

      {/* ── Tabs Section ── */}
      <Tabs defaultValue="pipeline" className="space-y-6">
        <TabsList className="w-full sm:w-auto flex-wrap h-auto gap-1">
          <TabsTrigger value="pipeline" className="gap-1.5">
            <TrendingUp className="size-3.5" />
            Order Pipeline
          </TabsTrigger>
          <TabsTrigger value="specimens" className="gap-1.5">
            <FlaskConical className="size-3.5" />
            Specimen Analytics
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5">
            <Search className="size-3.5" />
            Result Metrics
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-1.5">
            <Users2 className="size-3.5" />
            Staff Activity
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <FileOutput className="size-3.5" />
            Report Output
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <OrderPipelineTab data={data} />
        </TabsContent>

        <TabsContent value="specimens">
          <SpecimenAnalyticsTab data={data} />
        </TabsContent>

        <TabsContent value="results">
          <ResultMetricsTab data={data} />
        </TabsContent>

        <TabsContent value="staff">
          <StaffActivityTab data={data} />
        </TabsContent>

        <TabsContent value="reports">
          <ReportOutputTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
