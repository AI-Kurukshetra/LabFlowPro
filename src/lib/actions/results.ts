"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getReferenceRangeRulesForTests } from "@/lib/queries/reference-ranges";
import { checkActionPermission } from "@/lib/rbac/check-access";
import {
  buildResolvedReferenceRangeMap,
  isValueAbnormal,
} from "@/lib/reference-ranges";
import type { ActionState } from "@/lib/actions/patients";
export type { ActionState };
import type { Patient, ResultStatus, Test } from "@/lib/types/database";
import type { Permission } from "@/lib/rbac/permissions";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function saveResults(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const access = await checkActionPermission(supabase, "results:save");
  if ("error" in access) return access.error;
  const { profile } = access;

  const orderId = getString(formData, "order_id");
  const resultsJson = getString(formData, "results");

  if (!orderId) {
    return { status: "error", message: "Order ID is required." };
  }

  let results: { test_id: string; value: string; unit?: string }[];
  try {
    results = JSON.parse(resultsJson);
  } catch {
    return { status: "error", message: "Invalid results data." };
  }

  if (!Array.isArray(results) || results.length === 0) {
    return { status: "error", message: "At least one result is required." };
  }

  const testIds = Array.from(new Set(results.map((result) => result.test_id)));

  const [{ data: order, error: orderError }, { data: tests, error: testsError }, rules] = await Promise.all([
    supabase
      .from("orders")
      .select("collection_date, created_at, patients(*)")
      .eq("id", orderId)
      .single(),
    supabase
      .from("tests")
      .select("*")
      .in("id", testIds),
    getReferenceRangeRulesForTests(supabase, testIds),
  ]);

  if (orderError || !order) {
    return { status: "error", message: orderError?.message ?? "Order not found." };
  }

  if (testsError || !tests) {
    return { status: "error", message: testsError?.message ?? "Tests not found." };
  }

  const typedTests = tests as Test[];
  const resolvedRanges = buildResolvedReferenceRangeMap(
    typedTests,
    order.patients as unknown as Patient | null,
    rules,
    order.collection_date ?? order.created_at,
  );
  const testsById = new Map(typedTests.map((test) => [test.id, test]));

  const upsertRows = results.map((r) => ({
    organization_id: profile.organization_id,
    order_id: orderId,
    test_id: r.test_id,
    value: r.value,
    unit: r.unit ?? testsById.get(r.test_id)?.unit ?? null,
    is_abnormal: isValueAbnormal(r.value, resolvedRanges[r.test_id]),
    status: "draft" as ResultStatus,
  }));

  const { error } = await supabase
    .from("results")
    .upsert(upsertRows, { onConflict: "order_id,test_id" });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/results");
  return { status: "success", message: "Results saved." };
}

async function updateResultsStatus(
  permission: Permission,
  formData: FormData,
  targetStatus: ResultStatus,
  extraFields?: Record<string, unknown>,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const access = await checkActionPermission(supabase, permission);
  if ("error" in access) return access.error;

  const orderId = getString(formData, "order_id");

  if (!orderId) {
    return { status: "error", message: "Order ID is required." };
  }

  const updateData: Record<string, unknown> = {
    status: targetStatus,
    ...extraFields,
  };

  const { error } = await supabase
    .from("results")
    .update(updateData)
    .eq("order_id", orderId);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/results");
  return { status: "success", message: `Results updated to "${targetStatus}".` };
}

export async function submitForReview(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return updateResultsStatus("results:submit_review", formData, "review", {
    reviewed_at: new Date().toISOString(),
  });
}

export async function approveResults(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createServerSupabaseClient();

  const access = await checkActionPermission(supabase, "results:approve");
  if ("error" in access) return access.error;

  const orderId = getString(formData, "order_id");

  if (!orderId) {
    return { status: "error", message: "Order ID is required." };
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("results")
    .update({
      status: "approved",
      reviewer_id: user!.id,
      approved_at: new Date().toISOString(),
    })
    .eq("order_id", orderId);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/results");
  return { status: "success", message: "Results approved." };
}

export async function returnResults(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return updateResultsStatus("results:return", formData, "returned");
}

export async function releaseResults(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return updateResultsStatus("results:release", formData, "released");
}
