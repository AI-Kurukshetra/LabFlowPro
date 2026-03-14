import Link from "next/link";
import { redirect } from "next/navigation";
import { FileOutput, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterBar } from "@/components/workspace/filter-bar";
import { MetricCard } from "@/components/workspace/metric-card";
import { ModulePage } from "@/components/workspace/module-page";
import { Pagination } from "@/components/workspace/pagination";
import { StatusBadge } from "@/components/workspace/status-badge";
import { isSupabaseConfigured } from "@/lib/env";
import { modulePageData } from "@/lib/mock-data";
import { getReports, getReportMetrics } from "@/lib/queries/reports";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { hasPermission } from "@/lib/rbac/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

const PAGE_SIZE = 10;

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const formatBadgeColors: Record<string, string> = {
  pdf: "bg-red-100 text-red-700 border-red-200",
  pdf_csv: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pdf_json: "bg-sky-100 text-sky-700 border-sky-200",
};

function formatFormatLabel(format: string) {
  switch (format) {
    case "pdf":
      return "PDF";
    case "pdf_csv":
      return "PDF + CSV";
    case "pdf_json":
      return "PDF + JSON";
    default:
      return format.toUpperCase();
  }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  if (!isSupabaseConfigured()) {
    return <ModulePage data={modulePageData.reports} />;
  }

  const params = await searchParams;
  const statusFilter = typeof params.status === "string" ? params.status : undefined;
  const searchFilter = typeof params.search === "string" ? params.search : undefined;
  const currentPage = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);

  const supabase = await createServerSupabaseClient();

  let canGenerate = false;
  try {
    const profile = await getCurrentProfile(supabase);
    if (!hasPermission(profile.role as UserRole, "reports:list")) {
      redirect("/dashboard");
    }
    canGenerate = hasPermission(profile.role as UserRole, "reports:generate");
  } catch {
    redirect("/dashboard");
  }
  const [{ data: reports, count: totalCount }, metrics] = await Promise.all([
    getReports(supabase, {
      status: statusFilter,
      search: searchFilter,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    getReportMetrics(supabase),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const statusFilterOptions = [
    { value: "queued", label: "Queued" },
    { value: "formatting", label: "Formatting" },
    { value: "release_ready", label: "Release Ready" },
    { value: "released", label: "Released" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Reports
            </h1>
            <Badge variant="secondary" className="text-xs">
              {totalCount} total
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Generate and release reports from approved results.
          </p>
        </div>
        {canGenerate && (
          <Button asChild>
            <Link href="/reports/new">
              <Plus className="size-4" data-icon="inline-start" />
              Generate Report
            </Link>
          </Button>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          metric={{
            label: "Generated today",
            value: String(metrics.generatedToday),
            helper: "Finalized report outputs",
          }}
          accentColor="border-t-teal-500"
          href="/reports?status=released"
        />
        <MetricCard
          metric={{
            label: "Versioned edits",
            value: String(metrics.versionedEdits),
            helper: "Post-release revisions tracked",
          }}
          accentColor="border-t-amber-500"
          href="/reports?status=released"
        />
        <MetricCard
          metric={{
            label: "Export channels",
            value: String(metrics.formatCount),
            helper: "PDF plus CSV or JSON",
          }}
          accentColor="border-t-sky-500"
        />
      </section>

      <FilterBar
        filters={[
          {
            key: "status",
            label: "All statuses",
            options: statusFilterOptions,
          },
        ]}
        searchPlaceholder="Search by report ref..."
      />

      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>Report Ref</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Released At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <FileOutput className="size-6" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-700">No reports found</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Reports are generated once results are approved.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Link
                      href={`/reports/${report.id}`}
                      className="font-mono text-sm font-medium text-primary hover:underline"
                    >
                      {report.report_ref}
                    </Link>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {report.patients.full_name}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-600">
                    {report.orders.order_ref}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={formatBadgeColors[report.format] ?? "bg-slate-100 text-slate-600 border-slate-200"}
                    >
                      {formatFormatLabel(report.format)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium text-slate-700">
                      {report.version}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={report.status} />
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatDate(report.released_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
