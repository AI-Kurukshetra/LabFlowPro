import {
  formatResolvedReferenceRange,
  isValueAbnormal,
  type ResolvedReferenceRangeMap,
} from "@/lib/reference-ranges";
import type { Order, Result, Patient, OrderWithRelations, Test } from "@/lib/types/database";

type ResultWithTest = Result & {
  tests: Test | null;
};

type OrderForJSON = Order & {
  patients: { id: string; full_name: string; patient_ref: string };
  panels: { id: string; name: string } | null;
};

export function exportPatientResultsJSON(
  order: OrderForJSON,
  results: ResultWithTest[],
  patient: Patient,
  resolvedReferenceRanges: ResolvedReferenceRangeMap,
): string {
  const output = {
    exportedAt: new Date().toISOString(),
    patient: {
      id: patient.id,
      patientRef: patient.patient_ref,
      fullName: patient.full_name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
    },
    order: {
      id: order.id,
      orderRef: order.order_ref,
      panel: order.panels?.name ?? null,
      priority: order.priority,
      status: order.status,
      collectionDate: order.collection_date,
      createdAt: order.created_at,
    },
    results: results.map((result) => {
      const range = result.test_id ? resolvedReferenceRanges[result.test_id] : null;
      const isAbnormal = result.value
        ? isValueAbnormal(result.value, range)
        : result.is_abnormal ?? false;
      const referenceRange = range
        ? {
            low: range.low,
            high: range.high,
            text: range.textRange,
            display: formatResolvedReferenceRange(range, result.unit ?? result.tests?.unit ?? null, {
              includeUnit: true,
            }),
            label: range.label,
            methodology: range.methodology,
            population: range.population,
          }
        : null;

      return {
        id: result.id,
        testName: result.tests?.name ?? null,
        value: result.value,
        unit: result.unit ?? result.tests?.unit ?? null,
        isAbnormal,
        status: result.status,
        referenceRange,
        reviewedAt: result.reviewed_at,
        approvedAt: result.approved_at,
      };
    }),
  };

  return JSON.stringify(output, null, 2);
}

export function exportOrdersJSON(orders: OrderWithRelations[]): string {
  const output = {
    exportedAt: new Date().toISOString(),
    orders: orders.map((order) => ({
      id: order.id,
      orderRef: order.order_ref,
      patientName: order.patients.full_name,
      panel: order.panels?.name ?? null,
      priority: order.priority,
      status: order.status,
      collectionDate: order.collection_date,
      createdAt: order.created_at,
    })),
  };

  return JSON.stringify(output, null, 2);
}

export function exportPatientsJSON(patients: Patient[]): string {
  const output = {
    exportedAt: new Date().toISOString(),
    patients: patients.map((patient) => ({
      id: patient.id,
      patientRef: patient.patient_ref,
      fullName: patient.full_name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      status: patient.status,
    })),
  };

  return JSON.stringify(output, null, 2);
}
