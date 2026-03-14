import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured } from "@/lib/env";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const configured = isSupabaseConfigured();
  const params = await searchParams;
  const redirectTo =
    typeof params.next === "string" && params.next.startsWith("/")
      ? params.next
      : "/dashboard";

  return (
    <AuthShell>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500">
            Sign in to your LabFlow Pro workspace.
          </p>
        </div>

        <LoginForm disabled={!configured} redirectTo={redirectTo} />

        <div className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-slate-950 hover:text-primary">
            Sign up
          </Link>
        </div>

        <div className="text-center text-sm text-slate-500">
          Are you a patient?{" "}
          <Link href="/patient-signup" className="font-medium text-slate-950 hover:text-primary">
            Create a patient account
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
