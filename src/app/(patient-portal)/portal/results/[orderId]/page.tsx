import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

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
import {
  getPatientProfile,
  getPatientResultsByOrderId,
} from "@/lib/queries/portal";
import { resolveReferenceRangesForTests } from "@/lib/queries/reference-ranges";
import {
  formatResolvedReferenceRange,
  getReferenceRangeContextLabel,
  isValueAbnormal,
} from "@/lib/reference-ranges";
import type { Test } from "@/lib/types/database";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function PortalResultDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  const supabase = await createServerSupabaseClient();
  const profile = await getPatientProfile(supabase);
  const patient = profile.patients!;

  let results: Awaited<ReturnType<typeof getPatientResultsByOrderId>> = [];
  let orderDate = "";
  let panelName = "";

  try {
    results = await getPatientResultsByOrderId(supabase, patient.id, orderId);
    if (results.length > 0) {
      const order = results[0].orders;
      orderDate = new Date(
        order.collection_date ?? order.created_at
      ).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      // Fetch order with panel info
      const { data: orderWithPanel } = await supabase
        .from("orders")
        .select("panels(name)")
        .eq("id", orderId)
        .single();

      const panels = orderWithPanel?.panels as unknown as { name: string } | null;
      panelName = panels?.name ?? "Individual tests";
    }
  } catch {
    // Handled below with empty results
  }

  const resolvedReferenceRanges =
    results.length > 0
      ? await resolveReferenceRangesForTests(
          supabase,
          results
            .map((result) => result.tests)
            .filter((test): test is Test => test !== null),
          patient,
          results[0].orders.collection_date ?? results[0].orders.created_at,
        )
      : {};

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/portal/results"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="size-4" />
        Back to results
      </Link>

      {/* Order info */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Result detail
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">{panelName}</h1>
        {orderDate && (
          <p className="mt-1 text-sm text-slate-600">{orderDate}</p>
        )}
      </div>

      {/* Results table */}
      {results.length === 0 ? (
        <Card className="border border-slate-200 rounded-xl shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500">
              No results found for this order.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Test Name</TableHead>
                <TableHead>Your Value</TableHead>
                <TableHead>Reference Range</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => {
                const resolvedRange = result.test_id
                  ? resolvedReferenceRanges[result.test_id]
                  : null;
                const isAbnormal = result.value
                  ? isValueAbnormal(result.value, resolvedRange)
                  : result.is_abnormal === true;
                const range = formatResolvedReferenceRange(
                  resolvedRange,
                  result.tests?.unit ?? result.unit,
                  { includeUnit: false },
                );
                const rangeLabel = getReferenceRangeContextLabel(resolvedRange);

                return (
                  <TableRow key={result.id} className="transition-colors hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-950">
                      {result.tests?.name ?? "Unknown test"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          isAbnormal
                            ? "font-semibold text-red-600"
                            : "font-medium text-emerald-700"
                        }
                      >
                        {result.value ?? "\u2014"}
                        {result.unit ? ` ${result.unit}` : ""}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-500">
                      <div className="space-y-1">
                        <div>{range || "\u2014"}</div>
                        {rangeLabel ? (
                          <div className="font-sans text-xs text-slate-400">
                            {rangeLabel}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isAbnormal ? (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200"
                        >
                          Out of range
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          Normal
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </Card>
      )}

      {/* Questions card */}
      <Card className="border border-teal-100 bg-teal-50/50 rounded-xl shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
              <MessageCircle className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                Questions about these results?
              </h3>
              <p className="text-xs text-slate-600">
                Our AI assistant can help explain what your results mean in
                simple terms.
              </p>
            </div>
          </div>
          <Button size="sm" className="rounded-lg" asChild>
            <Link href={`/portal/chat?prompt=${encodeURIComponent(`Explain my ${panelName} results in simple terms. Are there any values I should be concerned about?`)}`}>
              Ask about these results
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
