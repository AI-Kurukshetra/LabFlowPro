"use client";

import { useActionState, useState, useCallback } from "react";
import { AlertCircle, Save, SendHorizontal } from "lucide-react";

import { saveResults, submitForReview } from "@/lib/actions/results";
import type { ActionState } from "@/lib/actions/results";
import type { Test, ResultStatus, OrderStatus, UserRole } from "@/lib/types/database";
import {
  formatResolvedReferenceRange,
  getReferenceRangeContextLabel,
  isValueAbnormal,
  type ResolvedReferenceRangeMap,
} from "@/lib/reference-ranges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/workspace/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ExistingResult = {
  id: string;
  value: string | null;
  unit: string | null;
  is_abnormal: boolean | null;
  status: ResultStatus;
};

type ResultsEntryFormProps = {
  orderId: string;
  tests: Test[];
  resolvedReferenceRanges: ResolvedReferenceRangeMap;
  existingResults: Record<string, ExistingResult>;
  orderStatus: OrderStatus;
  userRole?: UserRole;
};

const initialState: ActionState = { status: "idle" };

export function ResultsEntryForm({
  orderId,
  tests,
  resolvedReferenceRanges,
  existingResults,
  userRole,
}: ResultsEntryFormProps) {
  // Determine if editing is allowed
  const existingStatuses = Object.values(existingResults).map((r) => r.status);
  const hasResults = existingStatuses.length > 0;
  const isReviewer = userRole === "reviewer";
  const isEditable =
    !isReviewer &&
    (!hasResults ||
    existingStatuses.some((s) => s === "draft" || s === "returned"));

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const test of tests) {
      const existing = existingResults[test.id];
      initial[test.id] = existing?.value ?? "";
    }
    return initial;
  });

  const [saveState, saveAction, isSaving] = useActionState(
    saveResults,
    initialState,
  );
  const [submitState, submitAction, isSubmitting] = useActionState(
    submitForReview,
    initialState,
  );

  const handleValueChange = useCallback((testId: string, value: string) => {
    setValues((prev) => ({ ...prev, [testId]: value }));
  }, []);

  function buildFormData(): FormData {
    const formData = new FormData();
    formData.set("order_id", orderId);

    const resultsPayload = tests.map((test) => {
      const value = values[test.id] ?? "";

      return {
        test_id: test.id,
        value,
        unit: test.unit ?? undefined,
      };
    });

    formData.set("results", JSON.stringify(resultsPayload));
    return formData;
  }

  const latestState =
    submitState.status !== "idle" ? submitState : saveState;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[1.05rem] font-semibold text-slate-950">
          Test Results
        </h2>
        {hasResults && (
          <StatusBadge
            status={existingStatuses[0]}
            className="text-xs"
          />
        )}
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>Test</TableHead>
              <TableHead>Reference Range</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Flag</TableHead>
              {hasResults && <TableHead>Status</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.map((test) => {
              const resolvedRange = resolvedReferenceRanges[test.id];
              const display = formatResolvedReferenceRange(
                resolvedRange,
                test.unit,
                { includeUnit: false },
              );
              const contextLabel = getReferenceRangeContextLabel(resolvedRange);
              const currentValue = values[test.id] ?? "";
              const abnormal = currentValue
                ? isValueAbnormal(currentValue, resolvedRange)
                : false;
              const existingResult = existingResults[test.id];

              return (
                <TableRow key={test.id}>
                  <TableCell className="font-medium text-slate-950">
                    {test.name}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    <div className="space-y-1">
                      <div>{display || "—"}</div>
                      {contextLabel ? (
                        <div className="text-xs text-slate-400">
                          {contextLabel}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isEditable ? (
                      <Input
                        type="text"
                        value={currentValue}
                        onChange={(e) =>
                          handleValueChange(test.id, e.target.value)
                        }
                        placeholder="Enter value"
                        className={`w-24 sm:w-32 ${
                          abnormal
                            ? "border-red-300 text-red-700 focus-visible:border-red-400 focus-visible:ring-red-200"
                            : ""
                        }`}
                      />
                    ) : (
                      <span
                        className={
                          abnormal ? "font-semibold text-red-700" : ""
                        }
                      >
                        {currentValue || "—"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {test.unit ?? "—"}
                  </TableCell>
                  <TableCell>
                    {abnormal ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                        <AlertCircle className="size-4" />
                        Abnormal
                      </span>
                    ) : currentValue ? (
                      <span className="text-sm text-slate-400">Normal</span>
                    ) : (
                      <span className="text-sm text-slate-300">—</span>
                    )}
                  </TableCell>
                  {hasResults && (
                    <TableCell>
                      <StatusBadge
                        status={existingResult?.status ?? "draft"}
                      />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>

      {latestState.status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {latestState.message}
        </div>
      )}

      {latestState.status === "success" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {latestState.message}
        </div>
      )}

      {isEditable && (
        <div className="flex flex-wrap items-center gap-3">
          <form
            action={() => {
              const fd = buildFormData();
              saveAction(fd);
            }}
          >
            <Button
              type="submit"
              variant="outline"
              disabled={isSaving}
            >
              <Save className="size-4" />
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
          </form>

          <form
            action={() => {
              const fd = buildFormData();
              submitAction(fd);
            }}
          >
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              <SendHorizontal className="size-4" />
              {isSubmitting ? "Submitting..." : "Submit for Review"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
