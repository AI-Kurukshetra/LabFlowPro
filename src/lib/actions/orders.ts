"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkActionPermission } from "@/lib/rbac/check-access";
import type { ActionState } from "@/lib/actions/patients";
export type { ActionState };
import type { OrderStatus, OrderPriority } from "@/lib/types/database";
import type { Permission } from "@/lib/rbac/permissions";

const VALID_PRIORITIES: OrderPriority[] = ["routine", "urgent", "stat"];
const VALID_STATUSES: OrderStatus[] = ["draft", "collected", "in_process", "review", "released"];

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function generateOrderRef(): string {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LF-${now.slice(-4)}${rand}`;
}

export async function createOrder(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const access = await checkActionPermission(supabase, "orders:create");
  if ("error" in access) return access.error;
  const { profile } = access;

  const patientId = getString(formData, "patient_id");
  const panelId = getString(formData, "panel_id");
  const priority = getString(formData, "priority") as OrderPriority;
  const notes = getString(formData, "notes");

  if (!patientId) {
    return { status: "error", message: "Patient is required." };
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    return { status: "error", message: "Invalid priority." };
  }

  const { error } = await supabase.from("orders").insert({
    organization_id: profile.organization_id,
    order_ref: generateOrderRef(),
    patient_id: patientId,
    panel_id: panelId || null,
    priority,
    notes: notes || null,
    status: "draft",
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/orders");
  return { status: "success", message: "Order created." };
}

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["collected"],
  collected: ["in_process"],
  in_process: ["review"],
  review: ["released", "in_process"],
  released: [],
};

export async function updateOrderStatus(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const id = getString(formData, "id");
  const newStatus = getString(formData, "status") as OrderStatus;

  if (!id) {
    return { status: "error", message: "Order ID is required." };
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    return { status: "error", message: "Invalid status." };
  }

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !order) {
    return { status: "error", message: "Order not found." };
  }

  const currentStatus = order.status as OrderStatus;
  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    return {
      status: "error",
      message: `Cannot transition from "${currentStatus}" to "${newStatus}".`,
    };
  }

  // Check permission AFTER validating the transition
  const permission = `orders:transition:${newStatus}` as Permission;
  const access = await checkActionPermission(supabase, permission);
  if ("error" in access) return access.error;

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === "collected") {
    updateData.collection_date = new Date().toISOString();
  }

  const { error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/orders");
  return { status: "success", message: `Order status updated to "${newStatus}".` };
}
