import { redirect } from "next/navigation";
import {
  ArrowLeftRight,
  Download,
  FileJson,
  FileSpreadsheet,
  Heart,
  Plug2,
  Radio,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { hasPermission } from "@/lib/rbac/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

function IconContainer({
  children,
  className = "bg-primary/8 text-primary",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex size-10 items-center justify-center rounded-lg ${className}`}
    >
      {children}
    </div>
  );
}

export default async function IntegrationsPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    try {
      const profile = await getCurrentProfile(supabase);
      if (!hasPermission(profile.role as UserRole, "integrations:access")) {
        redirect("/dashboard");
      }
    } catch {
      redirect("/dashboard");
    }
  }
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Integrations & Data Exchange
        </h1>
        <p className="text-sm text-slate-500">
          Export lab data in standard formats for downstream systems and EMR
          connectivity.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-950">
          Export Capabilities
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-slate-200/80 bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconContainer>
                  <FileSpreadsheet className="size-5" />
                </IconContainer>
                <div>
                  <CardTitle className="text-base">Patient Data</CardTitle>
                  <CardDescription className="text-sm">
                    Demographics and contact info
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-slate-600">
                Export patient records including name, DOB, gender, phone,
                email, and status.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">CSV</Badge>
                <Badge variant="secondary">JSON</Badge>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="xs" asChild>
                  <a href="/api/export/patients?format=csv">
                    <Download className="size-3" data-icon="inline-start" />
                    CSV
                  </a>
                </Button>
                <Button variant="outline" size="xs" asChild>
                  <a href="/api/export/patients?format=json">
                    <Download className="size-3" data-icon="inline-start" />
                    JSON
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconContainer>
                  <FileJson className="size-5" />
                </IconContainer>
                <div>
                  <CardTitle className="text-base">Order Data</CardTitle>
                  <CardDescription className="text-sm">
                    Lab orders with status and priority
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-slate-600">
                Export orders including patient, panel, priority, status, and
                collection dates.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">CSV</Badge>
                <Badge variant="secondary">JSON</Badge>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="xs" asChild>
                  <a href="/api/export/orders?format=csv">
                    <Download className="size-3" data-icon="inline-start" />
                    CSV
                  </a>
                </Button>
                <Button variant="outline" size="xs" asChild>
                  <a href="/api/export/orders?format=json">
                    <Download className="size-3" data-icon="inline-start" />
                    JSON
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconContainer>
                  <Heart className="size-5" />
                </IconContainer>
                <div>
                  <CardTitle className="text-base">Result Data</CardTitle>
                  <CardDescription className="text-sm">
                    Test results with FHIR support
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-slate-600">
                Export results per order in CSV, JSON, or FHIR R4
                DiagnosticReport format.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">CSV</Badge>
                <Badge variant="secondary">JSON</Badge>
                <Badge variant="secondary">FHIR R4</Badge>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Export from individual order detail pages.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-950">
          Supported Standards
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-slate-200/80 bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconContainer className="bg-emerald-100 text-emerald-700">
                  <ArrowLeftRight className="size-5" />
                </IconContainer>
                <CardTitle className="text-base">FHIR R4</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Simplified FHIR R4 DiagnosticReport and Observation resources.
                Compatible with EMR systems that accept FHIR bundles.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconContainer className="bg-sky-100 text-sky-700">
                  <FileSpreadsheet className="size-5" />
                </IconContainer>
                <CardTitle className="text-base">CSV</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Universal spreadsheet format. Import directly into Excel,
                Google Sheets, or any data analysis tool.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconContainer className="bg-amber-100 text-amber-700">
                  <FileJson className="size-5" />
                </IconContainer>
                <CardTitle className="text-base">JSON</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Structured data exchange format. Use for programmatic
                integrations and custom data pipelines.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-950">Coming Soon</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-slate-200/80 bg-white opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconContainer className="bg-slate-100 text-slate-500">
                  <Radio className="size-5" />
                </IconContainer>
                <div>
                  <CardTitle className="text-base">HL7v2 Messaging</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    Planned
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                ADT, ORM, and ORU message support for legacy EMR systems that
                rely on HL7v2 interfaces.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 bg-white opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconContainer className="bg-slate-100 text-slate-500">
                  <Plug2 className="size-5" />
                </IconContainer>
                <div>
                  <CardTitle className="text-base">
                    Epic MyChart
                  </CardTitle>
                  <Badge variant="outline" className="mt-1">
                    Planned
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Direct integration with Epic MyChart for patient result
                delivery and order synchronization.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 bg-white opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <IconContainer className="bg-slate-100 text-slate-500">
                  <ArrowLeftRight className="size-5" />
                </IconContainer>
                <div>
                  <CardTitle className="text-base">
                    FHIR API Endpoint
                  </CardTitle>
                  <Badge variant="outline" className="mt-1">
                    Planned
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                RESTful FHIR server endpoint enabling external systems to query
                patient results directly.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
