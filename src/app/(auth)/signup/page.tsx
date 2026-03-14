import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { isSupabaseConfigured } from "@/lib/env";

export default function SignupPage() {
  const configured = isSupabaseConfigured();

  return (
    <AuthShell>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Create an account
          </h1>
          <p className="text-sm text-slate-500">
            Get started with LabFlow Pro for your lab.
          </p>
        </div>

        <SignupForm disabled={!configured} />

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
