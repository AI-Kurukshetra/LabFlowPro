import Link from "next/link";
import { Eye, FileOutput, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPatientProfile, getPatientReports } from "@/lib/queries/portal";

const FORMAT_LABELS: Record<string, string> = {
  pdf: "PDF",
  pdf_csv: "PDF + CSV",
  pdf_json: "PDF + JSON",
};

const FORMAT_BADGE_COLORS: Record<string, string> = {
  pdf: "bg-sky-50 text-sky-700 border-sky-200",
  pdf_csv: "bg-amber-50 text-amber-700 border-amber-200",
  pdf_json: "bg-violet-50 text-violet-700 border-violet-200",
};

export default async function PortalReportsPage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getPatientProfile(supabase);
  const patient = profile.patients!;

  let reports: Awaited<ReturnType<typeof getPatientReports>> = [];
  try {
    reports = await getPatientReports(supabase, patient.id);
  } catch {
    // Use empty list on error
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Reports
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">My Reports</h1>
        <p className="mt-1 text-sm text-slate-600">
          View your released lab reports
        </p>
      </div>

      {/* Reports table */}
      {reports.length === 0 ? (
        <Card className="border border-slate-200 rounded-xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <FileOutput className="size-6" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-950">
              No reports available yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Your lab reports will appear here once they have been generated and
              released by your healthcare provider.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Report</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>View</TableHead>
                <TableHead className="text-right">AI Help</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const releasedDate = report.released_at
                  ? new Date(report.released_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : new Date(report.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                return (
                  <TableRow key={report.id} className="transition-colors hover:bg-slate-50">
                    <TableCell>
                      <a
                        href={`/api/reports/${report.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm font-medium text-primary hover:underline"
                      >
                        {report.report_ref}
                      </a>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {releasedDate}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          FORMAT_BADGE_COLORS[report.format] ??
                          "bg-slate-50 text-slate-600 border-slate-200"
                        }
                      >
                        {FORMAT_LABELS[report.format] ?? report.format.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        Released
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/api/reports/${report.id}/download`} target="_blank" rel="noopener noreferrer">
                          <Eye className="size-3.5" />
                          View
                        </a>
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/portal/chat?prompt=${encodeURIComponent(`Tell me about my report ${report.report_ref} released on ${releasedDate}. What do the results mean?`)}`}>
                          <MessageCircle className="size-3.5" />
                          Ask AI
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
