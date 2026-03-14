import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { PatientSignupForm } from "@/components/auth/patient-signup-form";
import { isSupabaseConfigured } from "@/lib/env";

const patientFeatures = [
  "View your lab results online",
  "Understand your test results with AI",
  "Track your health history",
];

export default function PatientSignupPage() {
  const configured = isSupabaseConfigured();

  return (
    <AuthShell>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Create your patient account
          </h1>
          <p className="text-sm text-slate-500">
            Access your lab results and reports through the patient portal.
          </p>
        </div>

        <ul className="space-y-2">
          {patientFeatures.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="size-4 shrink-0 text-teal-500" />
              {feature}
            </li>
          ))}
        </ul>

        <PatientSignupForm disabled={!configured} />

        <div className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-slate-950 hover:text-primary">
            Sign in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
