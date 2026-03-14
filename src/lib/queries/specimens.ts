import type { SupabaseClient } from "@supabase/supabase-js";
import type { SpecimenWithOrder } from "@/lib/types/database";

type SpecimenFilters = {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function getSpecimens(
  supabase: SupabaseClient,
  filters?: SpecimenFilters,
): Promise<{ data: SpecimenWithOrder[]; count: number }> {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("specimens")
    .select("*, orders(*, patients(*))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `specimen_ref.ilike.%${filters.search}%,collector.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`,
    );
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: data as SpecimenWithOrder[], count: count ?? 0 };
}

export async function getSpecimenById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("specimens")
    .select("*, orders(*, patients(*))")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as SpecimenWithOrder;
}

export async function getSpecimenMetrics(supabase: SupabaseClient) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [collectedToday, processing, rejected] = await Promise.all([
    supabase
      .from("specimens")
      .select("id", { count: "exact", head: true })
      .gte("collected_at", todayISO),
    supabase
      .from("specimens")
      .select("id", { count: "exact", head: true })
      .eq("status", "processing"),
    supabase
      .from("specimens")
      .select("id", { count: "exact", head: true })
      .eq("status", "rejected"),
  ]);

  return {
    collectedToday: collectedToday.count ?? 0,
    processing: processing.count ?? 0,
    rejected: rejected.count ?? 0,
  };
}
