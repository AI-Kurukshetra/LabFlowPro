import Link from "next/link";
import { Download, Plus, Users2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterBar } from "@/components/workspace/filter-bar";
import { MetricCard } from "@/components/workspace/metric-card";
import { ModulePage } from "@/components/workspace/module-page";
import { Pagination } from "@/components/workspace/pagination";
import { StatusBadge } from "@/components/workspace/status-badge";
import { isSupabaseConfigured } from "@/lib/env";
import { modulePageData } from "@/lib/mock-data";
import { getPatients, getPatientMetrics } from "@/lib/queries/patients";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { hasPermission } from "@/lib/rbac/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

const PAGE_SIZE = 10;

type PatientsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const genderColors: Record<string, string> = {
  male: "bg-sky-100 text-sky-700 border-sky-200",
  female: "bg-violet-100 text-violet-700 border-violet-200",
  other: "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  if (!isSupabaseConfigured()) {
    return <ModulePage data={modulePageData.patients} />;
  }

  const params = await searchParams;
  const statusFilter = typeof params.status === "string" ? params.status : undefined;
  const searchFilter = typeof params.search === "string" ? params.search : undefined;
  const currentPage = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);

  const supabase = await createServerSupabaseClient();

  let canCreate = false;
  let canExport = false;
  try {
    const profile = await getCurrentProfile(supabase);
    canCreate = hasPermission(profile.role as UserRole, "patients:create");
    canExport = hasPermission(profile.role as UserRole, "export:patients");
  } catch {
    // Fall back to no permissions
  }

  const [{ data: patients, count: totalCount }, metrics] = await Promise.all([
    getPatients(supabase, {
      status: statusFilter,
      search: searchFilter,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    getPatientMetrics(supabase),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const statusFilterOptions = [
    { value: "active", label: "Active" },
    { value: "merged", label: "Merged" },
    { value: "inactive", label: "Inactive" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Patients
            </h1>
            <Badge variant="secondary" className="text-xs">
              {totalCount} total
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Manage patient demographics and order history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canExport && (
            <Button variant="outline" asChild>
              <a href="/api/export/patients?format=csv">
                <Download className="size-4" data-icon="inline-start" />
                Export
              </a>
            </Button>
          )}
          {canCreate && (
            <Button asChild>
              <Link href="/patients/new">
                <Plus className="size-4" data-icon="inline-start" />
                New Patient
              </Link>
            </Button>
          )}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          metric={{
            label: "Active records",
            value: String(metrics.active),
            helper: "Current organization scope",
          }}
          accentColor="border-t-teal-500"
          href="/patients?status=active"
        />
        <MetricCard
          metric={{
            label: "New today",
            value: String(metrics.newToday),
            helper: "Created by intake and support staff",
          }}
          accentColor="border-t-sky-500"
          href="/patients?status=active"
        />
        <MetricCard
          metric={{
            label: "Duplicate flags",
            value: String(metrics.duplicateFlags),
            helper: "Records needing merge review",
          }}
          accentColor="border-t-amber-500"
          href="/patients?status=merged"
        />
      </section>

      <FilterBar
        filters={[
          {
            key: "status",
            label: "All statuses",
            options: statusFilterOptions,
          },
        ]}
        searchPlaceholder="Search by name, ref, phone, or email..."
      />

      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead>Patient Ref</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <Users2 className="size-6" />
                    </span>
                    <div>
                      <p className="font-medium text-slate-700">No patients found</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Register a new patient to get started.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Link
                      href={`/patients/${patient.id}`}
                      className="font-mono text-sm font-medium text-primary hover:underline"
                    >
                      {patient.patient_ref}
                    </Link>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {patient.full_name}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatDate(patient.date_of_birth)}
                  </TableCell>
                  <TableCell>
                    {patient.gender ? (
                      <Badge
                        variant="outline"
                        className={genderColors[patient.gender] ?? genderColors.other}
                      >
                        {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">{"\u2014"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {patient.phone ?? "\u2014"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {patient.email ?? "\u2014"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={patient.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
