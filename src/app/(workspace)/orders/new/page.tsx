import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderCreateForm } from "@/components/workspace/order-create-form";
import { isSupabaseConfigured } from "@/lib/env";
import { getPatients, getPanels } from "@/lib/queries/patients";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { hasPermission } from "@/lib/rbac/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export default async function NewOrderPage() {
  if (!isSupabaseConfigured()) {
    redirect("/orders");
  }

  const supabase = await createServerSupabaseClient();

  try {
    const profile = await getCurrentProfile(supabase);
    if (!hasPermission(profile.role as UserRole, "orders:create")) {
      redirect("/dashboard");
    }
  } catch {
    redirect("/dashboard");
  }
  const [{ data: patients }, panels] = await Promise.all([
    getPatients(supabase),
    getPanels(supabase),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href="/orders">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">New Order</h1>
          <p className="text-sm text-slate-500">Create a new lab order for a patient.</p>
        </div>
      </div>

      <Card className="max-w-2xl border-slate-200/80 bg-white">
        <CardHeader>
          <CardTitle className="text-base">Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderCreateForm patients={patients} panels={panels} />
        </CardContent>
      </Card>
    </div>
  );
}
