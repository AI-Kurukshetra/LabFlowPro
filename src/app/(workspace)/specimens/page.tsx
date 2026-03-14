import Link from "next/link";
import { Plus, TestTube2 } from "lucide-react";

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
import { getSpecimens, getSpecimenMetrics } from "@/lib/queries/specimens";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { hasPermission } from "@/lib/rbac/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

const PAGE_SIZE = 10;

type SpecimensPageProps = {
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

function formatType(type: string) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const specimenTypeColors: Record<string, string> = {
  serum: "bg-amber-100 text-amber-700 border-amber-200",
  plasma: "bg-sky-100 text-sky-700 border-sky-200",
  whole_blood: "bg-red-100 text-red-700 border-red-200",
  urine: "bg-emerald-100 text-emerald-700 border-emerald-200",
  csf: "bg-violet-100 text-violet-700 border-violet-200",
  other: "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function SpecimensPage({ searchParams }: SpecimensPageProps) {
  if (!isSupabaseConfigured()) {
    return <ModulePage data={modulePageData.specimens} />;
  }

  const params = await searchParams;
  const statusFilter = typeof params.status === "string" ? params.status : undefined;
  const searchFilter = typeof params.search === "string" ? params.search : undefined;
  const currentPage = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);

  const supabase = await createServerSupabaseClient();

  let canCreate = false;
  try {
    const profile = await getCurrentProfile(supabase);
    canCreate = hasPermission(profile.role as UserRole, "specimens:create");
  } catch {
    // Fall back to no permissions
  }

  const [{ data: specimens, count: totalCount }, metrics] = await Promise.all([
    getSpecimens(supabase, {
      status: statusFilter,
      search: searchFilter,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    getSpecimenMetrics(supabase),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const statusFilterOptions = [
    { value: "received", label: "Received" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Specimens
            </h1>
            <Badge variant="secondary" className="text-xs">
              {totalCount} total
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Track specimens from collection to completion.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/specimens/new">
              <Plus className="size-4" data-icon="inline-start" />
              New Specimen
            </Link>
          </Button>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          metric={{
            label: "Collected today",
            value: String(metrics.collectedToday),
            helper: "Specimens linked to an order",
          }}
          accentColor="border-t-teal-500"
          href="/specimens?status=received"
        />
        <MetricCard
          metric={{
            label: "Processing now",
            value: String(metrics.processing),
            helper: "Bench work currently active",
          }}
          accentColor="border-t-amber-500"
          href="/specimens?status=processing"
        />
        <MetricCard
          metric={{
            label: "Rejected",
            value: String(metrics.rejected),
            helper: "Requires recollection or cancellation",
          }}
          accentColor="border-t-red-500"
          href="/specimens?status=rejected"
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
        searchPlaceholder="Search by ref, collector, or barcode..."
      />

      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>Specimen Ref</TableHead>
              <TableHead>Order Ref</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Collector</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Collected At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specimens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <TestTube2 className="size-6" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-700">No specimens found</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Specimens will appear here once logged against an order.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              specimens.map((specimen) => (
                <TableRow key={specimen.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Link
                      href={`/specimens/${specimen.id}`}
                      className="font-mono text-sm font-medium text-primary hover:underline"
                    >
                      {specimen.specimen_ref}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-600">
                    {specimen.orders.order_ref}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={specimenTypeColors[specimen.type] ?? specimenTypeColors.other}
                    >
                      {formatType(specimen.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-500">
                    {specimen.barcode ?? "\u2014"}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {specimen.collector ?? "\u2014"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={specimen.status} />
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatDate(specimen.collected_at)}
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
