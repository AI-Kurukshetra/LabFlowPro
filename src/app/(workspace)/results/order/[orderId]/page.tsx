import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOrderById } from "@/lib/queries/orders";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { resolveReferenceRangesForTests } from "@/lib/queries/reference-ranges";
import { hasPermission } from "@/lib/rbac/permissions";
import { getResultsByOrderId } from "@/lib/queries/results";
import { StatusBadge } from "@/components/workspace/status-badge";
import { Button } from "@/components/ui/button";
import { ResultsEntryForm } from "@/components/workspace/results-entry-form";
import { ResultsReviewActions } from "@/components/workspace/results-review-actions";
import type { ResultStatus, Test, UserRole } from "@/lib/types/database";

type Params = Promise<{ orderId: string }>;

export default async function OrderResultsPage({
  params,
}: {
  params: Params;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <p className="text-slate-600">
          Connect Supabase to enter and review results.
        </p>
      </div>
    );
  }

  const { orderId } = await params;
  const supabase = await createServerSupabaseClient();

  let userRole: UserRole = "technician";
  try {
    const profile = await getCurrentProfile(supabase);
    if (!hasPermission(profile.role as UserRole, "results:list")) {
      redirect("/dashboard");
    }
    userRole = profile.role;
  } catch {
    redirect("/dashboard");
  }

  const [order, existingResults] = await Promise.all([
    getOrderById(supabase, orderId),
    getResultsByOrderId(supabase, orderId),
  ]);

  // Get the tests for this order's panel
  let panelTests: Test[] = [];
  if (order.panels) {
    const { data: ptRows } = await supabase
      .from("panel_tests")
      .select("test_id, tests(*)")
      .eq("panel_id", order.panels.id);

    if (ptRows) {
      panelTests = ptRows
        .map((row: { test_id: string; tests: unknown }) => row.tests as Test | null)
        .filter((t): t is Test => t !== null);
    }
  }

  // If there are no panel tests, fall back to tests from existing results
  if (panelTests.length === 0 && existingResults.length > 0) {
    panelTests = existingResults
      .map((r: { tests: Test | null }) => r.tests)
      .filter((t): t is Test => t !== null);
  }

  // Build a map of existing results keyed by test_id
  const resultsMap: Record<
    string,
    {
      id: string;
      value: string | null;
      unit: string | null;
      is_abnormal: boolean | null;
      status: ResultStatus;
    }
  > = {};

  for (const r of existingResults) {
    if (r.test_id) {
      resultsMap[r.test_id] = {
        id: r.id,
        value: r.value,
        unit: r.unit,
        is_abnormal: r.is_abnormal,
        status: r.status,
      };
    }
  }

  // Determine overall result status for this order
  const statuses = existingResults.map((r: { status: ResultStatus }) => r.status);
  const overallStatus: ResultStatus | null =
    statuses.length > 0 ? getOverallStatus(statuses) : null;
  const resolvedReferenceRanges = await resolveReferenceRangesForTests(
    supabase,
    panelTests,
    order.patients,
    order.collection_date ?? order.created_at,
  );

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/results">
            <ArrowLeft className="size-4" />
            Back to Results
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {order.order_ref}
            </h1>
            <p className="mt-1 text-base text-slate-600">
              {order.patients.full_name} — {order.panels?.name ?? "No panel"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.priority} />
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white p-5">
        <div className="grid gap-4 text-sm grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Patient ID
            </p>
            <p className="mt-1 font-medium text-slate-950">
              {order.patients.patient_ref}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Panel
            </p>
            <p className="mt-1 font-medium text-slate-950">
              {order.panels?.name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Priority
            </p>
            <p className="mt-1">
              <StatusBadge status={order.priority} />
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Order Status
            </p>
            <p className="mt-1">
              <StatusBadge status={order.status} />
            </p>
          </div>
        </div>
      </div>

      {panelTests.length === 0 ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-12 text-center">
          <p className="text-slate-500">
            No tests are associated with this order. Add tests to the panel to begin entering results.
          </p>
        </div>
      ) : (
        <ResultsEntryForm
          orderId={orderId}
          tests={panelTests}
          resolvedReferenceRanges={resolvedReferenceRanges}
          existingResults={resultsMap}
          orderStatus={order.status}
          userRole={userRole}
        />
      )}

      {overallStatus && (
        <ResultsReviewActions
          orderId={orderId}
          currentStatus={overallStatus}
          userRole={userRole}
        />
      )}
    </div>
  );
}

function getOverallStatus(statuses: ResultStatus[]): ResultStatus {
  const priority: Record<ResultStatus, number> = {
    returned: 0,
    draft: 1,
    review: 2,
    approved: 3,
    released: 4,
  };
  let lowest: ResultStatus = statuses[0];
  for (const s of statuses) {
    if (priority[s] < priority[lowest]) {
      lowest = s;
    }
  }
  return lowest;
}
