"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkActionPermission } from "@/lib/rbac/check-access";
import type { ActionState } from "@/lib/actions/patients";
export type { ActionState };
import type { ReportStatus, ReportFormat } from "@/lib/types/database";

const VALID_STATUSES: ReportStatus[] = ["queued", "formatting", "release_ready", "released"];
const VALID_FORMATS: ReportFormat[] = ["pdf", "pdf_csv", "pdf_json"];

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function generateReportRef(): string {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RP-${now.slice(-4)}${rand.slice(0, 2)}`;
}

export async function generateReport(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const access = await checkActionPermission(supabase, "reports:generate");
  if ("error" in access) return access.error;
  const { profile } = access;

  const orderId = getString(formData, "order_id");
  const format = getString(formData, "format") as ReportFormat;

  if (!orderId) {
    return { status: "error", message: "Order is required." };
  }

  if (!VALID_FORMATS.includes(format)) {
    return { status: "error", message: "Invalid report format." };
  }

  // Fetch the order to get the patient_id and verify it has approved/released results
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, patient_id, status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { status: "error", message: "Order not found." };
  }

  // Check that order has at least one approved or released result
  const { data: results } = await supabase
    .from("results")
    .select("id, status")
    .eq("order_id", orderId)
    .in("status", ["approved", "released"]);

  if (!results || results.length === 0) {
    return {
      status: "error",
      message: "Order must have approved or released results before generating a report.",
    };
  }

  const { error } = await supabase.from("reports").insert({
    organization_id: profile.organization_id,
    report_ref: generateReportRef(),
    order_id: orderId,
    patient_id: order.patient_id,
    format,
    version: 1,
    status: "queued",
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/reports");
  return { status: "success", message: "Report generated." };
}

const STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  queued: ["formatting"],
  formatting: ["release_ready"],
  release_ready: ["released"],
  released: [],
};

export async function updateReportStatus(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const access = await checkActionPermission(supabase, "reports:update_status");
  if ("error" in access) return access.error;

  const id = getString(formData, "id");
  const newStatus = getString(formData, "status") as ReportStatus;

  if (!id) {
    return { status: "error", message: "Report ID is required." };
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    return { status: "error", message: "Invalid status." };
  }

  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !report) {
    return { status: "error", message: "Report not found." };
  }

  const currentStatus = report.status as ReportStatus;
  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    return {
      status: "error",
      message: `Cannot transition from "${currentStatus}" to "${newStatus}".`,
    };
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === "released") {
    const { data: { user } } = await supabase.auth.getUser();
    updateData.released_by = user!.id;
    updateData.released_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("reports")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/reports");
  revalidatePath(`/reports/${id}`);
  return { status: "success", message: `Report status updated to "${newStatus}".` };
}

export async function releaseReport(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const access = await checkActionPermission(supabase, "reports:release");
  if ("error" in access) return access.error;

  const id = getString(formData, "id");

  if (!id) {
    return { status: "error", message: "Report ID is required." };
  }

  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !report) {
    return { status: "error", message: "Report not found." };
  }

  if (report.status !== "release_ready") {
    return {
      status: "error",
      message: "Report must be in release_ready status to be released.",
    };
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("reports")
    .update({
      status: "released",
      released_by: user!.id,
      released_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/reports");
  revalidatePath(`/reports/${id}`);
  return { status: "success", message: "Report released." };
}
