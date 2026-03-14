"use client";

import { useActionState, useId } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSpecimen, type ActionState } from "@/lib/actions/specimens";

type OrderOption = {
  id: string;
  order_ref: string;
  patient_name: string;
  panel_name: string;
};

type SpecimenCreateFormProps = {
  orders: OrderOption[];
};

function generateSpecimenRef() {
  const now = Date.now().toString(36).toUpperCase().slice(-6);
  return `SP-${now}`;
}

export function SpecimenCreateForm({ orders }: SpecimenCreateFormProps) {
  const formId = useId();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createSpecimen,
    { status: "idle" },
  );

  useEffect(() => {
    if (state.status === "success" && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push("/specimens");
    }
  }, [state.status, router]);

  const selectClassName =
    "h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50";

  return (
    <Card className="max-w-2xl border border-slate-200/80 bg-white">
      <CardHeader>
        <CardTitle className="text-base">Specimen details</CardTitle>
      </CardHeader>
      <CardContent>
        {state.status === "error" && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message}
          </p>
        )}

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="specimen_ref" value={generateSpecimenRef()} />

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
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-type`}>Specimen type</Label>
            <select
              id={`${formId}-type`}
              name="type"
              required
              className={selectClassName}
            >
              <option value="">Select type...</option>
              <option value="serum">Serum</option>
              <option value="plasma">Plasma</option>
              <option value="whole_blood">Whole Blood</option>
              <option value="urine">Urine</option>
              <option value="csf">CSF</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-collector`}>Collector name</Label>
            <Input
              id={`${formId}-collector`}
              name="collector"
              placeholder="e.g. J. Smith"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-barcode`}>Barcode (optional)</Label>
            <Input
              id={`${formId}-barcode`}
              name="barcode"
              placeholder="Scan or enter barcode"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-notes`}>Notes</Label>
            <textarea
              id={`${formId}-notes`}
              name="notes"
              rows={3}
              placeholder="Additional notes..."
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Specimen"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/specimens")}
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
