"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { updatePatientStatus, type ActionState } from "@/lib/actions/patients";
import type { PatientStatus, UserRole } from "@/lib/types/database";

type PatientStatusActionsProps = {
  patientId: string;
  currentStatus: PatientStatus;
  userRole?: UserRole;
};

const TRANSITIONS: Record<PatientStatus, { label: string; newStatus: PatientStatus }[]> = {
  active: [
    { label: "Mark as Merged", newStatus: "merged" },
    { label: "Deactivate", newStatus: "inactive" },
  ],
  merged: [],
  inactive: [
    { label: "Reactivate", newStatus: "active" },
  ],
};

export function PatientStatusActions({
  patientId,
  currentStatus,
  userRole,
}: PatientStatusActionsProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updatePatientStatus,
    { status: "idle" },
  );

  // Only show for admin and intake
  if (userRole && userRole !== "admin" && userRole !== "intake") {
    return (
      <p className="text-sm text-slate-500">
        You do not have permission to manage patient status.
      </p>
    );
  }

  const transitions = TRANSITIONS[currentStatus] ?? [];

  if (transitions.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No actions available. This patient record is in a terminal state.
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
            <input type="hidden" name="id" value={patientId} />
            <input type="hidden" name="status" value={transition.newStatus} />
            <Button
              type="submit"
              variant={transition.newStatus === "inactive" ? "destructive" : "default"}
              disabled={isPending}
            >
              {isPending ? "Updating..." : transition.label}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
