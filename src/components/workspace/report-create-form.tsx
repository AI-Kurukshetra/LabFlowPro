"use client";

import { useActionState, useId } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { generateReport, type ActionState } from "@/lib/actions/reports";

type OrderOption = {
  id: string;
  order_ref: string;
  patient_name: string;
  panel_name: string;
};

type ReportCreateFormProps = {
  orders: OrderOption[];
};

export function ReportCreateForm({ orders }: ReportCreateFormProps) {
  const formId = useId();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    generateReport,
    { status: "idle" },
  );

  useEffect(() => {
    if (state.status === "success" && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push("/reports");
    }
  }, [state.status, router]);

  const selectClassName =
    "h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50";

  return (
    <Card className="max-w-2xl border border-slate-200/80 bg-white">
      <CardHeader>
        <CardTitle className="text-base">Report details</CardTitle>
      </CardHeader>
      <CardContent>
        {state.status === "error" && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message}
          </p>
        )}

        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor={`${formId}-order`}>Order</Label>
            <select
              id={`${formId}-order`}
              name="order_id"
              required
              className={selectClassName}
            >
              <option value="">Select an order...</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.order_ref} — {order.patient_name} ({order.panel_name})
                </option>
              ))}
            </select>
            {orders.length === 0 && (
              <p className="text-sm text-slate-500">
                No orders with approved or released results available.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-format`}>Format</Label>
            <select
              id={`${formId}-format`}
              name="format"
              required
              className={selectClassName}
            >
              <option value="">Select format...</option>
              <option value="pdf">PDF</option>
              <option value="pdf_csv">PDF + CSV</option>
              <option value="pdf_json">PDF + JSON</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending || orders.length === 0}>
              {isPending ? "Generating..." : "Generate Report"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/reports")}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
