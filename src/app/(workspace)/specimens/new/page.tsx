import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SpecimenCreateForm } from "@/components/workspace/specimen-create-form";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { hasPermission } from "@/lib/rbac/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export default async function NewSpecimenPage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();

  try {
    const profile = await getCurrentProfile(supabase);
    if (!hasPermission(profile.role as UserRole, "specimens:create")) {
      redirect("/dashboard");
    }
  } catch {
    redirect("/dashboard");
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_ref, status, patients(full_name), panels(name)")
    .neq("status", "released")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const orderOptions = (orders ?? []).map((order) => {
    const patient = order.patients as unknown as { full_name: string } | null;
    const panel = order.panels as unknown as { name: string } | null;
    return {
      id: order.id,
      order_ref: order.order_ref,
      patient_name: patient?.full_name ?? "Unknown",
      panel_name: panel?.name ?? "No panel",
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/specimens">
            <ArrowLeft className="size-4" data-icon="inline-start" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          New Specimen
        </h1>
        <p className="text-sm text-slate-600">
          Register a new specimen against an existing order.
        </p>
      </div>

      <SpecimenCreateForm orders={orderOptions} />
    </div>
  );
}
