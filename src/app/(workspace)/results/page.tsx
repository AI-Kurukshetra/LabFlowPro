import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, FileSearch } from "lucide-react";

import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getResults, getResultMetrics } from "@/lib/queries/results";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { hasPermission } from "@/lib/rbac/permissions";
import { modulePageData } from "@/lib/mock-data";
import { ModulePage } from "@/components/workspace/module-page";
import { MetricCard } from "@/components/workspace/metric-card";
import { FilterBar } from "@/components/workspace/filter-bar";
import { StatusBadge } from "@/components/workspace/status-badge";
import { Pagination } from "@/components/workspace/pagination";
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
import type { UserRole } from "@/lib/types/database";
const PAGE_SIZE = 10;

type SearchParams = Promise<{ status?: string; search?: string; page?: string }>;

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isSupabaseConfigured()) {
    return <ModulePage data={modulePageData.results} />;
  }

  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  let isReviewer = false;
  try {
    const profile = await getCurrentProfile(supabase);
    if (!hasPermission(profile.role as UserRole, "results:list")) {
      redirect("/dashboard");
    }
    isReviewer = profile.role === "reviewer";
  } catch {
    redirect("/dashboard");
  }

  const statusFilter = params.status || undefined;
  const searchFilter = params.search || undefined;
  const currentPage = Math.max(1, Number(params.page) || 1);

  const [{ data: orderRows, count: totalCount }, metrics] = await Promise.all([
    getResults(supabase, {
      status: statusFilter,
      search: searchFilter,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    getResultMetrics(supabase),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const statusFilterOptions = [
    { value: "draft", label: "Draft" },
    { value: "review", label: "Review" },
    { value: "approved", label: "Approved" },
    { value: "released", label: "Released" },
    { value: "returned", label: "Returned" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Results
            </h1>
            <Badge variant="secondary" className="text-xs">
              {totalCount} total
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Enter, review, and release test results across all active orders.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          metric={{
            label: "Draft Sets",
            value: String(metrics.draftSets),
            helper: "Still being entered or validated",
          }}
          accentColor="border-t-teal-500"
          href="/results?status=draft"
        />
        <MetricCard
          metric={{
            label: "Pending Review",
            value: String(metrics.pendingReview),
            helper: "Ready for supervisor verification",
          }}
          accentColor="border-t-amber-500"
          href="/results?status=review"
        />
        <MetricCard
          metric={{
            label: "Returned",
            value: String(metrics.returned),
            helper: "Rejected back to bench for correction",
          }}
          accentColor="border-t-red-500"
          href="/results?status=returned"
        />
      </section>

      <FilterBar
        filters={[
          {
            key: "status",
            label: "All Statuses",
            options: statusFilterOptions,
          },
        ]}
        searchPlaceholder="Search by order ref or patient..."
      />

      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>Order Ref</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Panel</TableHead>
              <TableHead>Tests</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <FileSearch className="size-6" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-700">No results found</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Results appear here once test values are entered for an order.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orderRows.map((row) => (
                <TableRow key={row.orderId} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-sm text-slate-950">
                    {row.orderRef}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {row.patientName}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {row.panelName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {row.testCount} {row.testCount === 1 ? "test" : "tests"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/results/order/${row.orderId}`}>
                        <ClipboardList className="size-3.5" data-icon="inline-start" />
                        {isReviewer
                          ? "View Results"
                          : row.status === "draft" || row.status === "returned"
                            ? "Enter Results"
                            : "View Results"}
                      </Link>
                    </Button>
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

