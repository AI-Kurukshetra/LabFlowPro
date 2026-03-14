import type { SupabaseClient } from "@supabase/supabase-js";
import type { Patient, Panel, PatientWithOrders } from "@/lib/types/database";

type PatientFilters = {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function getPatients(
  supabase: SupabaseClient,
  filters?: PatientFilters,
): Promise<{ data: Patient[]; count: number }> {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("patients")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,patient_ref.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
    );
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: data as Patient[], count: count ?? 0 };
}

export async function getPatientById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("patients")
    .select("*, orders(*, panels(*))")
    .eq("id", id)
    .order("created_at", { ascending: false, referencedTable: "orders" })
    .single();

  if (error) throw error;
  return data as PatientWithOrders;
}

export async function getPatientMetrics(supabase: SupabaseClient) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [active, newToday, duplicateFlags] = await Promise.all([
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayISO),
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .eq("status", "merged"),
  ]);

  return {
    active: active.count ?? 0,
    newToday: newToday.count ?? 0,
    duplicateFlags: duplicateFlags.count ?? 0,
  };
}

export async function getPanels(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("panels")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data as Panel[];
}
