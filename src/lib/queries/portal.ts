import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, Patient, Order, Result, Report, Test } from "@/lib/types/database";

export const getPatientProfile = cache(async (supabase: SupabaseClient) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw userError ?? new Error("Not authenticated");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, patients(*)")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) throw profileError ?? new Error("Profile not found");

  return profile as Profile & { patients: Patient | null };
});

export async function getPatientResults(supabase: SupabaseClient, patientId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, panels(*), results(*, tests(*))")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  type OrderWithResults = Order & {
    panels: { id: string; name: string } | null;
    results: (Result & { tests: Test | null })[];
  };

  return (data as OrderWithResults[]).filter(
    (order) => order.results.some((r) => r.status === "released")
  );
}

export async function getPatientResultsByOrderId(
  supabase: SupabaseClient,
  patientId: string,
  orderId: string
) {
  const { data, error } = await supabase
    .from("results")
    .select("*, tests(*), orders!inner(*)")
    .eq("order_id", orderId)
    .eq("orders.patient_id", patientId)
    .eq("status", "released")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data as (Result & {
    tests: Test | null;
    orders: Order;
  })[];
}

export async function getPatientReports(supabase: SupabaseClient, patientId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select("*, orders(*, panels(*))")
    .eq("patient_id", patientId)
    .eq("status", "released")
    .order("released_at", { ascending: false });

  if (error) throw error;

  return data as (Report & {
    orders: Order & { panels: { id: string; name: string } | null };
  })[];
}

export async function getPatientDashboardMetrics(supabase: SupabaseClient, patientId: string) {
  const [resultsRes, reportsRes, lastResultRes] = await Promise.all([
    supabase
      .from("results")
      .select("id", { count: "exact", head: true })
      .eq("status", "released")
      .in(
        "order_id",
        (await supabase.from("orders").select("id").eq("patient_id", patientId)).data?.map(
          (o) => o.id
        ) ?? []
      ),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", patientId)
      .eq("status", "released"),
    supabase
      .from("results")
      .select("updated_at")
      .eq("status", "released")
      .in(
        "order_id",
        (await supabase.from("orders").select("id").eq("patient_id", patientId)).data?.map(
          (o) => o.id
        ) ?? []
      )
      .order("updated_at", { ascending: false })
      .limit(1),
  ]);

  return {
    releasedResults: resultsRes.count ?? 0,
    releasedReports: reportsRes.count ?? 0,
    lastResultDate: lastResultRes.data?.[0]?.updated_at ?? null,
  };
}
