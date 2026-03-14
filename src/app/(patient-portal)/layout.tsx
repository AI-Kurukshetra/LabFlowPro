import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { PortalShell } from "@/components/portal/portal-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { getPatientProfile } from "@/lib/queries/portal";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

type PortalLayoutProps = {
  children: ReactNode;
};

export default async function PortalLayout({ children }: PortalLayoutProps) {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profile;
  try {
    profile = await getPatientProfile(supabase);
  } catch {
    redirect("/login");
  }

  if (profile.role !== "patient") {
    redirect("/dashboard");
  }

  const patient = profile.patients;

  if (!patient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-slate-950">
              Account not linked
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Your account has not been linked to a patient record yet. Please
              contact your healthcare provider to connect your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PortalShell
      patientName={patient.full_name}
      patientRef={patient.patient_ref}
    >
      {children}
    </PortalShell>
  );
}
