import Link from "next/link";
import { FileCheck2, MessageCircle, TestTube2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPatientProfile, getPatientResults } from "@/lib/queries/portal";

export default async function PortalResultsPage() {
  const supabase = await createServerSupabaseClient();
  const profile = await getPatientProfile(supabase);
  const patient = profile.patients!;

  let orders: Awaited<ReturnType<typeof getPatientResults>> = [];
  try {
    orders = await getPatientResults(supabase, patient.id);
  } catch {
    // Use empty list on error
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Results
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">My Lab Results</h1>
        <p className="mt-1 text-sm text-slate-600">
          View your released laboratory test results
        </p>
      </div>

      {/* Results table */}
      {orders.length === 0 ? (
        <Card className="border border-slate-200 rounded-xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <TestTube2 className="size-6" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-950">
              No results available yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Your released lab results will appear here once your healthcare
              provider has reviewed and approved them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Date</TableHead>
                <TableHead>Panel</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">AI Help</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const releasedCount = order.results.filter(
                  (r) => r.status === "released"
                ).length;
                const orderDate = new Date(
                  order.collection_date ?? order.created_at
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <TableRow key={order.id} className="transition-colors hover:bg-slate-50">
                    <TableCell>
                      <Link
                        href={`/portal/results/${order.id}`}
                        className="font-medium text-slate-950 hover:text-teal-700"
                      >
                        {orderDate}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {order.panels?.name ?? "Individual tests"}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-500">
                      {releasedCount} test{releasedCount !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        <FileCheck2 className="mr-1 size-3" />
                        Released
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/portal/chat?prompt=${encodeURIComponent(`Explain my ${order.panels?.name ?? "lab"} results from ${orderDate} in simple terms.`)}`}>
                          <MessageCircle className="size-3.5" />
                          Ask AI
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
