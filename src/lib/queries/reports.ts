import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportWithRelations } from "@/lib/types/database";

type ReportFilters = {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function getReports(
  supabase: SupabaseClient,
  filters?: ReportFilters,
): Promise<{ data: ReportWithRelations[]; count: number }> {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("reports")
    .select("*, orders(*, patients(*), panels(*)), patients(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `report_ref.ilike.%${filters.search}%`,
    );
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: data as ReportWithRelations[], count: count ?? 0 };
}

export async function getReportById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("reports")
    .select("*, orders(*, patients(*), panels(*)), patients(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ReportWithRelations;
}

export async function getReportMetrics(supabase: SupabaseClient) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [generatedToday, versionedEdits, formats] = await Promise.all([
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayISO),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .gt("version", 1),
    supabase
      .from("reports")
      .select("format")
      .limit(1000),
  ]);

  const uniqueFormats = new Set(
    (formats.data ?? []).map((r: { format: string }) => r.format),
  );

  return {
    generatedToday: generatedToday.count ?? 0,
    versionedEdits: versionedEdits.count ?? 0,
    formatCount: uniqueFormats.size,
  };
}
