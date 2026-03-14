import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ReportCreateForm } from "@/components/workspace/report-create-form";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { hasPermission } from "@/lib/rbac/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export default async function NewReportPage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();

  try {
    const profile = await getCurrentProfile(supabase);
    if (!hasPermission(profile.role as UserRole, "reports:generate")) {
      redirect("/dashboard");
    }
  } catch {
    redirect("/dashboard");
  }

  // Fetch orders that have at least one approved or released result
  const { data: resultsWithOrders, error: resultsError } = await supabase
    .from("results")
    .select("order_id")
    .in("status", ["approved", "released"]);

  if (resultsError) {
    throw resultsError;
  }

  const orderIdsWithResults = [
    ...new Set((resultsWithOrders ?? []).map((r) => r.order_id)),
  ];

  let orderOptions: {
    id: string;
    order_ref: string;
    patient_name: string;
    panel_name: string;
  }[] = [];

  if (orderIdsWithResults.length > 0) {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, order_ref, patients(full_name), panels(name)")
      .in("id", orderIdsWithResults)
      .order("created_at", { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    orderOptions = (orders ?? []).map((order) => {
      const patient = order.patients as unknown as { full_name: string } | null;
      const panel = order.panels as unknown as { name: string } | null;
      return {
        id: order.id,
        order_ref: order.order_ref,
        patient_name: patient?.full_name ?? "Unknown",
        panel_name: panel?.name ?? "No panel",
      };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/reports">
            <ArrowLeft className="size-4" data-icon="inline-start" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Generate Report
        </h1>
        <p className="text-sm text-slate-600">
          Create a report from an order with approved results.
        </p>
      </div>

      <ReportCreateForm orders={orderOptions} />
    </div>
  );
}
