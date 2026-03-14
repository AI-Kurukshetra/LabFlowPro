import {
  formatResolvedReferenceRange,
  isValueAbnormal,
  type ResolvedReferenceRangeMap,
} from "@/lib/reference-ranges";
import type { Order, Result, Test, OrderWithRelations, Patient } from "@/lib/types/database";

function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCSVRow(fields: string[]): string {
  return fields.map(escapeCSVField).join(",");
}

type ResultWithTest = Result & {
  tests: Test | null;
};

type OrderForCSV = Order & {
  patients: { id: string; full_name: string; patient_ref: string };
  panels: { id: string; name: string } | null;
};

export function exportPatientResultsCSV(
  order: OrderForCSV,
  results: ResultWithTest[],
  resolvedReferenceRanges: ResolvedReferenceRangeMap,
): string {
  const headers = [
    "Patient Name",
    "Patient Ref",
    "Order Ref",
    "Test Name",
    "Value",
    "Unit",
    "Reference Range",
    "Abnormal",
    "Status",
    "Date",
  ];

  const rows = results.map((result) => {
    const range = result.test_id ? resolvedReferenceRanges[result.test_id] : null;
    const rangeStr = formatResolvedReferenceRange(
      range,
      result.unit ?? result.tests?.unit ?? null,
      { includeUnit: false },
    );
    const isAbnormal = result.value
      ? isValueAbnormal(result.value, range)
      : result.is_abnormal === true;

    return toCSVRow([
      order.patients.full_name,
      order.patients.patient_ref,
      order.order_ref,
      result.tests?.name ?? "",
      result.value ?? "",
      result.unit ?? result.tests?.unit ?? "",
      rangeStr,
      isAbnormal ? "Yes" : "No",
      result.status,
      result.created_at ? new Date(result.created_at).toISOString() : "",
    ]);
  });

  return [toCSVRow(headers), ...rows].join("\n");
}

export function exportOrdersCSV(orders: OrderWithRelations[]): string {
  const headers = [
    "Order Ref",
    "Patient Name",
    "Panel",
    "Priority",
    "Status",
    "Collection Date",
    "Created At",
  ];

  const rows = orders.map((order) =>
    toCSVRow([
      order.order_ref,
      order.patients.full_name,
      order.panels?.name ?? "",
      order.priority,
      order.status,
      order.collection_date ?? "",
      order.created_at ? new Date(order.created_at).toISOString() : "",
    ]),
  );

  return [toCSVRow(headers), ...rows].join("\n");
}

export function exportPatientsCSV(patients: Patient[]): string {
  const headers = [
    "Patient Ref",
    "Full Name",
    "DOB",
    "Gender",
    "Phone",
    "Email",
    "Status",
  ];

  const rows = patients.map((patient) =>
    toCSVRow([
      patient.patient_ref,
      patient.full_name,
      patient.date_of_birth ?? "",
      patient.gender ?? "",
      patient.phone ?? "",
      patient.email ?? "",
      patient.status,
    ]),
  );

  return [toCSVRow(headers), ...rows].join("\n");
}
