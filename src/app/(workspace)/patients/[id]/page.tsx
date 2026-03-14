import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/workspace/status-badge";
import { PatientStatusActions } from "@/components/workspace/patient-status-actions";
import { isSupabaseConfigured } from "@/lib/env";
import { getPatientById } from "@/lib/queries/patients";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { hasPermission } from "@/lib/rbac/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

type PatientDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-36 shrink-0 text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value}</dd>
    </div>
  );
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
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

  let patient;
  try {
    patient = await getPatientById(supabase, id);
  } catch {
    notFound();
  }

  const orders = patient.orders ?? [];

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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {patient.full_name}
          </h1>
          <p className="text-sm text-slate-600">{patient.patient_ref}</p>
        </div>
        <div className="flex items-center gap-3">
          {hasPermission(userRole, "patients:update") && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/patients/${patient.id}/edit`}>
                <Pencil className="size-4" data-icon="inline-start" />
                Edit Patient
              </Link>
            </Button>
          )}
          <StatusBadge status={patient.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-slate-200/80 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Patient demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <DetailRow label="Reference" value={patient.patient_ref} />
              <DetailRow label="Full name" value={patient.full_name} />
              <DetailRow label="Date of birth" value={formatDate(patient.date_of_birth)} />
              <DetailRow
                label="Gender"
                value={
                  patient.gender
                    ? patient.gender.replace(/\b\w/g, (c) => c.toUpperCase())
                    : "—"
                }
              />
              <DetailRow label="Phone" value={patient.phone ?? "—"} />
              <DetailRow label="Email" value={patient.email ?? "—"} />
              <DetailRow label="Status" value={<StatusBadge status={patient.status} />} />
            </dl>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientStatusActions
              patientId={patient.id}
              currentStatus={patient.status}
              userRole={userRole}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200/80 bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Recent orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>Order Ref</TableHead>
                <TableHead>Panel</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                    No orders found for this patient.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.order_ref}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {order.panels?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {formatDate(order.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
