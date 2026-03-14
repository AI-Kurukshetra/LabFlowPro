import { NextResponse } from "next/server";

import {
  formatResolvedReferenceRange,
  isValueAbnormal,
} from "@/lib/reference-ranges";
import { resolveReferenceRangesForTests } from "@/lib/queries/reference-ranges";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getReportById } from "@/lib/queries/reports";
import { getResultsByOrderId } from "@/lib/queries/results";
import { hasPermission } from "@/lib/rbac/permissions";
import type { Profile, Test } from "@/lib/types/database";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFormatLabel(format: string): string {
  switch (format) {
    case "pdf":
      return "PDF";
    case "pdf_csv":
      return "PDF + CSV";
    case "pdf_json":
      return "PDF + JSON";
    default:
      return format.toUpperCase();
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
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

  const role = (profile as Profile).role;
  const isPatient = role === "patient";

  if (!isPatient && !hasPermission(role, "reports:list")) {
    return NextResponse.json(
      { error: "You don't have permission to view reports." },
      { status: 403 },
    );
  }

  const { id } = await params;

  let report;
  try {
    report = await getReportById(supabase, id);
  } catch {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Patients can only view their own released reports
  if (isPatient) {
    const patientId = (profile as Profile & { patient_id?: string }).patient_id;
    if (!patientId || report.patients.id !== patientId || report.status !== "released") {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
  }

  const results = await getResultsByOrderId(supabase, report.order_id);

  const order = report.orders;
  const patient = report.patients;
  const resolvedReferenceRanges = await resolveReferenceRangesForTests(
    supabase,
    results
      .map((result) => result.tests as Test | null)
      .filter((test): test is Test => test !== null),
    patient,
    order.collection_date ?? order.created_at,
  );

  const resultsRows = results
    .map((result) => {
      const test = result.tests as Test | null;
      const range = result.test_id ? resolvedReferenceRanges[result.test_id] : null;
      const rangeStr =
        formatResolvedReferenceRange(range, result.unit ?? test?.unit ?? null, {
          includeUnit: false,
        }) || "\u2014";
      const isAbnormal = result.value
        ? isValueAbnormal(result.value, range)
        : result.is_abnormal === true;
      const flag = isAbnormal ? "Abnormal" : "Normal";
      const flagClass = isAbnormal
        ? "color: #b91c1c; font-weight: 600;"
        : "";

      return `
        <tr>
          <td>${escapeHtml(test?.name ?? "\u2014")}</td>
          <td style="font-weight: 600;">${escapeHtml(result.value ?? "\u2014")}</td>
          <td>${escapeHtml(result.unit ?? test?.unit ?? "\u2014")}</td>
          <td>${escapeHtml(rangeStr)}</td>
          <td style="${flagClass}">${flag}</td>
        </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Laboratory Report \u2014 ${escapeHtml(report.report_ref)}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, "Segoe UI", Helvetica Neue, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1e293b;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      border-bottom: 2px solid #0d9488;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .header h1 {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .header p {
      font-size: 13px;
      color: #64748b;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }

    .info-section h2 {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0d9488;
      margin-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 13px;
    }

    .info-row .label {
      color: #64748b;
      font-weight: 500;
    }

    .info-row .value {
      color: #1e293b;
      font-weight: 600;
      text-align: right;
    }

    .results-section {
      margin-bottom: 28px;
    }

    .results-section h2 {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0d9488;
      margin-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    thead th {
      text-align: left;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: #475569;
      background: #f8fafc;
      padding: 8px 10px;
      border-bottom: 2px solid #e2e8f0;
    }

    tbody td {
      padding: 7px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }

    tbody tr:hover {
      background: #f8fafc;
    }

    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 32px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }

    .print-btn {
      display: inline-block;
      margin-bottom: 24px;
      padding: 8px 20px;
      background: #0d9488;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .print-btn:hover {
      background: #0f766e;
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>

  <div class="header">
    <h1>Metro Clinical Labs \u2014 Laboratory Report</h1>
    <p>${escapeHtml(report.report_ref)}</p>
  </div>

  <div class="info-grid">
    <div class="info-section">
      <h2>Patient Information</h2>
      <div class="info-row">
        <span class="label">Name</span>
        <span class="value">${escapeHtml(patient.full_name)}</span>
      </div>
      <div class="info-row">
        <span class="label">Date of Birth</span>
        <span class="value">${formatDate(patient.date_of_birth)}</span>
      </div>
      <div class="info-row">
        <span class="label">Gender</span>
        <span class="value">${patient.gender ? escapeHtml(patient.gender.replace(/\b\w/g, (c: string) => c.toUpperCase())) : "\u2014"}</span>
      </div>
      <div class="info-row">
        <span class="label">Patient Ref</span>
        <span class="value">${escapeHtml(patient.patient_ref)}</span>
      </div>
    </div>

    <div class="info-section">
      <h2>Order Information</h2>
      <div class="info-row">
        <span class="label">Order Ref</span>
        <span class="value">${escapeHtml(order.order_ref)}</span>
      </div>
      <div class="info-row">
        <span class="label">Panel</span>
        <span class="value">${escapeHtml(order.panels?.name ?? "\u2014")}</span>
      </div>
      <div class="info-row">
        <span class="label">Collection Date</span>
        <span class="value">${formatDate(order.collection_date)}</span>
      </div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-section">
      <h2>Report Details</h2>
      <div class="info-row">
        <span class="label">Report Ref</span>
        <span class="value">${escapeHtml(report.report_ref)}</span>
      </div>
      <div class="info-row">
        <span class="label">Version</span>
        <span class="value">${report.version}</span>
      </div>
      <div class="info-row">
        <span class="label">Format</span>
        <span class="value">${formatFormatLabel(report.format)}</span>
      </div>
      <div class="info-row">
        <span class="label">Released</span>
        <span class="value">${formatDateTime(report.released_at)}</span>
      </div>
      <div class="info-row">
        <span class="label">Released By</span>
        <span class="value">${escapeHtml(report.released_by ?? "\u2014")}</span>
      </div>
    </div>
  </div>

  <div class="results-section">
    <h2>Test Results</h2>
    <table>
      <thead>
        <tr>
          <th>Test Name</th>
          <th>Value</th>
          <th>Unit</th>
          <th>Reference Range</th>
          <th>Flag</th>
        </tr>
      </thead>
      <tbody>
        ${resultsRows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:20px;">No results available</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>This report was generated by LabFlow Pro</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
