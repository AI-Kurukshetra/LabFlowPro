import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOrderById } from "@/lib/queries/orders";
import { resolveReferenceRangesForTests } from "@/lib/queries/reference-ranges";
import { getResultsByOrderId } from "@/lib/queries/results";
import { exportPatientResultsCSV } from "@/lib/emr/export-csv";
import { exportPatientResultsJSON } from "@/lib/emr/export-json";
import { exportDiagnosticReport } from "@/lib/emr/export-fhir";
import { hasPermission } from "@/lib/rbac/permissions";
import type { Patient, Profile, Test } from "@/lib/types/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !hasPermission((profile as Profile).role, "export:results")) {
    return NextResponse.json(
      { error: "You don't have permission to export results." },
      { status: 403 },
    );
  }

  const { orderId } = await params;
  const format = request.nextUrl.searchParams.get("format") ?? "csv";

  if (!["csv", "json", "fhir"].includes(format)) {
    return NextResponse.json(
      { error: "Invalid format. Use csv, json, or fhir." },
      { status: 400 },
    );
  }

  let order;
  try {
    order = await getOrderById(supabase, orderId);
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const results = await getResultsByOrderId(supabase, orderId);

  const resultsWithTests = results as (typeof results[number] & {
    tests: Test | null;
  })[];

  const patient: Patient = {
    id: order.patients.id,
    organization_id: null,
    patient_ref: order.patients.patient_ref,
    full_name: order.patients.full_name,
    date_of_birth: null,
    gender: null,
    phone: null,
    email: null,
    external_ref: null,
    status: "active",
    created_at: "",
    updated_at: "",
  };

  // Fetch full patient data if available
  const { data: fullPatient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", order.patients.id)
    .single();

  const patientData = fullPatient ?? patient;
  const resolvedReferenceRanges = await resolveReferenceRangesForTests(
    supabase,
    resultsWithTests
      .map((result) => result.tests)
      .filter((test): test is Test => test !== null),
    patientData,
    order.collection_date ?? order.created_at,
  );

  const orderRef = order.order_ref;

  if (format === "csv") {
    const csv = exportPatientResultsCSV(order, resultsWithTests, resolvedReferenceRanges);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="results-${orderRef}.csv"`,
      },
    });
  }

  if (format === "json") {
    const json = exportPatientResultsJSON(
      order,
      resultsWithTests,
      patientData,
      resolvedReferenceRanges,
    );
    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="results-${orderRef}.json"`,
      },
    });
  }

  // FHIR
  const fhir = exportDiagnosticReport(
    order,
    resultsWithTests,
    patientData,
    resolvedReferenceRanges,
  );
  return new NextResponse(fhir, {
    status: 200,
    headers: {
      "Content-Type": "application/fhir+json",
      "Content-Disposition": `attachment; filename="diagnostic-report-${orderRef}.json"`,
    },
  });
}
