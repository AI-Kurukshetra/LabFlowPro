"use client";

import { useActionState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createOrder, type ActionState } from "@/lib/actions/orders";
import type { Patient, Panel } from "@/lib/types/database";

type OrderCreateFormProps = {
  patients: Patient[];
  panels: Panel[];
};

export function OrderCreateForm({ patients, panels }: OrderCreateFormProps) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createOrder,
    { status: "idle" },
  );

  useEffect(() => {
    if (state.status === "success") {
      router.push("/orders");
    }
  }, [state.status, router]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="patient_id">Patient</Label>
        <select
          id="patient_id"
          name="patient_id"
          required
          className="h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Select a patient</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.full_name} ({patient.patient_ref})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="panel_id">Panel</Label>
        <select
          id="panel_id"
          name="panel_id"
          className="h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Select a panel (optional)</option>
          {panels.map((panel) => (
            <option key={panel.id} value={panel.id}>
              {panel.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <select
          id="priority"
          name="priority"
          required
          defaultValue="routine"
          className="h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
          <option value="stat">STAT</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Optional notes for this order"
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {state.status === "error" && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Order"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/orders")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
