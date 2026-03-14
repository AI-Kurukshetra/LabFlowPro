import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/workspace/status-badge";
import { SpecimenStatusActions } from "@/components/workspace/specimen-status-actions";
import { isSupabaseConfigured } from "@/lib/env";
import { getSpecimenById } from "@/lib/queries/specimens";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

type SpecimenDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatType(type: string) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-36 shrink-0 text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value}</dd>
    </div>
  );
}

export default async function SpecimenDetailPage({ params }: SpecimenDetailPageProps) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  let userRole: UserRole = "technician";
  try {
    const profile = await getCurrentProfile(supabase);
    userRole = profile.role;
  } catch {
    // Fall back to technician
  }

  let specimen;
  try {
    specimen = await getSpecimenById(supabase, id);
  } catch {
    notFound();
  }

  const order = specimen.orders;
  const patient = order.patients;

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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {specimen.specimen_ref}
          </h1>
          <p className="text-sm text-slate-600">Specimen details</p>
        </div>
        <StatusBadge status={specimen.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200/80 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Specimen information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <DetailRow label="Reference" value={specimen.specimen_ref} />
              <DetailRow label="Barcode" value={specimen.barcode ?? "—"} />
              <DetailRow label="Type" value={formatType(specimen.type)} />
              <DetailRow label="Collector" value={specimen.collector ?? "—"} />
              <DetailRow label="Collected at" value={formatDate(specimen.collected_at)} />
              <DetailRow label="Status" value={<StatusBadge status={specimen.status} />} />
              <DetailRow label="Notes" value={specimen.notes ?? "—"} />
              {specimen.status === "rejected" && specimen.rejection_reason && (
                <DetailRow
                  label="Rejection reason"
                  value={
                    <span className="text-red-600">{specimen.rejection_reason}</span>
                  }
                />
              )}
            </dl>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Linked order</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <DetailRow label="Order ref" value={order.order_ref} />
              <DetailRow label="Patient" value={patient.full_name} />
              <DetailRow label="Patient ref" value={patient.patient_ref} />
              <DetailRow label="Priority" value={<StatusBadge status={order.priority} />} />
              <DetailRow label="Order status" value={<StatusBadge status={order.status} />} />
              <DetailRow label="Collection date" value={formatDate(order.collection_date)} />
              {order.notes && <DetailRow label="Order notes" value={order.notes} />}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200/80 bg-white">
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <SpecimenStatusActions
            specimenId={specimen.id}
            currentStatus={specimen.status}
            userRole={userRole}
          />
        </CardContent>
      </Card>
    </div>
  );
}
