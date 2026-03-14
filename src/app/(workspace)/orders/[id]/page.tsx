import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
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
import { OrderStatusActions } from "@/components/workspace/order-status-actions";
import { ExportButtons } from "@/components/workspace/export-buttons";
import { isSupabaseConfigured } from "@/lib/env";
import { getOrderById } from "@/lib/queries/orders";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OrderStatus, UserRole } from "@/lib/types/database";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
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

  let order;
  try {
    order = await getOrderById(supabase, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/orders">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {order.order_ref}
            </h1>
            <p className="text-sm text-slate-500">Order details and linked records</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href={`/results/order/${order.id}`}>
              <FileText data-icon="inline-start" className="size-4" />
              Enter Results
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <Card className="border-slate-200/80 bg-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-slate-500">Order Ref</dt>
                <dd className="mt-1 text-sm text-slate-950">{order.order_ref}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Patient</dt>
                <dd className="mt-1 text-sm text-slate-950">
                  {order.patients.full_name} ({order.patients.patient_ref})
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Panel</dt>
                <dd className="mt-1 text-sm text-slate-950">
                  {order.panels?.name ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Priority</dt>
                <dd className="mt-1">
                  <StatusBadge status={order.priority} />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={order.status} />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Collection Date</dt>
                <dd className="mt-1 text-sm text-slate-950">
                  {order.collection_date
                    ? new Date(order.collection_date).toLocaleString()
                    : "-"}
                </dd>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Notes</dt>
                  <dd className="mt-1 text-sm text-slate-600">{order.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white lg:w-64 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderStatusActions
              orderId={order.id}
              currentStatus={order.status as OrderStatus}
              userRole={userRole}
            />
            {order.status === "released" && (
              <p className="text-sm text-slate-500">This order has been released.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {order.specimens.length > 0 && (
        <Card className="border-slate-200/80 bg-white">
          <CardHeader>
            <CardTitle className="text-base">
              Specimens ({order.specimens.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead>Specimen Ref</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Collector</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.specimens.map((specimen) => (
                  <TableRow key={specimen.id}>
                    <TableCell className="font-medium">{specimen.specimen_ref}</TableCell>
                    <TableCell className="capitalize">
                      {specimen.type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>{specimen.collector ?? "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={specimen.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {order.results.length > 0 && (
        <Card className="border-slate-200/80 bg-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">
              Results ({order.results.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead>Test</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      {result.tests?.name ?? "-"}
                    </TableCell>
                    <TableCell>{result.value ?? "-"}</TableCell>
                    <TableCell>{result.unit ?? result.tests?.unit ?? "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={result.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {order.results.length > 0 && (
        <Card className="border-slate-200/80 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Export Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-slate-500">
              Download results for this order in your preferred format.
            </p>
            <ExportButtons
              baseUrl={`/api/export/results/${order.id}`}
              formats={["csv", "json", "fhir"]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
