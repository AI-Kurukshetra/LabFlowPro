import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderWithRelations, Order, Specimen, Result, Patient, Test } from "@/lib/types/database";

type OrderFilters = {
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function getOrders(
  supabase: SupabaseClient,
  filters?: OrderFilters,
): Promise<{ data: OrderWithRelations[]; count: number }> {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("orders")
    .select("*, patients(*), panels(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }

  if (filters?.search) {
    query = query.or(
      `order_ref.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`,
    );
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: data as OrderWithRelations[], count: count ?? 0 };
}

type OrderWithDetails = Order & {
  patients: Patient;
  panels: { id: string; name: string } | null;
  specimens: Specimen[];
  results: (Result & { tests: Test | null })[];
};

export async function getOrderById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, patients(*), panels(*), specimens(*), results(*, tests(*))")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as OrderWithDetails;
}

export async function getOrderMetrics(supabase: SupabaseClient) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [openOrders, collectedToday] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["draft", "collected", "in_process", "review"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "collected")
      .gte("collection_date", todayISO),
  ]);

  return {
    openOrders: openOrders.count ?? 0,
    collectedToday: collectedToday.count ?? 0,
    averageTAT: "N/A",
  };
}
