"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSpecimenStatus, type ActionState } from "@/lib/actions/specimens";
import { hasPermission } from "@/lib/rbac/permissions";
import type { SpecimenStatus, UserRole } from "@/lib/types/database";

type SpecimenStatusActionsProps = {
  specimenId: string;
  currentStatus: SpecimenStatus;
  userRole?: UserRole;
};

const TRANSITIONS: Record<SpecimenStatus, { label: string; newStatus: SpecimenStatus }[]> = {
  received: [
    { label: "Start Processing", newStatus: "processing" },
    { label: "Reject", newStatus: "rejected" },
  ],
  processing: [
    { label: "Mark Complete", newStatus: "completed" },
    { label: "Reject", newStatus: "rejected" },
  ],
  completed: [],
  rejected: [],
};

export function SpecimenStatusActions({
  specimenId,
  currentStatus,
  userRole,
}: SpecimenStatusActionsProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateSpecimenStatus,
    { status: "idle" },
  );

  const allTransitions = TRANSITIONS[currentStatus] ?? [];

  // Filter transitions based on user role permissions
  const transitions = userRole
    ? allTransitions.filter((t) =>
        hasPermission(userRole, `specimens:transition:${t.newStatus}` as import("@/lib/rbac/permissions").Permission)
      )
    : allTransitions;

  if (transitions.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No actions available. This specimen is in a terminal state.
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

      {showRejectInput ? (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="id" value={specimenId} />
          <input type="hidden" name="status" value="rejected" />
          <div className="space-y-2">
            <Label htmlFor="rejection_reason">Rejection reason</Label>
            <Input
              id="rejection_reason"
              name="rejection_reason"
              placeholder="Enter reason for rejection..."
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRejectInput(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {transitions.map((transition) => {
            if (transition.newStatus === "rejected") {
              return (
                <Button
                  key={transition.newStatus}
                  variant="destructive"
                  onClick={() => setShowRejectInput(true)}
                >
                  {transition.label}
                </Button>
              );
            }

            return (
              <form key={transition.newStatus} action={formAction}>
                <input type="hidden" name="id" value={specimenId} />
                <input type="hidden" name="status" value={transition.newStatus} />
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Updating..." : transition.label}
                </Button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
