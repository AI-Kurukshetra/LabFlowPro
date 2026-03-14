import Link from "next/link";
import { Download, Inbox, Plus } from "lucide-react";

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
import { getOrders, getOrderMetrics } from "@/lib/queries/orders";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { hasPermission } from "@/lib/rbac/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

const PAGE_SIZE = 10;

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getPriorityBadgeClasses(priority: string): string {
  switch (priority) {
    case "stat":
      return "bg-red-100 text-red-700 border-red-200";
    case "urgent":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  if (!isSupabaseConfigured()) {
    return <ModulePage data={modulePageData.orders} />;
  }

  const params = await searchParams;
  const statusFilter = typeof params.status === "string" ? params.status : undefined;
  const priorityFilter = typeof params.priority === "string" ? params.priority : undefined;
  const searchFilter = typeof params.search === "string" ? params.search : undefined;
  const currentPage = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);

  const supabase = await createServerSupabaseClient();

  let canCreate = false;
  let canExport = false;
  try {
    const profile = await getCurrentProfile(supabase);
    canCreate = hasPermission(profile.role as UserRole, "orders:create");
    canExport = hasPermission(profile.role as UserRole, "export:orders");
  } catch {
    // Fall back to no permissions
  }

  const [{ data: orders, count: totalCount }, metrics] = await Promise.all([
    getOrders(supabase, {
      status: statusFilter,
      priority: priorityFilter,
      search: searchFilter,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    getOrderMetrics(supabase),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">Orders</h1>
            <Badge variant="secondary" className="text-xs">
              {totalCount} total
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Manage lab orders, priorities, and workflow status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canExport && (
            <Button variant="outline" asChild>
              <a href="/api/export/orders?format=csv">
                <Download data-icon="inline-start" className="size-4" />
                Export
              </a>
            </Button>
          )}
          {canCreate && (
            <Button asChild>
              <Link href="/orders/new">
                <Plus data-icon="inline-start" className="size-4" />
                New Order
              </Link>
            </Button>
          )}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          metric={{
            label: "Open Orders",
            value: String(metrics.openOrders),
            helper: "Draft through review",
          }}
          accentColor="border-t-teal-500"
          href="/orders?status=draft"
        />
        <MetricCard
          metric={{
            label: "Collected Today",
            value: String(metrics.collectedToday),
            helper: "Specimens logged against an order",
          }}
          accentColor="border-t-sky-500"
          href="/orders?status=collected"
        />
        <MetricCard
          metric={{
            label: "Average TAT",
            value: metrics.averageTAT,
            helper: "Operational benchmark snapshot",
          }}
          accentColor="border-t-violet-500"
          href="/orders?status=released"
        />
      </section>

      <FilterBar
        searchPlaceholder="Search orders..."
        filters={[
          {
            key: "status",
            label: "All statuses",
            options: [
              { value: "draft", label: "Draft" },
              { value: "collected", label: "Collected" },
              { value: "in_process", label: "In Process" },
              { value: "review", label: "Review" },
              { value: "released", label: "Released" },
            ],
          },
          {
            key: "priority",
            label: "All priorities",
            options: [
              { value: "routine", label: "Routine" },
              { value: "urgent", label: "Urgent" },
              { value: "stat", label: "STAT" },
            ],
          },
        ]}
      />

      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>Order Ref</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Panel</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Collection Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <Inbox className="size-6" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-700">No orders found</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Create a new order to get started.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-mono text-sm font-medium text-primary hover:underline"
                    >
                      {order.order_ref}
                    </Link>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {order.patients.full_name}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {order.panels?.name ?? "\u2014"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getPriorityBadgeClasses(order.priority)}
                    >
                      {order.priority === "stat"
                        ? "STAT"
                        : order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {order.collection_date
                      ? new Date(order.collection_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "\u2014"}
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
