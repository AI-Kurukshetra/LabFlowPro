import type { UserRole } from "@/lib/types/database";

export type Permission =
  | "patients:list"
  | "patients:create"
  | "patients:update"
  | "patients:change_status"
  | "orders:list"
  | "orders:create"
  | "orders:transition:collected"
  | "orders:transition:in_process"
  | "orders:transition:review"
  | "orders:transition:released"
  | "specimens:list"
  | "specimens:create"
  | "specimens:transition:processing"
  | "specimens:transition:completed"
  | "specimens:transition:rejected"
  | "results:list"
  | "results:save"
  | "results:submit_review"
  | "results:approve"
  | "results:return"
  | "results:release"
  | "reports:list"
  | "reports:generate"
  | "reports:update_status"
  | "reports:release"
  | "admin:access"
  | "integrations:access"
  | "export:patients"
  | "export:orders"
  | "export:results"
  | "portal:access"
  | "portal:view_results"
  | "portal:view_reports"
  | "portal:chat"
  | "analytics:access";

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  admin: [
    "patients:list", "patients:create", "patients:update", "patients:change_status",
    "orders:list", "orders:create",
    "orders:transition:collected", "orders:transition:in_process",
    "orders:transition:review", "orders:transition:released",
    "specimens:list", "specimens:create",
    "specimens:transition:processing", "specimens:transition:completed", "specimens:transition:rejected",
    "results:list", "results:save", "results:submit_review",
    "results:approve", "results:return", "results:release",
    "reports:list", "reports:generate", "reports:update_status", "reports:release",
    "admin:access", "integrations:access", "analytics:access",
    "export:patients", "export:orders", "export:results",
  ],
  intake: [
    "patients:list", "patients:create", "patients:update", "patients:change_status",
    "orders:list", "orders:create",
    "orders:transition:collected",
    "specimens:list", "specimens:create",
    "export:patients", "export:orders",
  ],
  technician: [
    "orders:list",
    "specimens:list",
    "specimens:transition:processing", "specimens:transition:completed", "specimens:transition:rejected",
    "results:list", "results:save", "results:submit_review",
    "export:results",
  ],
  reviewer: [
    "orders:list",
    "specimens:list",
    "specimens:transition:rejected",
    "results:list", "results:approve", "results:return", "results:release",
    "reports:list", "reports:generate", "reports:update_status", "reports:release",
    "export:results", "export:orders",
  ],
  patient: [
    "portal:access",
    "portal:view_results",
    "portal:view_reports",
    "portal:chat",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
