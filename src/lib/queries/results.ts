import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResultStatus } from "@/lib/types/database";

type ResultFilters = {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type OrderResultRow = {
  orderId: string;
  orderRef: string;
  patientName: string;
  panelName: string;
  testCount: number;
  status: ResultStatus;
};

/**
 * Get results grouped by order, with pagination on orders (not individual result rows).
 * This queries orders that have results, then counts/aggregates per order.
 */
export async function getResults(
  supabase: SupabaseClient,
  filters?: ResultFilters,
): Promise<{ data: OrderResultRow[]; count: number }> {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 10;

  // Step 1: Find order IDs that have results, optionally filtered by result status
  let resultQuery = supabase
    .from("results")
    .select("order_id, status");

  if (filters?.status) {
    resultQuery = resultQuery.eq("status", filters.status);
  }

  const { data: allResults, error: resErr } = await resultQuery;
  if (resErr) throw resErr;

  // Group by order_id and compute aggregate status + count
  const orderAgg = new Map<string, { count: number; status: ResultStatus }>();
  for (const r of allResults ?? []) {
    const existing = orderAgg.get(r.order_id);
    if (existing) {
      existing.count += 1;
      existing.status = lowerStatus(existing.status, r.status as ResultStatus);
    } else {
      orderAgg.set(r.order_id, { count: 1, status: r.status as ResultStatus });
    }
  }

  let orderIds = Array.from(orderAgg.keys());

  // Step 2: If searching, filter order IDs by order ref or patient name
  if (filters?.search && orderIds.length > 0) {
    const term = `%${filters.search}%`;
    const { data: matchingOrders } = await supabase
      .from("orders")
      .select("id, order_ref, patients(full_name)")
      .in("id", orderIds)
      .or(`order_ref.ilike.${term}`);

    // Also search by patient name separately (PostgREST can't or() across relations)
    const { data: matchByPatient } = await supabase
      .from("orders")
      .select("id, patients!inner(full_name)")
      .in("id", orderIds)
      .ilike("patients.full_name", term);

    const matchedIds = new Set<string>();
    matchingOrders?.forEach((o) => matchedIds.add(o.id));
    matchByPatient?.forEach((o) => matchedIds.add(o.id));

    orderIds = orderIds.filter((id) => matchedIds.has(id));
  }

  const totalCount = orderIds.length;

  if (totalCount === 0) {
    return { data: [], count: 0 };
  }

  // Step 3: Fetch orders with patient info, paginated
  const from = (page - 1) * pageSize;
  const pagedOrderIds = orderIds.slice(from, from + pageSize);

  const { data: orders, error: ordErr } = await supabase
    .from("orders")
    .select("id, order_ref, patients(full_name), panels(name)")
    .in("id", pagedOrderIds)
    .order("created_at", { ascending: false });

  if (ordErr) throw ordErr;

  // Step 4: Build the result rows
  const rows: OrderResultRow[] = (orders ?? []).map((o) => {
    const agg = orderAgg.get(o.id)!;
    const patient = o.patients as unknown as { full_name: string } | null;
    const panel = o.panels as unknown as { name: string } | null;
    return {
      orderId: o.id,
      orderRef: o.order_ref,
      patientName: patient?.full_name ?? "—",
      panelName: panel?.name ?? "—",
      testCount: agg.count,
      status: agg.status,
    };
  });

  return { data: rows, count: totalCount };
}

function lowerStatus(a: ResultStatus, b: ResultStatus): ResultStatus {
  const priority: Record<ResultStatus, number> = {
    returned: 0, draft: 1, review: 2, approved: 3, released: 4,
  };
  return priority[a] <= priority[b] ? a : b;
}

export async function getResultsByOrderId(
  supabase: SupabaseClient,
  orderId: string,
) {
  const { data, error } = await supabase
    .from("results")
    .select("*, tests(*)")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getResultMetrics(supabase: SupabaseClient) {
  // Count distinct orders per result status (not individual result rows)
  const { data: allResults, error } = await supabase
    .from("results")
    .select("order_id, status");

  if (error) throw error;

  // Group by order, find aggregate status per order, then count orders per status
  const orderStatuses = new Map<string, ResultStatus>();
  for (const r of allResults ?? []) {
    const existing = orderStatuses.get(r.order_id);
    if (existing) {
      orderStatuses.set(r.order_id, lowerStatus(existing, r.status as ResultStatus));
    } else {
      orderStatuses.set(r.order_id, r.status as ResultStatus);
    }
  }

  let draftSets = 0;
  let pendingReview = 0;
  let returned = 0;
  for (const status of orderStatuses.values()) {
    if (status === "draft") draftSets++;
    else if (status === "review") pendingReview++;
    else if (status === "returned") returned++;
  }

  return { draftSets, pendingReview, returned };
}
