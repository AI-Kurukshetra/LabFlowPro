"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, RotateCcw, Send } from "lucide-react";

import {
  approveResults,
  returnResults,
  releaseResults,
} from "@/lib/actions/results";
import type { ActionState } from "@/lib/actions/results";
import type { ResultStatus, UserRole } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ResultsReviewActionsProps = {
  orderId: string;
  currentStatus: ResultStatus;
  userRole?: UserRole;
};

const initialState: ActionState = { status: "idle" };

export function ResultsReviewActions({
  orderId,
  currentStatus,
  userRole,
}: ResultsReviewActionsProps) {
  const [returnComment, setReturnComment] = useState("");
  const [showReturnInput, setShowReturnInput] = useState(false);

  const [approveState, approveAction, isApproving] = useActionState(
    approveResults,
    initialState,
  );
  const [returnState, returnAction, isReturning] = useActionState(
    returnResults,
    initialState,
  );
  const [releaseState, releaseAction, isReleasing] = useActionState(
    releaseResults,
    initialState,
  );

  // Only show review actions for reviewer and admin roles
  if (userRole && userRole !== "reviewer" && userRole !== "admin") {
    return null;
  }

  // Only show review actions for specific statuses
  if (
    currentStatus === "draft" ||
    currentStatus === "released" ||
    currentStatus === "returned"
  ) {
    return null;
  }

  const latestState = [approveState, returnState, releaseState].find(
    (s) => s.status !== "idle",
  ) ?? initialState;

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.set("order_id", orderId);
    if (returnComment) {
      fd.set("comment", returnComment);
    }
    return fd;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-[1.05rem] font-semibold text-slate-950">
        Review Actions
      </h2>

      <div className="rounded-xl border border-slate-200/80 bg-white p-5">
        {latestState.status === "error" && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {latestState.message}
          </div>
        )}

        {latestState.status === "success" && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {latestState.message}
          </div>
        )}

        {currentStatus === "review" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              These results are awaiting supervisor review. You can approve
              them or return them to the bench for corrections.
            </p>

            <div className="flex flex-wrap items-start gap-3">
              <form
                action={() => {
                  const fd = buildFormData();
                  approveAction(fd);
                }}
              >
                <Button type="submit" disabled={isApproving}>
                  <CheckCircle2 className="size-4" />
                  {isApproving ? "Approving..." : "Approve All"}
                </Button>
              </form>

              {!showReturnInput ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowReturnInput(true)}
                >
                  <RotateCcw className="size-4" />
                  Return to Bench
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={returnComment}
                    onChange={(e) => setReturnComment(e.target.value)}
                    placeholder="Reason for return..."
                    className="w-64"
                  />
                  <form
                    action={() => {
                      const fd = buildFormData();
                      returnAction(fd);
                    }}
                  >
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={isReturning}
                    >
                      {isReturning ? "Returning..." : "Confirm Return"}
                    </Button>
                  </form>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReturnInput(false);
                      setReturnComment("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStatus === "approved" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              All results have been approved. Release them to generate reports
              and make them available downstream.
            </p>

            <form
              action={() => {
                const fd = buildFormData();
                releaseAction(fd);
              }}
            >
              <Button type="submit" disabled={isReleasing}>
                <Send className="size-4" />
                {isReleasing ? "Releasing..." : "Release Results"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
