import Link from "next/link";
import { ArrowLeft, FileDown, Printer } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/workspace/status-badge";
import { ReportStatusActions } from "@/components/workspace/report-status-actions";
import { ExportButtons } from "@/components/workspace/export-buttons";
import { isSupabaseConfigured } from "@/lib/env";
import { getReportById } from "@/lib/queries/reports";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { resolveReferenceRangesForTests } from "@/lib/queries/reference-ranges";
import { hasPermission } from "@/lib/rbac/permissions";
import { getResultsByOrderId } from "@/lib/queries/results";
import {
  formatResolvedReferenceRange,
  isValueAbnormal,
} from "@/lib/reference-ranges";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Test, UserRole } from "@/lib/types/database";

type ReportDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-36 shrink-0 text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value}</dd>
    </div>
  );
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  let userRole: UserRole = "technician";
  try {
    const profile = await getCurrentProfile(supabase);
    if (!hasPermission(profile.role as UserRole, "reports:list")) {
      redirect("/dashboard");
    }
    userRole = profile.role;
  } catch {
    redirect("/dashboard");
  }

  let report;
  try {
    report = await getReportById(supabase, id);
  } catch {
    notFound();
  }

  const results = await getResultsByOrderId(supabase, report.order_id);

  const order = report.orders;
  const patient = report.patients;
  const resolvedReferenceRanges = await resolveReferenceRangesForTests(
    supabase,
    results
      .map((result) => result.tests as Test | null)
      .filter((test): test is Test => test !== null),
    patient,
    order.collection_date ?? order.created_at,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/reports">
            <ArrowLeft className="size-4" data-icon="inline-start" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {report.report_ref}
          </h1>
          <p className="text-sm text-slate-600">Report details</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/reports/${report.id}/download`} target="_blank" rel="noopener noreferrer">
              <FileDown className="size-4" data-icon="inline-start" />
              Download Report
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/reports/${report.id}/download`} target="_blank" rel="noopener noreferrer">
              <Printer className="size-4" data-icon="inline-start" />
              Print Report
            </a>
          </Button>
          <StatusBadge status={report.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200/80 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Report information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <DetailRow label="Reference" value={report.report_ref} />
              <DetailRow label="Format" value={formatFormatLabel(report.format)} />
              <DetailRow label="Version" value={String(report.version)} />
              <DetailRow label="Status" value={<StatusBadge status={report.status} />} />
              <DetailRow label="Released at" value={formatDate(report.released_at)} />
              <DetailRow label="Created" value={formatDate(report.created_at)} />
            </dl>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Linked order</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <DetailRow
                label="Order ref"
                value={
                  <Link
                    href={`/orders/${order.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {order.order_ref}
                  </Link>
                }
              />
              <DetailRow label="Patient" value={patient.full_name} />
              <DetailRow label="Patient ref" value={patient.patient_ref} />
              <DetailRow label="Panel" value={order.panels?.name ?? "—"} />
              <DetailRow label="Priority" value={<StatusBadge status={order.priority} />} />
              <DetailRow label="Order status" value={<StatusBadge status={order.status} />} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200/80 bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Results summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Reference Range</TableHead>
                <TableHead>Abnormal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                    No results found for this order.
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result) => {
                  const test = result.tests as Test | null;
                  const range = result.test_id
                    ? resolvedReferenceRanges[result.test_id]
                    : null;
                  const isAbnormal = result.value
                    ? isValueAbnormal(result.value, range)
                    : result.is_abnormal === true;
                  return (
                    <TableRow key={result.id}>
                      <TableCell className="text-slate-700">
                        {test?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {result.value ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {result.unit ?? test?.unit ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {formatResolvedReferenceRange(
                          range,
                          result.unit ?? test?.unit ?? null,
                          { includeUnit: false },
                        ) || "—"}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {isAbnormal ? (
                          <span className="text-red-600">Yes</span>
                        ) : (
                          "No"
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={result.status} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/80 bg-white">
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportStatusActions
            reportId={report.id}
            currentStatus={report.status}
            userRole={userRole}
          />
        </CardContent>
      </Card>

      <Card className="border border-slate-200/80 bg-white">
        <CardHeader>
          <CardTitle className="text-base">Export Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-500">
            Download the results for this report in your preferred format.
          </p>
          <ExportButtons
            baseUrl={`/api/export/results/${report.order_id}`}
            formats={["csv", "json", "fhir"]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
