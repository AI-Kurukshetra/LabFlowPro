"use client";

import { useActionState, useId } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePatient, type ActionState } from "@/lib/actions/patients";

type PatientEditFormProps = {
  patient: {
    id: string;
    full_name: string;
    date_of_birth: string | null;
    gender: string | null;
    phone: string | null;
    email: string | null;
  };
};

export function PatientEditForm({ patient }: PatientEditFormProps) {
  const formId = useId();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updatePatient,
    { status: "idle" },
  );

  useEffect(() => {
    if (state.status === "success" && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push(`/patients/${patient.id}`);
    }
  }, [state.status, router, patient.id]);

  const selectClassName =
    "h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50";

  return (
    <Card className="max-w-2xl border border-slate-200/80 bg-white">
      <CardHeader>
        <CardTitle className="text-base">Edit patient details</CardTitle>
      </CardHeader>
      <CardContent>
        {state.status === "error" && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.message}
          </p>
        )}

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={patient.id} />

          <div className="space-y-2">
            <Label htmlFor={`${formId}-full_name`}>Full Name *</Label>
            <Input
              id={`${formId}-full_name`}
              name="full_name"
              placeholder="e.g. Jane Smith"
              defaultValue={patient.full_name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-date_of_birth`}>Date of Birth</Label>
            <Input
              id={`${formId}-date_of_birth`}
              name="date_of_birth"
              type="date"
              defaultValue={patient.date_of_birth ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-gender`}>Gender</Label>
            <select
              id={`${formId}-gender`}
              name="gender"
              defaultValue={patient.gender ?? ""}
              className={selectClassName}
            >
              <option value="">Select gender...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-phone`}>Phone</Label>
            <Input
              id={`${formId}-phone`}
              name="phone"
              type="tel"
              placeholder="e.g. (555) 123-4567"
              defaultValue={patient.phone ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${formId}-email`}>Email</Label>
            <Input
              id={`${formId}-email`}
              name="email"
              type="email"
              placeholder="e.g. jane@example.com"
              defaultValue={patient.email ?? ""}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/patients/${patient.id}`)}
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
