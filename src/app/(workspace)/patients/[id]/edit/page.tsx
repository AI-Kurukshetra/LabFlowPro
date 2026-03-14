import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PatientEditForm } from "@/components/workspace/patient-edit-form";
import { isSupabaseConfigured } from "@/lib/env";
import { getPatientById } from "@/lib/queries/patients";
import { requirePermission } from "@/lib/rbac/check-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PatientEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientEditPage({ params }: PatientEditPageProps) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  await requirePermission(supabase, "patients:update");

  let patient;
  try {
    patient = await getPatientById(supabase, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/patients/${id}`}>
            <ArrowLeft className="size-4" data-icon="inline-start" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Edit Patient
        </h1>
        <p className="text-sm text-slate-600">{patient.patient_ref}</p>
      </div>

      <PatientEditForm
        patient={{
          id: patient.id,
          full_name: patient.full_name,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          phone: patient.phone,
          email: patient.email,
        }}
      />
    </div>
  );
}
