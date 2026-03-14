"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkActionPermission } from "@/lib/rbac/check-access";
import type { PatientStatus } from "@/lib/types/database";
import {
  createPatientSchema,
  updatePatientSchema,
} from "@/lib/validations/patients";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const VALID_STATUSES: PatientStatus[] = ["active", "merged", "inactive"];

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function generatePatientRef(): string {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PT-${now.slice(-3)}${rand.slice(0, 2)}`;
}

export async function createPatient(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const access = await checkActionPermission(supabase, "patients:create");
  if ("error" in access) return access.error;
  const { profile } = access;

  const parsed = createPatientSchema.safeParse({
    full_name: getString(formData, "full_name"),
    date_of_birth: getString(formData, "date_of_birth") || undefined,
    gender: getString(formData, "gender") || undefined,
    phone: getString(formData, "phone") || undefined,
    email: getString(formData, "email") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { full_name, date_of_birth, gender, phone, email } = parsed.data;

  const { error } = await supabase.from("patients").insert({
    organization_id: profile.organization_id,
    patient_ref: generatePatientRef(),
    full_name,
    date_of_birth: date_of_birth || null,
    gender: gender || null,
    phone: phone || null,
    email: email || null,
    status: "active",
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/patients");
  return { status: "success", message: "Patient created." };
}

export async function updatePatient(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const access = await checkActionPermission(supabase, "patients:update");
  if ("error" in access) return access.error;

  const parsed = updatePatientSchema.safeParse({
    id: getString(formData, "id"),
    full_name: getString(formData, "full_name"),
    date_of_birth: getString(formData, "date_of_birth") || undefined,
    gender: getString(formData, "gender") || undefined,
    phone: getString(formData, "phone") || undefined,
    email: getString(formData, "email") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { id, full_name, date_of_birth, gender, phone, email } = parsed.data;

  const { error } = await supabase
    .from("patients")
    .update({
      full_name,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      phone: phone || null,
      email: email || null,
    })
    .eq("id", id);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/patients");
  revalidatePath(`/patients/${id}`);
  return { status: "success", message: "Patient updated." };
}

const STATUS_TRANSITIONS: Record<PatientStatus, PatientStatus[]> = {
  active: ["merged", "inactive"],
  merged: [],
  inactive: ["active"],
};

export async function updatePatientStatus(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const access = await checkActionPermission(supabase, "patients:change_status");
  if ("error" in access) return access.error;

  const id = getString(formData, "id");
  const newStatus = getString(formData, "status") as PatientStatus;

  if (!id) {
    return { status: "error", message: "Patient ID is required." };
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    return { status: "error", message: "Invalid status." };
  }

  const { data: patient, error: fetchError } = await supabase
    .from("patients")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !patient) {
    return { status: "error", message: "Patient not found." };
  }

  const currentStatus = patient.status as PatientStatus;
  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    return {
      status: "error",
      message: `Cannot transition from "${currentStatus}" to "${newStatus}".`,
    };
  }

  const { error } = await supabase
    .from("patients")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/patients");
  revalidatePath(`/patients/${id}`);
  return { status: "success", message: `Patient status updated to "${newStatus}".` };
}
