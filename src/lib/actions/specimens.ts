"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkActionPermission } from "@/lib/rbac/check-access";
import type { ActionState } from "@/lib/actions/patients";
export type { ActionState };
import type { SpecimenStatus, SpecimenType } from "@/lib/types/database";
import type { Permission } from "@/lib/rbac/permissions";

const VALID_TYPES: SpecimenType[] = ["serum", "plasma", "whole_blood", "urine", "csf", "other"];
const VALID_STATUSES: SpecimenStatus[] = ["received", "processing", "completed", "rejected"];

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createSpecimen(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const access = await checkActionPermission(supabase, "specimens:create");
  if ("error" in access) return access.error;
  const { profile } = access;

  const specimenRef = getString(formData, "specimen_ref");
  const orderId = getString(formData, "order_id");
  const type = getString(formData, "type") as SpecimenType;
  const collector = getString(formData, "collector");
  const barcode = getString(formData, "barcode");
  const notes = getString(formData, "notes");

  if (!specimenRef) {
    return { status: "error", message: "Specimen reference is required." };
  }

  if (!orderId) {
    return { status: "error", message: "Order is required." };
  }

  if (!VALID_TYPES.includes(type)) {
    return { status: "error", message: "Invalid specimen type." };
  }

  const { error } = await supabase.from("specimens").insert({
    organization_id: profile.organization_id,
    specimen_ref: specimenRef,
    order_id: orderId,
    type,
    collector: collector || null,
    barcode: barcode || null,
    collected_at: new Date().toISOString(),
    notes: notes || null,
    status: "received",
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/specimens");
  return { status: "success", message: "Specimen created." };
}

const STATUS_TRANSITIONS: Record<SpecimenStatus, SpecimenStatus[]> = {
  received: ["processing", "rejected"],
  processing: ["completed", "rejected"],
  completed: [],
  rejected: ["received"],
};

export async function updateSpecimenStatus(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const id = getString(formData, "id");
  const newStatus = getString(formData, "status") as SpecimenStatus;
  const rejectionReason = getString(formData, "rejection_reason");

  if (!id) {
    return { status: "error", message: "Specimen ID is required." };
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    return { status: "error", message: "Invalid status." };
  }

  const { data: specimen, error: fetchError } = await supabase
    .from("specimens")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !specimen) {
    return { status: "error", message: "Specimen not found." };
  }

  const currentStatus = specimen.status as SpecimenStatus;
  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    return {
      status: "error",
      message: `Cannot transition from "${currentStatus}" to "${newStatus}".`,
    };
  }

  // Check permission AFTER validating the transition
  const permission = `specimens:transition:${newStatus}` as Permission;
  const access = await checkActionPermission(supabase, permission);
  if ("error" in access) return access.error;

  if (newStatus === "rejected" && !rejectionReason) {
    return { status: "error", message: "Rejection reason is required." };
  }

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === "rejected") {
    updateData.rejection_reason = rejectionReason;
  }

  const { error } = await supabase
    .from("specimens")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/specimens");
  return { status: "success", message: `Specimen status updated to "${newStatus}".` };
}
