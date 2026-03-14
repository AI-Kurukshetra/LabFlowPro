import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PatientCreateForm } from "@/components/workspace/patient-create-form";
import { isSupabaseConfigured } from "@/lib/env";
import { hasPermission } from "@/lib/rbac/permissions";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export default async function NewPatientPage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  try {
    const profile = await getCurrentProfile(supabase);
    if (!hasPermission(profile.role as UserRole, "patients:create")) {
      redirect("/dashboard");
    }
  } catch {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/patients">
            <ArrowLeft className="size-4" data-icon="inline-start" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          New Patient
        </h1>
        <p className="text-sm text-slate-600">
          Register a new patient record.
        </p>
      </div>

      <PatientCreateForm />
    </div>
  );
}
