/**
 * Seed script for LabFlow Pro
 *
 * IMPORTANT: Before running this script, you must first run `schema.sql`
 * in the Supabase Dashboard SQL Editor (Dashboard > SQL Editor > New Query).
 *
 * Then run this script:
 *   npx tsx supabase/seed.ts
 */

import { createClient } from "@supabase/supabase-js";
import {
  buildSeedReferenceRangeRows,
  buildSeedTests,
} from "./reference-range-catalog";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  console.error(
    "Find your service role key in: Supabase Dashboard > Settings > API > service_role"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ORG_ID = "a1b2c3d4-0000-4000-8000-000000000001";

function ruleId(n: number): string {
  return `aa000001-0000-4000-8000-${n.toString().padStart(12, "0")}`;
}

async function seed() {
  console.log("Seeding LabFlow Pro...\n");

  // 1. Organization
  console.log("1/8 Organization...");
  const { error: orgErr } = await supabase
    .from("organizations")
    .upsert({ id: ORG_ID, name: "Metro Clinical Labs" }, { onConflict: "id" });
  if (orgErr) throw orgErr;

  // 2. Tests (26 clinical chemistry tests)
  console.log("2/8 Tests...");
  const tests = buildSeedTests(
    ORG_ID,
    (n) => `a0000001-0000-4000-8000-${n.toString().padStart(12, "0")}`,
  );

  const { error: testErr } = await supabase.from("tests").upsert(tests, { onConflict: "id" });
  if (testErr) throw testErr;
  const referenceRangeRules = buildSeedReferenceRangeRows(
    ORG_ID,
    (n) => `a0000001-0000-4000-8000-${n.toString().padStart(12, "0")}`,
    ruleId,
  );
  const { error: rangeErr } = await supabase
    .from("test_reference_ranges")
    .upsert(referenceRangeRules, { onConflict: "id" });
  if (rangeErr) throw rangeErr;

  // 3. Panels
  console.log("3/8 Panels...");
  const panels = [
    { id: "b0000001-0000-4000-8000-000000000001", name: "Basic Metabolic Panel (BMP)" },
    { id: "b0000001-0000-4000-8000-000000000002", name: "Comprehensive Metabolic Panel (CMP)" },
    { id: "b0000001-0000-4000-8000-000000000003", name: "Electrolytes" },
    { id: "b0000001-0000-4000-8000-000000000004", name: "Liver Function" },
    { id: "b0000001-0000-4000-8000-000000000005", name: "Lipid Panel" },
    { id: "b0000001-0000-4000-8000-000000000006", name: "Renal Function" },
  ].map((p) => ({ ...p, organization_id: ORG_ID }));

  const { error: panelErr } = await supabase.from("panels").upsert(panels, { onConflict: "id" });
  if (panelErr) throw panelErr;

  // Panel-test mappings
  const panelTests = [
    // BMP
    ...["01","02","03","04","05","06","07","08"].map(n => ({ panel_id: "b0000001-0000-4000-8000-000000000001", test_id: `a0000001-0000-4000-8000-0000000000${n}` })),
    // CMP (BMP + liver markers)
    ...["01","02","03","04","05","06","07","08","09","10","11","12","13","14"].map(n => ({ panel_id: "b0000001-0000-4000-8000-000000000002", test_id: `a0000001-0000-4000-8000-0000000000${n}` })),
    // Electrolytes
    ...["04","05","06","07"].map(n => ({ panel_id: "b0000001-0000-4000-8000-000000000003", test_id: `a0000001-0000-4000-8000-0000000000${n}` })),
    // Liver Function
    ...["13","14","12","11","09","10","19"].map(n => ({ panel_id: "b0000001-0000-4000-8000-000000000004", test_id: `a0000001-0000-4000-8000-0000000000${n}` })),
    // Lipid Panel
    ...["15","16","17","18"].map(n => ({ panel_id: "b0000001-0000-4000-8000-000000000005", test_id: `a0000001-0000-4000-8000-0000000000${n}` })),
    // Renal Function
    ...["02","03","20","21"].map(n => ({ panel_id: "b0000001-0000-4000-8000-000000000006", test_id: `a0000001-0000-4000-8000-0000000000${n}` })),
  ];

  const { error: ptErr } = await supabase.from("panel_tests").upsert(panelTests, { onConflict: "panel_id,test_id" });
  if (ptErr) throw ptErr;

  // 4. Patients
  console.log("4/8 Patients...");
  const patients = [
    { id: "c0000001-0000-4000-8000-000000000001", patient_ref: "PT-00142", full_name: "Emily Carter", date_of_birth: "1988-03-15", gender: "female", phone: "555-0101" },
    { id: "c0000001-0000-4000-8000-000000000002", patient_ref: "PT-00143", full_name: "James Wilson", date_of_birth: "1975-07-22", gender: "male", phone: "555-0102" },
    { id: "c0000001-0000-4000-8000-000000000003", patient_ref: "PT-00144", full_name: "Ashley Thompson", date_of_birth: "1992-11-04", gender: "female", phone: "555-0103" },
    { id: "c0000001-0000-4000-8000-000000000004", patient_ref: "PT-00145", full_name: "Robert Martinez", date_of_birth: "1965-01-30", gender: "male", phone: "555-0104" },
    { id: "c0000001-0000-4000-8000-000000000005", patient_ref: "PT-00146", full_name: "Tyler Brooks", date_of_birth: "2001-09-12", gender: "male", phone: "555-0105" },
    { id: "c0000001-0000-4000-8000-000000000006", patient_ref: "PT-00147", full_name: "Megan Taylor", date_of_birth: "1998-06-08", gender: "female", phone: "555-0106" },
    { id: "c0000001-0000-4000-8000-000000000007", patient_ref: "PT-00148", full_name: "Brandon Clark", date_of_birth: "1983-12-19", gender: "male", phone: "555-0107" },
    { id: "c0000001-0000-4000-8000-000000000008", patient_ref: "PT-00149", full_name: "Lauren Harris", date_of_birth: "1970-04-25", gender: "female", phone: "555-0108" },
    { id: "c0000001-0000-4000-8000-000000000009", patient_ref: "PT-00150", full_name: "Kevin White", date_of_birth: "1995-08-11", gender: "male", phone: "555-0109" },
    { id: "c0000001-0000-4000-8000-000000000010", patient_ref: "PT-00151", full_name: "Rachel Green", date_of_birth: "1980-02-14", gender: "female", phone: "555-0110" },
    { id: "c0000001-0000-4000-8000-000000000011", patient_ref: "PT-00152", full_name: "Daniel Cooper", date_of_birth: "1990-10-03", gender: "male", phone: "555-0111" },
    { id: "c0000001-0000-4000-8000-000000000012", patient_ref: "PT-00153", full_name: "Amanda Scott", date_of_birth: "1987-05-27", gender: "female", phone: "555-0112" },
    { id: "c0000001-0000-4000-8000-000000000013", patient_ref: "PT-00154", full_name: "Steven Baker", date_of_birth: "1972-09-16", gender: "male", phone: "555-0113" },
  ].map((p) => ({ ...p, organization_id: ORG_ID, status: "active" }));

  const { error: patErr } = await supabase.from("patients").upsert(patients, { onConflict: "id" });
  if (patErr) throw patErr;

  // 5. Orders
  console.log("5/8 Orders...");
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

  const orders = [
    { id: "d0000001-0000-4000-8000-000000000001", order_ref: "LF-1042", patient_id: "c0000001-0000-4000-8000-000000000004", panel_id: "b0000001-0000-4000-8000-000000000002", priority: "stat", status: "review", collection_date: hoursAgo(3) },
    { id: "d0000001-0000-4000-8000-000000000002", order_ref: "LF-1046", patient_id: "c0000001-0000-4000-8000-000000000005", panel_id: "b0000001-0000-4000-8000-000000000003", priority: "urgent", status: "in_process", collection_date: hoursAgo(2) },
    { id: "d0000001-0000-4000-8000-000000000003", order_ref: "LF-1047", patient_id: "c0000001-0000-4000-8000-000000000013", panel_id: "b0000001-0000-4000-8000-000000000002", priority: "routine", status: "review", collection_date: hoursAgo(5) },
    { id: "d0000001-0000-4000-8000-000000000004", order_ref: "LF-1048", patient_id: "c0000001-0000-4000-8000-000000000007", panel_id: "b0000001-0000-4000-8000-000000000001", priority: "routine", status: "collected", collection_date: hoursAgo(1) },
    { id: "d0000001-0000-4000-8000-000000000005", order_ref: "LF-1049", patient_id: "c0000001-0000-4000-8000-000000000008", panel_id: "b0000001-0000-4000-8000-000000000004", priority: "stat", status: "in_process", collection_date: hoursAgo(1.5) },
    { id: "d0000001-0000-4000-8000-000000000006", order_ref: "LF-1050", patient_id: "c0000001-0000-4000-8000-000000000009", panel_id: "b0000001-0000-4000-8000-000000000003", priority: "urgent", status: "review", collection_date: hoursAgo(4) },
    { id: "d0000001-0000-4000-8000-000000000007", order_ref: "LF-1051", patient_id: "c0000001-0000-4000-8000-000000000006", panel_id: "b0000001-0000-4000-8000-000000000004", priority: "urgent", status: "collected", collection_date: hoursAgo(0.75) },
    { id: "d0000001-0000-4000-8000-000000000008", order_ref: "LF-1052", patient_id: "c0000001-0000-4000-8000-000000000002", panel_id: "b0000001-0000-4000-8000-000000000006", priority: "routine", status: "in_process", collection_date: hoursAgo(6) },
    { id: "d0000001-0000-4000-8000-000000000009", order_ref: "LF-1053", patient_id: "c0000001-0000-4000-8000-000000000001", panel_id: "b0000001-0000-4000-8000-000000000002", priority: "routine", status: "draft", collection_date: hoursAgo(0.5) },
    { id: "d0000001-0000-4000-8000-000000000010", order_ref: "LF-1054", patient_id: "c0000001-0000-4000-8000-000000000003", panel_id: "b0000001-0000-4000-8000-000000000003", priority: "routine", status: "released", collection_date: hoursAgo(8) },
  ].map((o) => ({ ...o, organization_id: ORG_ID }));

  const { error: ordErr } = await supabase.from("orders").upsert(orders, { onConflict: "id" });
  if (ordErr) throw ordErr;

  // 6. Specimens
  console.log("6/8 Specimens...");
  const specimens = [
    { id: "e0000001-0000-4000-8000-000000000001", specimen_ref: "SP-22018", order_id: "d0000001-0000-4000-8000-000000000005", type: "serum", collector: "R. Moore", barcode: "LF22018SEQ001", collected_at: hoursAgo(1.4), status: "received" },
    { id: "e0000001-0000-4000-8000-000000000002", specimen_ref: "SP-22019", order_id: "d0000001-0000-4000-8000-000000000001", type: "serum", collector: "R. Moore", barcode: "LF22019SEQ001", collected_at: hoursAgo(3), status: "completed" },
    { id: "e0000001-0000-4000-8000-000000000003", specimen_ref: "SP-22020", order_id: "d0000001-0000-4000-8000-000000000002", type: "plasma", collector: "J. Patel", barcode: "LF22020SEQ001", collected_at: hoursAgo(2), status: "processing" },
    { id: "e0000001-0000-4000-8000-000000000004", specimen_ref: "SP-22021", order_id: "d0000001-0000-4000-8000-000000000006", type: "plasma", collector: "J. Patel", barcode: "LF22021SEQ001", collected_at: hoursAgo(4), status: "processing" },
    { id: "e0000001-0000-4000-8000-000000000005", specimen_ref: "SP-22022", order_id: "d0000001-0000-4000-8000-000000000006", type: "serum", collector: "J. Patel", barcode: "LF22022SEQ001", collected_at: hoursAgo(4), status: "rejected", rejection_reason: "Barcode mismatch" },
    { id: "e0000001-0000-4000-8000-000000000006", specimen_ref: "SP-22024", order_id: "d0000001-0000-4000-8000-000000000008", type: "whole_blood", collector: "A. Lewis", barcode: "LF22024SEQ001", collected_at: hoursAgo(6), status: "completed" },
    { id: "e0000001-0000-4000-8000-000000000007", specimen_ref: "SP-22025", order_id: "d0000001-0000-4000-8000-000000000004", type: "serum", collector: "R. Moore", barcode: "LF22025SEQ001", collected_at: hoursAgo(0.9), status: "received" },
    { id: "e0000001-0000-4000-8000-000000000008", specimen_ref: "SP-22026", order_id: "d0000001-0000-4000-8000-000000000003", type: "serum", collector: "A. Lewis", barcode: "LF22026SEQ001", collected_at: hoursAgo(5), status: "completed" },
    { id: "e0000001-0000-4000-8000-000000000009", specimen_ref: "SP-22029", order_id: "d0000001-0000-4000-8000-000000000009", type: "serum", collector: "R. Moore", barcode: "LF22029SEQ001", collected_at: hoursAgo(0.4), status: "rejected", rejection_reason: "Tube type incorrect" },
    { id: "e0000001-0000-4000-8000-000000000010", specimen_ref: "SP-22030", order_id: "d0000001-0000-4000-8000-000000000010", type: "plasma", collector: "J. Patel", barcode: "LF22030SEQ001", collected_at: hoursAgo(8), status: "completed" },
  ].map((s) => ({ ...s, organization_id: ORG_ID }));

  const { error: specErr } = await supabase.from("specimens").upsert(specimens, { onConflict: "id" });
  if (specErr) throw specErr;

  // 7. Results
  console.log("7/8 Results...");
  const results = [
    // Noah Kim Electrolytes (draft)
    { id: "f0000001-0000-4000-8000-000000000001", order_id: "d0000001-0000-4000-8000-000000000002", test_id: "a0000001-0000-4000-8000-000000000004", value: "141", unit: "mEq/L", is_abnormal: false, status: "draft" },
    { id: "f0000001-0000-4000-8000-000000000002", order_id: "d0000001-0000-4000-8000-000000000002", test_id: "a0000001-0000-4000-8000-000000000005", value: "4.2", unit: "mEq/L", is_abnormal: false, status: "draft" },
    { id: "f0000001-0000-4000-8000-000000000003", order_id: "d0000001-0000-4000-8000-000000000002", test_id: "a0000001-0000-4000-8000-000000000006", value: "102", unit: "mEq/L", is_abnormal: false, status: "draft" },
    { id: "f0000001-0000-4000-8000-000000000004", order_id: "d0000001-0000-4000-8000-000000000002", test_id: "a0000001-0000-4000-8000-000000000007", value: "25", unit: "mEq/L", is_abnormal: false, status: "draft" },
    // Priya Das CMP (review)
    { id: "f0000001-0000-4000-8000-000000000005", order_id: "d0000001-0000-4000-8000-000000000003", test_id: "a0000001-0000-4000-8000-000000000001", value: "95", unit: "mg/dL", is_abnormal: false, status: "review" },
    { id: "f0000001-0000-4000-8000-000000000006", order_id: "d0000001-0000-4000-8000-000000000003", test_id: "a0000001-0000-4000-8000-000000000002", value: "18", unit: "mg/dL", is_abnormal: false, status: "review" },
    { id: "f0000001-0000-4000-8000-000000000007", order_id: "d0000001-0000-4000-8000-000000000003", test_id: "a0000001-0000-4000-8000-000000000003", value: "1.1", unit: "mg/dL", is_abnormal: false, status: "review" },
    // Ava Singh Liver function (approved)
    { id: "f0000001-0000-4000-8000-000000000008", order_id: "d0000001-0000-4000-8000-000000000007", test_id: "a0000001-0000-4000-8000-000000000013", value: "32", unit: "U/L", is_abnormal: false, status: "approved" },
    { id: "f0000001-0000-4000-8000-000000000009", order_id: "d0000001-0000-4000-8000-000000000007", test_id: "a0000001-0000-4000-8000-000000000014", value: "28", unit: "U/L", is_abnormal: false, status: "approved" },
    { id: "f0000001-0000-4000-8000-000000000010", order_id: "d0000001-0000-4000-8000-000000000007", test_id: "a0000001-0000-4000-8000-000000000011", value: "0.9", unit: "mg/dL", is_abnormal: false, status: "approved" },
    // Maya Coleman Electrolytes (released)
    { id: "f0000001-0000-4000-8000-000000000011", order_id: "d0000001-0000-4000-8000-000000000010", test_id: "a0000001-0000-4000-8000-000000000004", value: "138", unit: "mEq/L", is_abnormal: false, status: "released" },
    { id: "f0000001-0000-4000-8000-000000000012", order_id: "d0000001-0000-4000-8000-000000000010", test_id: "a0000001-0000-4000-8000-000000000005", value: "5.3", unit: "mEq/L", is_abnormal: true, status: "released" },
    { id: "f0000001-0000-4000-8000-000000000013", order_id: "d0000001-0000-4000-8000-000000000010", test_id: "a0000001-0000-4000-8000-000000000006", value: "99", unit: "mEq/L", is_abnormal: false, status: "released" },
    { id: "f0000001-0000-4000-8000-000000000014", order_id: "d0000001-0000-4000-8000-000000000010", test_id: "a0000001-0000-4000-8000-000000000007", value: "26", unit: "mEq/L", is_abnormal: false, status: "released" },
  ].map((r) => ({ ...r, organization_id: ORG_ID }));

  const { error: resErr } = await supabase.from("results").upsert(results, { onConflict: "id" });
  if (resErr) throw resErr;

  // 8. Reports
  console.log("8/8 Reports...");
  const reports = [
    { id: "ab000001-0000-4000-8000-000000000001", report_ref: "RP-9001", order_id: "d0000001-0000-4000-8000-000000000010", patient_id: "c0000001-0000-4000-8000-000000000010", format: "pdf_json", version: 1, status: "released", released_at: hoursAgo(7) },
    { id: "ab000001-0000-4000-8000-000000000002", report_ref: "RP-9002", order_id: "d0000001-0000-4000-8000-000000000003", patient_id: "c0000001-0000-4000-8000-000000000011", format: "pdf", version: 2, status: "released", released_at: hoursAgo(5) },
    { id: "ab000001-0000-4000-8000-000000000003", report_ref: "RP-9003", order_id: "d0000001-0000-4000-8000-000000000008", patient_id: "c0000001-0000-4000-8000-000000000012", format: "pdf_csv", version: 1, status: "queued" },
  ].map((r) => ({ ...r, organization_id: ORG_ID }));

  const { error: repErr } = await supabase.from("reports").upsert(reports, { onConflict: "id" });
  if (repErr) throw repErr;

  console.log("\nDone! Seed data inserted successfully.");
  console.log(`  Organization: Metro Clinical Labs`);
  console.log(`  Tests: 26 | Panels: 6 | Patients: 13`);
  console.log(`  Orders: 10 | Specimens: 10 | Results: 14 | Reports: 3`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
