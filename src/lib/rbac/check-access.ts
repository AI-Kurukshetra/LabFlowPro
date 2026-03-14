import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Profile } from "@/lib/types/database";
import type { ActionState } from "@/lib/actions/patients";
import { hasPermission, type Permission } from "@/lib/rbac/permissions";

async function getAuthenticatedProfile(
  supabase: SupabaseClient,
): Promise<{ profile: Profile } | { error: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Not authenticated." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found." };
  }

  if (profile.role !== "patient" && !profile.organization_id) {
    return { error: "No organization found." };
  }

  return { profile: profile as Profile };
}

export async function checkActionPermission(
  supabase: SupabaseClient,
  permission: Permission,
): Promise<{ profile: Profile } | { error: ActionState }> {
  const result = await getAuthenticatedProfile(supabase);

  if ("error" in result) {
    return { error: { status: "error", message: result.error } };
  }

  if (!hasPermission(result.profile.role, permission)) {
    return {
      error: {
        status: "error",
        message: `You don't have permission to ${describePermission(permission)}.`,
      },
    };
  }

  return { profile: result.profile };
}

export async function requirePermission(
  supabase: SupabaseClient,
  permission: Permission,
): Promise<Profile> {
  const result = await getAuthenticatedProfile(supabase);

  if ("error" in result) {
    redirect("/dashboard");
  }

  if (!hasPermission(result.profile.role, permission)) {
    redirect("/dashboard");
  }

  return result.profile;
}

function describePermission(permission: Permission): string {
  const descriptions: Record<string, string> = {
    "patients:list": "view patients",
    "patients:create": "create patients",
    "patients:update": "update patients",
    "patients:change_status": "change patient status",
    "orders:list": "view orders",
    "orders:create": "create orders",
    "orders:transition:collected": "mark orders as collected",
    "orders:transition:in_process": "mark orders as in process",
    "orders:transition:review": "send orders for review",
    "orders:transition:released": "release orders",
    "specimens:list": "view specimens",
    "specimens:create": "create specimens",
    "specimens:transition:processing": "start specimen processing",
    "specimens:transition:completed": "complete specimen processing",
    "specimens:transition:rejected": "reject specimens",
    "results:list": "view results",
    "results:save": "save results",
    "results:submit_review": "submit results for review",
    "results:approve": "approve results",
    "results:return": "return results",
    "results:release": "release results",
    "reports:list": "view reports",
    "reports:generate": "generate reports",
    "reports:update_status": "update report status",
    "reports:release": "release reports",
    "admin:access": "access admin settings",
    "integrations:access": "access integrations",
    "export:patients": "export patients",
    "export:orders": "export orders",
    "export:results": "export results",
    "portal:access": "access the patient portal",
    "portal:view_results": "view your lab results",
    "portal:view_reports": "view your reports",
    "portal:chat": "use the AI assistant",
  };

  return descriptions[permission] ?? permission;
}
