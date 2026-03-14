"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { updateReportStatus, type ActionState } from "@/lib/actions/reports";
import type { ReportStatus, UserRole } from "@/lib/types/database";

type ReportStatusActionsProps = {
  reportId: string;
  currentStatus: ReportStatus;
  userRole?: UserRole;
};

const TRANSITIONS: Record<ReportStatus, { label: string; newStatus: ReportStatus }[]> = {
  queued: [
    { label: "Start Formatting", newStatus: "formatting" },
  ],
  formatting: [
    { label: "Mark Release Ready", newStatus: "release_ready" },
  ],
  release_ready: [
    { label: "Release Report", newStatus: "released" },
  ],
  released: [],
};

export function ReportStatusActions({
  reportId,
  currentStatus,
  userRole,
}: ReportStatusActionsProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateReportStatus,
    { status: "idle" },
  );

  // Only show for admin and reviewer
  if (userRole && userRole !== "admin" && userRole !== "reviewer") {
    return (
      <p className="text-sm text-slate-500">
        You do not have permission to manage report status.
      </p>
    );
  }

  const transitions = TRANSITIONS[currentStatus] ?? [];

  if (transitions.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No actions available. This report has been released.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {state.status === "success" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {transitions.map((transition) => (
          <form key={transition.newStatus} action={formAction}>
            <input type="hidden" name="id" value={reportId} />
            <input type="hidden" name="status" value={transition.newStatus} />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : transition.label}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
