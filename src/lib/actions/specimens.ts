"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkActionPermission } from "@/lib/rbac/check-access";
import type { ActionState } from "@/lib/actions/patients";
export type { ActionState };
import type { SpecimenStatus } from "@/lib/types/database";
import type { Permission } from "@/lib/rbac/permissions";
import {
  createSpecimenSchema,
  updateSpecimenStatusSchema,
} from "@/lib/validations/specimens";

const STATUS_TRANSITIONS: Record<SpecimenStatus, SpecimenStatus[]> = {
  received: ["processing", "rejected"],
  processing: ["completed", "rejected"],
  completed: [],
  rejected: ["received"],
};

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

  const parsed = createSpecimenSchema.safeParse({
    specimen_ref: getString(formData, "specimen_ref"),
    order_id: getString(formData, "order_id"),
    type: getString(formData, "type"),
    collector: getString(formData, "collector") || undefined,
    barcode: getString(formData, "barcode") || undefined,
    notes: getString(formData, "notes") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { specimen_ref, order_id, type, collector, barcode, notes } = parsed.data;

  const { error } = await supabase.from("specimens").insert({
    organization_id: profile.organization_id,
    specimen_ref,
    order_id,
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

export async function updateSpecimenStatus(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const parsed = updateSpecimenStatusSchema.safeParse({
    id: getString(formData, "id"),
    status: getString(formData, "status"),
    rejection_reason: getString(formData, "rejection_reason") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { id, status: newStatus, rejection_reason } = parsed.data;

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

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === "rejected") {
    updateData.rejection_reason = rejection_reason;
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
