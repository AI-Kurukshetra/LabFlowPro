import {
  formatResolvedReferenceRange,
  isValueAbnormal,
  type ResolvedReferenceRangeMap,
} from "@/lib/reference-ranges";
import type { Order, Result, Patient, Test } from "@/lib/types/database";

type ResultWithTest = Result & {
  tests: Test | null;
};

type OrderForFHIR = Order & {
  patients: { id: string; full_name: string; patient_ref: string };
  panels: { id: string; name: string } | null;
};

function mapOrderStatusToFHIR(status: string): "final" | "preliminary" | "registered" {
  switch (status) {
    case "released":
      return "final";
    case "review":
    case "in_process":
      return "preliminary";
    default:
      return "registered";
  }
}

function buildObservation(
  result: ResultWithTest,
  resolvedReferenceRanges: ResolvedReferenceRangeMap,
) {
  const observation: Record<string, unknown> = {
    resourceType: "Observation",
    id: result.id,
    status: result.status === "released" || result.status === "approved" ? "final" : "preliminary",
    code: {
      display: result.tests?.name ?? "Unknown Test",
    },
  };

  if (result.value !== null) {
    const numericValue = parseFloat(result.value);
    if (!isNaN(numericValue)) {
      observation.valueQuantity = {
        value: numericValue,
        unit: result.unit ?? result.tests?.unit ?? "",
      };
    } else {
      observation.valueString = result.value;
    }
  }

  const range = result.test_id ? resolvedReferenceRanges[result.test_id] : null;
  if (range && (range.low !== null || range.high !== null || range.textRange)) {
    observation.referenceRange = [
      {
        ...(range.low !== null ? { low: { value: Number(range.low) } } : {}),
        ...(range.high !== null ? { high: { value: Number(range.high) } } : {}),
        text: formatResolvedReferenceRange(range, result.unit ?? result.tests?.unit ?? null, {
          includeUnit: true,
        }),
        ...(range.population
          ? {
              appliesTo: [{ text: range.population }],
            }
          : {}),
      },
    ];
  }

  const isAbnormal = result.value
    ? isValueAbnormal(result.value, range)
    : result.is_abnormal === true;

  observation.interpretation = [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
          code: isAbnormal ? "A" : "N",
          display: isAbnormal ? "Abnormal" : "Normal",
        },
      ],
    },
  ];

  return observation;
}

export function exportDiagnosticReport(
  order: OrderForFHIR,
  results: ResultWithTest[],
  patient: Patient,
  resolvedReferenceRanges: ResolvedReferenceRangeMap,
): string {
  const report = {
    resourceType: "DiagnosticReport",
    id: order.id,
    status: mapOrderStatusToFHIR(order.status),
    code: {
      coding: [
        {
          system: "http://loinc.org",
          display: order.panels?.name ?? "Laboratory Report",
        },
      ],
    },
    subject: {
      reference: `Patient/${patient.id}`,
      display: patient.full_name,
    },
    effectiveDateTime: order.collection_date ?? order.created_at,
    issued: order.updated_at,
    result: results.map((result) => buildObservation(result, resolvedReferenceRanges)),
  };

  return JSON.stringify(report, null, 2);
}
