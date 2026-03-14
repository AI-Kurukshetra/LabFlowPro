/**
 * Full seed script for LabFlow Pro
 * Creates rich data across all modules for demo/testing
 *
 * Run: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx supabase/seed-full.ts
 */

import { createClient } from "@supabase/supabase-js";
import {
  buildSeedReferenceRangeRows,
  buildSeedTests,
  CLINICAL_CHEMISTRY_TESTS,
  findDefinitionByName,
  isSeedValueAbnormal,
  resolveSeedRule,
} from "./reference-range-catalog";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ORG_ID = "a1b2c3d4-0000-4000-8000-000000000001";

// Real user profile IDs from auth
const USERS = {
  admin: "fe10ab13-c19b-49cc-8f32-8889f359f5f2",       // Mike Johnson
  intake: "05c2c02f-3995-4c7c-a297-bac9e2c96f67",      // Sarah Williams
  technician1: "c676bcad-5a29-4e63-9421-b14f2caacade",  // Brian Davis
  reviewer: "2a77e189-361f-4f27-943f-dea499708903",     // Jessica Miller
  technician2: "0768f486-80fc-4b00-90b7-d9bb2c88b79f",  // Chris Anderson
};

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

function uuid(prefix: string, n: number): string {
  const hex = prefix.padEnd(8, "0").slice(0, 8);
  const num = n.toString().padStart(12, "0");
  return `${hex}-0000-4000-8000-${num}`;
}

async function seed() {
  console.log("=== LabFlow Pro Full Seed ===\n");

  // ---------------------------------------------------------------------------
  // 1. Organization
  // ---------------------------------------------------------------------------
  console.log("1/9  Organization...");
  await upsert("organizations", [
    { id: ORG_ID, name: "Metro Clinical Labs" },
  ]);

  // ---------------------------------------------------------------------------
  // 2. Update user profiles with org + last_seen
  // ---------------------------------------------------------------------------
  console.log("2/9  Profiles...");
  const profiles = [
    { id: USERS.admin, organization_id: ORG_ID, role: "admin", scope: "Full system access", status: "active", last_seen_at: hoursAgo(0.5) },
    { id: USERS.intake, organization_id: ORG_ID, role: "intake", scope: "Registration", status: "active", last_seen_at: hoursAgo(1) },
    { id: USERS.technician1, organization_id: ORG_ID, role: "technician", scope: "Sample processing", status: "active", last_seen_at: hoursAgo(0.2) },
    { id: USERS.reviewer, organization_id: ORG_ID, role: "reviewer", scope: "Result verification", status: "active", last_seen_at: hoursAgo(2) },
    { id: USERS.technician2, organization_id: ORG_ID, role: "technician", scope: "Sample processing", status: "active", last_seen_at: hoursAgo(3) },
  ];
  for (const p of profiles) {
    const { error } = await supabase.from("profiles").update(p).eq("id", p.id);
    if (error) console.warn(`  profile ${p.id}: ${error.message}`);
  }

  // ---------------------------------------------------------------------------
  // 3. Tests (26 clinical chemistry)
  // ---------------------------------------------------------------------------
  console.log("3/9  Tests...");
  const tests = buildSeedTests(ORG_ID, (n) => uuid("a0000001", n));
  await upsert("tests", tests);
  const referenceRangeRules = buildSeedReferenceRangeRows(
    ORG_ID,
    (n) => uuid("a0000001", n),
    (n) => uuid("aa000001", n),
  );
  await upsert("test_reference_ranges", referenceRangeRules);

  // ---------------------------------------------------------------------------
  // 4. Panels
  // ---------------------------------------------------------------------------
  console.log("4/9  Panels...");
  const PANEL = {
    bmp: uuid("b0000001", 1),
    cmp: uuid("b0000001", 2),
    electrolytes: uuid("b0000001", 3),
    liver: uuid("b0000001", 4),
    lipid: uuid("b0000001", 5),
    renal: uuid("b0000001", 6),
  };
  await upsert("panels", [
    { id: PANEL.bmp, organization_id: ORG_ID, name: "Basic Metabolic Panel (BMP)" },
    { id: PANEL.cmp, organization_id: ORG_ID, name: "Comprehensive Metabolic Panel (CMP)" },
    { id: PANEL.electrolytes, organization_id: ORG_ID, name: "Electrolytes" },
    { id: PANEL.liver, organization_id: ORG_ID, name: "Liver Function" },
    { id: PANEL.lipid, organization_id: ORG_ID, name: "Lipid Panel" },
    { id: PANEL.renal, organization_id: ORG_ID, name: "Renal Function" },
  ]);

  const tid = (n: number) => uuid("a0000001", n);
  const panelTests = [
    ...[1,2,3,4,5,6,7,8].map(n => ({ panel_id: PANEL.bmp, test_id: tid(n) })),
    ...[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(n => ({ panel_id: PANEL.cmp, test_id: tid(n) })),
    ...[4,5,6,7].map(n => ({ panel_id: PANEL.electrolytes, test_id: tid(n) })),
    ...[13,14,12,11,9,10,19].map(n => ({ panel_id: PANEL.liver, test_id: tid(n) })),
    ...[15,16,17,18].map(n => ({ panel_id: PANEL.lipid, test_id: tid(n) })),
    ...[2,3,20,21].map(n => ({ panel_id: PANEL.renal, test_id: tid(n) })),
  ];
  await upsert("panel_tests", panelTests, "panel_id,test_id");

  // ---------------------------------------------------------------------------
  // 5. Patients (30 patients, US names, various statuses)
  // ---------------------------------------------------------------------------
  console.log("5/9  Patients (30)...");
  const patients = [
    { id: uuid("c0000001", 1), patient_ref: "PT-10001", full_name: "Emily Carter", date_of_birth: "1988-03-15", gender: "female", phone: "555-0101", email: "emily.carter@email.com", status: "active" },
    { id: uuid("c0000001", 2), patient_ref: "PT-10002", full_name: "James Wilson", date_of_birth: "1975-07-22", gender: "male", phone: "555-0102", email: "james.wilson@email.com", status: "active" },
    { id: uuid("c0000001", 3), patient_ref: "PT-10003", full_name: "Ashley Thompson", date_of_birth: "1992-11-04", gender: "female", phone: "555-0103", email: "ashley.thompson@email.com", status: "active" },
    { id: uuid("c0000001", 4), patient_ref: "PT-10004", full_name: "Robert Martinez", date_of_birth: "1965-01-30", gender: "male", phone: "555-0104", email: "robert.martinez@email.com", status: "active" },
    { id: uuid("c0000001", 5), patient_ref: "PT-10005", full_name: "Tyler Brooks", date_of_birth: "2001-09-12", gender: "male", phone: "555-0105", email: "tyler.brooks@email.com", status: "active" },
    { id: uuid("c0000001", 6), patient_ref: "PT-10006", full_name: "Megan Taylor", date_of_birth: "1998-06-08", gender: "female", phone: "555-0106", email: "megan.taylor@email.com", status: "active" },
    { id: uuid("c0000001", 7), patient_ref: "PT-10007", full_name: "Brandon Clark", date_of_birth: "1983-12-19", gender: "male", phone: "555-0107", email: "brandon.clark@email.com", status: "active" },
    { id: uuid("c0000001", 8), patient_ref: "PT-10008", full_name: "Lauren Harris", date_of_birth: "1970-04-25", gender: "female", phone: "555-0108", email: "lauren.harris@email.com", status: "active" },
    { id: uuid("c0000001", 9), patient_ref: "PT-10009", full_name: "Kevin White", date_of_birth: "1995-08-11", gender: "male", phone: "555-0109", email: "kevin.white@email.com", status: "active" },
    { id: uuid("c0000001", 10), patient_ref: "PT-10010", full_name: "Rachel Green", date_of_birth: "1980-02-14", gender: "female", phone: "555-0110", email: "rachel.green@email.com", status: "active" },
    { id: uuid("c0000001", 11), patient_ref: "PT-10011", full_name: "Daniel Cooper", date_of_birth: "1990-10-03", gender: "male", phone: "555-0111", email: "daniel.cooper@email.com", status: "active" },
    { id: uuid("c0000001", 12), patient_ref: "PT-10012", full_name: "Amanda Scott", date_of_birth: "1987-05-27", gender: "female", phone: "555-0112", email: "amanda.scott@email.com", status: "active" },
    { id: uuid("c0000001", 13), patient_ref: "PT-10013", full_name: "Steven Baker", date_of_birth: "1972-09-16", gender: "male", phone: "555-0113", email: "steven.baker@email.com", status: "active" },
    { id: uuid("c0000001", 14), patient_ref: "PT-10014", full_name: "Jennifer Adams", date_of_birth: "1985-04-20", gender: "female", phone: "555-0114", email: "jennifer.adams@email.com", status: "active" },
    { id: uuid("c0000001", 15), patient_ref: "PT-10015", full_name: "Michael Turner", date_of_birth: "1968-11-12", gender: "male", phone: "555-0115", email: "michael.turner@email.com", status: "active" },
    { id: uuid("c0000001", 16), patient_ref: "PT-10016", full_name: "Stephanie Reed", date_of_birth: "1993-07-08", gender: "female", phone: "555-0116", email: "stephanie.reed@email.com", status: "active" },
    { id: uuid("c0000001", 17), patient_ref: "PT-10017", full_name: "David Campbell", date_of_birth: "1978-02-28", gender: "male", phone: "555-0117", email: "david.campbell@email.com", status: "active" },
    { id: uuid("c0000001", 18), patient_ref: "PT-10018", full_name: "Nicole Foster", date_of_birth: "1999-12-05", gender: "female", phone: "555-0118", email: "nicole.foster@email.com", status: "active" },
    { id: uuid("c0000001", 19), patient_ref: "PT-10019", full_name: "Andrew Mitchell", date_of_birth: "1960-06-17", gender: "male", phone: "555-0119", email: "andrew.mitchell@email.com", status: "active" },
    { id: uuid("c0000001", 20), patient_ref: "PT-10020", full_name: "Christina Howard", date_of_birth: "1991-01-23", gender: "female", phone: "555-0120", email: "christina.howard@email.com", status: "active" },
    { id: uuid("c0000001", 21), patient_ref: "PT-10021", full_name: "Jason Perry", date_of_birth: "1982-08-09", gender: "male", phone: "555-0121", email: "jason.perry@email.com", status: "active" },
    { id: uuid("c0000001", 22), patient_ref: "PT-10022", full_name: "Lisa Morgan", date_of_birth: "1974-03-30", gender: "female", phone: "555-0122", email: "lisa.morgan@email.com", status: "active" },
    { id: uuid("c0000001", 23), patient_ref: "PT-10023", full_name: "Ryan Butler", date_of_birth: "2003-05-14", gender: "male", phone: "555-0123", email: "ryan.butler@email.com", status: "active" },
    { id: uuid("c0000001", 24), patient_ref: "PT-10024", full_name: "Samantha Ross", date_of_birth: "1986-09-02", gender: "female", phone: "555-0124", email: "samantha.ross@email.com", status: "active" },
    { id: uuid("c0000001", 25), patient_ref: "PT-10025", full_name: "Patrick Evans", date_of_birth: "1971-12-11", gender: "male", phone: "555-0125", email: "patrick.evans@email.com", status: "active" },
    // Inactive/merged patients
    { id: uuid("c0000001", 26), patient_ref: "PT-10026", full_name: "Karen Phillips", date_of_birth: "1966-07-04", gender: "female", phone: "555-0126", email: "karen.phillips@email.com", status: "inactive" },
    { id: uuid("c0000001", 27), patient_ref: "PT-10027", full_name: "Thomas Jenkins", date_of_birth: "1958-10-22", gender: "male", phone: "555-0127", email: "thomas.jenkins@email.com", status: "inactive" },
    { id: uuid("c0000001", 28), patient_ref: "PT-10028", full_name: "Michelle Lee", date_of_birth: "1989-03-18", gender: "female", phone: "555-0128", email: "michelle.lee@email.com", status: "merged" },
    { id: uuid("c0000001", 29), patient_ref: "PT-10029", full_name: "Brian Nelson", date_of_birth: "1977-11-29", gender: "male", phone: "555-0129", email: "brian.nelson@email.com", status: "active" },
    { id: uuid("c0000001", 30), patient_ref: "PT-10030", full_name: "Heather Collins", date_of_birth: "1994-08-07", gender: "female", phone: "555-0130", email: "heather.collins@email.com", status: "active" },
  ].map((p) => ({ ...p, organization_id: ORG_ID }));
  await upsert("patients", patients);

  // ---------------------------------------------------------------------------
  // 6. Orders (40 orders across all statuses/priorities/panels)
  // ---------------------------------------------------------------------------
  console.log("6/9  Orders (40)...");
  const pid = (n: number) => uuid("c0000001", n);
  const oid = (n: number) => uuid("d0000001", n);

  const orders = [
    // === RELEASED orders (completed workflow) — 8 ===
    { id: oid(1), order_ref: "LF-2001", patient_id: pid(1), panel_id: PANEL.cmp, priority: "routine", status: "released", collection_date: daysAgo(5) },
    { id: oid(2), order_ref: "LF-2002", patient_id: pid(2), panel_id: PANEL.lipid, priority: "routine", status: "released", collection_date: daysAgo(4) },
    { id: oid(3), order_ref: "LF-2003", patient_id: pid(3), panel_id: PANEL.electrolytes, priority: "urgent", status: "released", collection_date: daysAgo(3) },
    { id: oid(4), order_ref: "LF-2004", patient_id: pid(10), panel_id: PANEL.bmp, priority: "routine", status: "released", collection_date: daysAgo(3) },
    { id: oid(5), order_ref: "LF-2005", patient_id: pid(15), panel_id: PANEL.liver, priority: "stat", status: "released", collection_date: daysAgo(2) },
    { id: oid(6), order_ref: "LF-2006", patient_id: pid(11), panel_id: PANEL.renal, priority: "routine", status: "released", collection_date: daysAgo(2) },
    { id: oid(7), order_ref: "LF-2007", patient_id: pid(22), panel_id: PANEL.cmp, priority: "routine", status: "released", collection_date: daysAgo(1) },
    { id: oid(8), order_ref: "LF-2008", patient_id: pid(25), panel_id: PANEL.electrolytes, priority: "urgent", status: "released", collection_date: daysAgo(1) },

    // === REVIEW orders (awaiting supervisor approval) — 6 ===
    { id: oid(9), order_ref: "LF-2009", patient_id: pid(4), panel_id: PANEL.cmp, priority: "stat", status: "review", collection_date: hoursAgo(6) },
    { id: oid(10), order_ref: "LF-2010", patient_id: pid(5), panel_id: PANEL.electrolytes, priority: "urgent", status: "review", collection_date: hoursAgo(5) },
    { id: oid(11), order_ref: "LF-2011", patient_id: pid(14), panel_id: PANEL.liver, priority: "routine", status: "review", collection_date: hoursAgo(8) },
    { id: oid(12), order_ref: "LF-2012", patient_id: pid(17), panel_id: PANEL.lipid, priority: "routine", status: "review", collection_date: hoursAgo(7) },
    { id: oid(13), order_ref: "LF-2013", patient_id: pid(19), panel_id: PANEL.renal, priority: "urgent", status: "review", collection_date: hoursAgo(4) },
    { id: oid(14), order_ref: "LF-2014", patient_id: pid(24), panel_id: PANEL.bmp, priority: "stat", status: "review", collection_date: hoursAgo(3) },

    // === IN_PROCESS orders (lab working on them) — 6 ===
    { id: oid(15), order_ref: "LF-2015", patient_id: pid(6), panel_id: PANEL.liver, priority: "stat", status: "in_process", collection_date: hoursAgo(2) },
    { id: oid(16), order_ref: "LF-2016", patient_id: pid(7), panel_id: PANEL.bmp, priority: "routine", status: "in_process", collection_date: hoursAgo(3) },
    { id: oid(17), order_ref: "LF-2017", patient_id: pid(8), panel_id: PANEL.cmp, priority: "urgent", status: "in_process", collection_date: hoursAgo(4) },
    { id: oid(18), order_ref: "LF-2018", patient_id: pid(16), panel_id: PANEL.electrolytes, priority: "routine", status: "in_process", collection_date: hoursAgo(2.5) },
    { id: oid(19), order_ref: "LF-2019", patient_id: pid(20), panel_id: PANEL.lipid, priority: "routine", status: "in_process", collection_date: hoursAgo(5) },
    { id: oid(20), order_ref: "LF-2020", patient_id: pid(29), panel_id: PANEL.renal, priority: "urgent", status: "in_process", collection_date: hoursAgo(1.5) },

    // === COLLECTED orders (specimens taken, awaiting processing) — 6 ===
    { id: oid(21), order_ref: "LF-2021", patient_id: pid(9), panel_id: PANEL.cmp, priority: "routine", status: "collected", collection_date: hoursAgo(1) },
    { id: oid(22), order_ref: "LF-2022", patient_id: pid(12), panel_id: PANEL.liver, priority: "urgent", status: "collected", collection_date: hoursAgo(0.5) },
    { id: oid(23), order_ref: "LF-2023", patient_id: pid(18), panel_id: PANEL.bmp, priority: "routine", status: "collected", collection_date: hoursAgo(1.5) },
    { id: oid(24), order_ref: "LF-2024", patient_id: pid(21), panel_id: PANEL.electrolytes, priority: "stat", status: "collected", collection_date: hoursAgo(0.3) },
    { id: oid(25), order_ref: "LF-2025", patient_id: pid(23), panel_id: PANEL.lipid, priority: "routine", status: "collected", collection_date: hoursAgo(2) },
    { id: oid(26), order_ref: "LF-2026", patient_id: pid(30), panel_id: PANEL.renal, priority: "urgent", status: "collected", collection_date: hoursAgo(0.8) },

    // === DRAFT orders (just placed, no specimen yet) — 8 ===
    { id: oid(27), order_ref: "LF-2027", patient_id: pid(1), panel_id: PANEL.lipid, priority: "routine", status: "draft", collection_date: null },
    { id: oid(28), order_ref: "LF-2028", patient_id: pid(4), panel_id: PANEL.renal, priority: "routine", status: "draft", collection_date: null },
    { id: oid(29), order_ref: "LF-2029", patient_id: pid(6), panel_id: PANEL.bmp, priority: "urgent", status: "draft", collection_date: null },
    { id: oid(30), order_ref: "LF-2030", patient_id: pid(13), panel_id: PANEL.cmp, priority: "stat", status: "draft", collection_date: null },
    { id: oid(31), order_ref: "LF-2031", patient_id: pid(15), panel_id: PANEL.electrolytes, priority: "routine", status: "draft", collection_date: null },
    { id: oid(32), order_ref: "LF-2032", patient_id: pid(19), panel_id: PANEL.liver, priority: "urgent", status: "draft", collection_date: null },
    { id: oid(33), order_ref: "LF-2033", patient_id: pid(22), panel_id: PANEL.lipid, priority: "routine", status: "draft", collection_date: null },
    { id: oid(34), order_ref: "LF-2034", patient_id: pid(25), panel_id: PANEL.renal, priority: "stat", status: "draft", collection_date: null },

    // === Extra orders for patients with multiple visits — 6 ===
    { id: oid(35), order_ref: "LF-2035", patient_id: pid(1), panel_id: PANEL.bmp, priority: "routine", status: "released", collection_date: daysAgo(10), notes: "Follow-up from previous CMP" },
    { id: oid(36), order_ref: "LF-2036", patient_id: pid(4), panel_id: PANEL.liver, priority: "stat", status: "released", collection_date: daysAgo(7), notes: "Elevated ALT on prior panel" },
    { id: oid(37), order_ref: "LF-2037", patient_id: pid(10), panel_id: PANEL.lipid, priority: "routine", status: "review", collection_date: hoursAgo(10) },
    { id: oid(38), order_ref: "LF-2038", patient_id: pid(15), panel_id: PANEL.renal, priority: "urgent", status: "in_process", collection_date: hoursAgo(3) },
    { id: oid(39), order_ref: "LF-2039", patient_id: pid(7), panel_id: PANEL.electrolytes, priority: "routine", status: "collected", collection_date: hoursAgo(1) },
    { id: oid(40), order_ref: "LF-2040", patient_id: pid(20), panel_id: PANEL.cmp, priority: "urgent", status: "draft", collection_date: null, notes: "Annual physical labs" },
  ].map((o) => ({ ...o, organization_id: ORG_ID }));
  await upsert("orders", orders);
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));
  const orderById = new Map(orders.map((order) => [order.id, order]));

  // ---------------------------------------------------------------------------
  // 7. Specimens (35 specimens)
  // ---------------------------------------------------------------------------
  console.log("7/9  Specimens (35)...");
  const sid = (n: number) => uuid("e0000001", n);
  const collectors = ["S. Williams", "B. Davis", "C. Anderson"];

  const specimens = [
    // Released order specimens (completed)
    { id: sid(1), specimen_ref: "SP-30001", order_id: oid(1), type: "serum", collector: "S. Williams", barcode: "LF30001A", collected_at: daysAgo(5), status: "completed" },
    { id: sid(2), specimen_ref: "SP-30002", order_id: oid(2), type: "serum", collector: "B. Davis", barcode: "LF30002A", collected_at: daysAgo(4), status: "completed" },
    { id: sid(3), specimen_ref: "SP-30003", order_id: oid(3), type: "plasma", collector: "C. Anderson", barcode: "LF30003A", collected_at: daysAgo(3), status: "completed" },
    { id: sid(4), specimen_ref: "SP-30004", order_id: oid(4), type: "serum", collector: "S. Williams", barcode: "LF30004A", collected_at: daysAgo(3), status: "completed" },
    { id: sid(5), specimen_ref: "SP-30005", order_id: oid(5), type: "serum", collector: "B. Davis", barcode: "LF30005A", collected_at: daysAgo(2), status: "completed" },
    { id: sid(6), specimen_ref: "SP-30006", order_id: oid(6), type: "whole_blood", collector: "C. Anderson", barcode: "LF30006A", collected_at: daysAgo(2), status: "completed" },
    { id: sid(7), specimen_ref: "SP-30007", order_id: oid(7), type: "serum", collector: "S. Williams", barcode: "LF30007A", collected_at: daysAgo(1), status: "completed" },
    { id: sid(8), specimen_ref: "SP-30008", order_id: oid(8), type: "plasma", collector: "B. Davis", barcode: "LF30008A", collected_at: daysAgo(1), status: "completed" },
    { id: sid(9), specimen_ref: "SP-30009", order_id: oid(35), type: "serum", collector: "S. Williams", barcode: "LF30009A", collected_at: daysAgo(10), status: "completed" },
    { id: sid(10), specimen_ref: "SP-30010", order_id: oid(36), type: "serum", collector: "C. Anderson", barcode: "LF30010A", collected_at: daysAgo(7), status: "completed" },

    // Review order specimens (completed processing)
    { id: sid(11), specimen_ref: "SP-30011", order_id: oid(9), type: "serum", collector: "B. Davis", barcode: "LF30011A", collected_at: hoursAgo(6), status: "completed" },
    { id: sid(12), specimen_ref: "SP-30012", order_id: oid(10), type: "plasma", collector: "S. Williams", barcode: "LF30012A", collected_at: hoursAgo(5), status: "completed" },
    { id: sid(13), specimen_ref: "SP-30013", order_id: oid(11), type: "serum", collector: "C. Anderson", barcode: "LF30013A", collected_at: hoursAgo(8), status: "completed" },
    { id: sid(14), specimen_ref: "SP-30014", order_id: oid(12), type: "serum", collector: "B. Davis", barcode: "LF30014A", collected_at: hoursAgo(7), status: "completed" },
    { id: sid(15), specimen_ref: "SP-30015", order_id: oid(13), type: "whole_blood", collector: "S. Williams", barcode: "LF30015A", collected_at: hoursAgo(4), status: "completed" },
    { id: sid(16), specimen_ref: "SP-30016", order_id: oid(14), type: "serum", collector: "C. Anderson", barcode: "LF30016A", collected_at: hoursAgo(3), status: "completed" },
    { id: sid(17), specimen_ref: "SP-30017", order_id: oid(37), type: "serum", collector: "B. Davis", barcode: "LF30017A", collected_at: hoursAgo(10), status: "completed" },

    // In-process specimens (currently processing)
    { id: sid(18), specimen_ref: "SP-30018", order_id: oid(15), type: "serum", collector: "S. Williams", barcode: "LF30018A", collected_at: hoursAgo(2), status: "processing" },
    { id: sid(19), specimen_ref: "SP-30019", order_id: oid(16), type: "serum", collector: "B. Davis", barcode: "LF30019A", collected_at: hoursAgo(3), status: "processing" },
    { id: sid(20), specimen_ref: "SP-30020", order_id: oid(17), type: "plasma", collector: "C. Anderson", barcode: "LF30020A", collected_at: hoursAgo(4), status: "processing" },
    { id: sid(21), specimen_ref: "SP-30021", order_id: oid(18), type: "serum", collector: "S. Williams", barcode: "LF30021A", collected_at: hoursAgo(2.5), status: "processing" },
    { id: sid(22), specimen_ref: "SP-30022", order_id: oid(19), type: "serum", collector: "B. Davis", barcode: "LF30022A", collected_at: hoursAgo(5), status: "processing" },
    { id: sid(23), specimen_ref: "SP-30023", order_id: oid(20), type: "whole_blood", collector: "C. Anderson", barcode: "LF30023A", collected_at: hoursAgo(1.5), status: "processing" },
    { id: sid(24), specimen_ref: "SP-30024", order_id: oid(38), type: "urine", collector: "S. Williams", barcode: "LF30024A", collected_at: hoursAgo(3), status: "processing" },

    // Collected/received specimens
    { id: sid(25), specimen_ref: "SP-30025", order_id: oid(21), type: "serum", collector: "B. Davis", barcode: "LF30025A", collected_at: hoursAgo(1), status: "received" },
    { id: sid(26), specimen_ref: "SP-30026", order_id: oid(22), type: "serum", collector: "S. Williams", barcode: "LF30026A", collected_at: hoursAgo(0.5), status: "received" },
    { id: sid(27), specimen_ref: "SP-30027", order_id: oid(23), type: "serum", collector: "C. Anderson", barcode: "LF30027A", collected_at: hoursAgo(1.5), status: "received" },
    { id: sid(28), specimen_ref: "SP-30028", order_id: oid(24), type: "plasma", collector: "B. Davis", barcode: "LF30028A", collected_at: hoursAgo(0.3), status: "received" },
    { id: sid(29), specimen_ref: "SP-30029", order_id: oid(25), type: "serum", collector: "S. Williams", barcode: "LF30029A", collected_at: hoursAgo(2), status: "received" },
    { id: sid(30), specimen_ref: "SP-30030", order_id: oid(26), type: "whole_blood", collector: "C. Anderson", barcode: "LF30030A", collected_at: hoursAgo(0.8), status: "received" },
    { id: sid(31), specimen_ref: "SP-30031", order_id: oid(39), type: "plasma", collector: "B. Davis", barcode: "LF30031A", collected_at: hoursAgo(1), status: "received" },

    // Rejected specimens
    { id: sid(32), specimen_ref: "SP-30032", order_id: oid(17), type: "serum", collector: "S. Williams", barcode: "LF30032A", collected_at: hoursAgo(5), status: "rejected", rejection_reason: "Hemolyzed sample" },
    { id: sid(33), specimen_ref: "SP-30033", order_id: oid(22), type: "plasma", collector: "C. Anderson", barcode: "LF30033A", collected_at: hoursAgo(1), status: "rejected", rejection_reason: "Incorrect tube type" },
    { id: sid(34), specimen_ref: "SP-30034", order_id: oid(9), type: "serum", collector: "B. Davis", barcode: "LF30034A", collected_at: hoursAgo(7), status: "rejected", rejection_reason: "Insufficient volume" },
    { id: sid(35), specimen_ref: "SP-30035", order_id: oid(15), type: "plasma", collector: "S. Williams", barcode: "LF30035A", collected_at: hoursAgo(2.5), status: "rejected", rejection_reason: "Clotted specimen" },
  ].map((s) => ({ ...s, organization_id: ORG_ID }));
  await upsert("specimens", specimens);

  // ---------------------------------------------------------------------------
  // 8. Results — values for released, review, and some draft orders
  // ---------------------------------------------------------------------------
  console.log("8/9  Results...");
  const rid = (n: number) => uuid("f0000001", n);
  let rIdx = 1;

  type ResultRow = {
    id: string;
    organization_id: string;
    order_id: string;
    test_id: string;
    value: string;
    unit: string;
    is_abnormal: boolean;
    status: string;
    reviewer_id?: string;
    reviewed_at?: string;
    approved_at?: string;
  };

  const results: ResultRow[] = [];

  // Helper to generate results for an order's panel
  function addResults(
    orderId: string,
    panelKey: keyof typeof panelTestMap,
    status: string,
    values: Record<string, { value: string; abnormal: boolean }>,
    reviewer?: string
  ) {
    const testIds = panelTestMap[panelKey];
    for (const testNum of testIds) {
      const testId = tid(testNum);
      const testName = testNameMap[testNum];
      const v = values[testName];
      if (!v) continue;
      const order = orderById.get(orderId);
      const patient = order ? patientById.get(order.patient_id) : null;
      const definition = findDefinitionByName(testName);
      const resolvedRule =
        definition && patient
          ? resolveSeedRule(definition, patient, order?.collection_date ?? null)
          : null;
      const r: ResultRow = {
        id: rid(rIdx++),
        organization_id: ORG_ID,
        order_id: orderId,
        test_id: testId,
        value: v.value,
        unit: tests.find(t => t.id === testId)?.unit || "",
        is_abnormal: isSeedValueAbnormal(v.value, resolvedRule),
        status,
      };
      if (reviewer && (status === "approved" || status === "released")) {
        r.reviewer_id = reviewer;
        r.reviewed_at = hoursAgo(1);
        r.approved_at = hoursAgo(0.5);
      }
      results.push(r);
    }
  }

  const panelTestMap = {
    bmp: [1,2,3,4,5,6,7,8],
    cmp: [1,2,3,4,5,6,7,8,9,10,11,12,13,14],
    electrolytes: [4,5,6,7],
    liver: [13,14,12,11,9,10,19],
    lipid: [15,16,17,18],
    renal: [2,3,20,21],
  };

  const testNameMap = Object.fromEntries(
    CLINICAL_CHEMISTRY_TESTS.map((definition) => [definition.number, definition.name]),
  ) as Record<number, string>;

  // Released orders — all results released
  addResults(oid(1), "cmp", "released", {
    "Glucose": { value: "92", abnormal: false }, "BUN": { value: "15", abnormal: false },
    "Creatinine": { value: "0.9", abnormal: false }, "Sodium": { value: "140", abnormal: false },
    "Potassium": { value: "4.1", abnormal: false }, "Chloride": { value: "101", abnormal: false },
    "CO2": { value: "26", abnormal: false }, "Calcium": { value: "9.4", abnormal: false },
    "Total Protein": { value: "7.2", abnormal: false }, "Albumin": { value: "4.3", abnormal: false },
    "Bilirubin Total": { value: "0.8", abnormal: false }, "ALP": { value: "72", abnormal: false },
    "AST": { value: "24", abnormal: false }, "ALT": { value: "19", abnormal: false },
  }, USERS.reviewer);

  addResults(oid(2), "lipid", "released", {
    "Total Cholesterol": { value: "215", abnormal: true }, "Triglycerides": { value: "168", abnormal: true },
    "HDL Cholesterol": { value: "38", abnormal: true }, "LDL Cholesterol": { value: "142", abnormal: true },
  }, USERS.reviewer);

  addResults(oid(3), "electrolytes", "released", {
    "Sodium": { value: "138", abnormal: false }, "Potassium": { value: "5.3", abnormal: true },
    "Chloride": { value: "99", abnormal: false }, "CO2": { value: "24", abnormal: false },
  }, USERS.reviewer);

  addResults(oid(4), "bmp", "released", {
    "Glucose": { value: "105", abnormal: true }, "BUN": { value: "22", abnormal: true },
    "Creatinine": { value: "1.3", abnormal: true }, "Sodium": { value: "141", abnormal: false },
    "Potassium": { value: "4.5", abnormal: false }, "Chloride": { value: "103", abnormal: false },
    "CO2": { value: "25", abnormal: false }, "Calcium": { value: "9.8", abnormal: false },
  }, USERS.reviewer);

  addResults(oid(5), "liver", "released", {
    "AST": { value: "65", abnormal: true }, "ALT": { value: "78", abnormal: true },
    "ALP": { value: "155", abnormal: true }, "Bilirubin Total": { value: "1.8", abnormal: true },
    "Total Protein": { value: "6.1", abnormal: false }, "Albumin": { value: "3.4", abnormal: true },
    "GGT": { value: "82", abnormal: true },
  }, USERS.reviewer);

  addResults(oid(6), "renal", "released", {
    "BUN": { value: "18", abnormal: false }, "Creatinine": { value: "1.1", abnormal: false },
    "Uric Acid": { value: "5.5", abnormal: false }, "Phosphorus": { value: "3.8", abnormal: false },
  }, USERS.reviewer);

  addResults(oid(7), "cmp", "released", {
    "Glucose": { value: "88", abnormal: false }, "BUN": { value: "14", abnormal: false },
    "Creatinine": { value: "0.8", abnormal: false }, "Sodium": { value: "142", abnormal: false },
    "Potassium": { value: "4.0", abnormal: false }, "Chloride": { value: "100", abnormal: false },
    "CO2": { value: "27", abnormal: false }, "Calcium": { value: "9.6", abnormal: false },
    "Total Protein": { value: "7.0", abnormal: false }, "Albumin": { value: "4.5", abnormal: false },
    "Bilirubin Total": { value: "0.6", abnormal: false }, "ALP": { value: "85", abnormal: false },
    "AST": { value: "20", abnormal: false }, "ALT": { value: "15", abnormal: false },
  }, USERS.reviewer);

  addResults(oid(8), "electrolytes", "released", {
    "Sodium": { value: "144", abnormal: false }, "Potassium": { value: "3.8", abnormal: false },
    "Chloride": { value: "105", abnormal: false }, "CO2": { value: "28", abnormal: false },
  }, USERS.reviewer);

  // Review orders — results in review status
  addResults(oid(9), "cmp", "review", {
    "Glucose": { value: "132", abnormal: true }, "BUN": { value: "28", abnormal: true },
    "Creatinine": { value: "1.5", abnormal: true }, "Sodium": { value: "133", abnormal: true },
    "Potassium": { value: "5.6", abnormal: true }, "Chloride": { value: "97", abnormal: true },
    "CO2": { value: "21", abnormal: true }, "Calcium": { value: "8.2", abnormal: true },
    "Total Protein": { value: "5.8", abnormal: true }, "Albumin": { value: "3.2", abnormal: true },
    "Bilirubin Total": { value: "1.4", abnormal: true }, "ALP": { value: "160", abnormal: true },
    "AST": { value: "52", abnormal: true }, "ALT": { value: "61", abnormal: true },
  });

  addResults(oid(10), "electrolytes", "review", {
    "Sodium": { value: "135", abnormal: true }, "Potassium": { value: "3.4", abnormal: true },
    "Chloride": { value: "98", abnormal: false }, "CO2": { value: "22", abnormal: true },
  });

  addResults(oid(11), "liver", "review", {
    "AST": { value: "38", abnormal: false }, "ALT": { value: "42", abnormal: false },
    "ALP": { value: "130", abnormal: false }, "Bilirubin Total": { value: "1.0", abnormal: false },
    "Total Protein": { value: "7.1", abnormal: false }, "Albumin": { value: "4.0", abnormal: false },
    "GGT": { value: "35", abnormal: false },
  });

  addResults(oid(12), "lipid", "review", {
    "Total Cholesterol": { value: "195", abnormal: false }, "Triglycerides": { value: "140", abnormal: false },
    "HDL Cholesterol": { value: "52", abnormal: false }, "LDL Cholesterol": { value: "115", abnormal: true },
  });

  addResults(oid(13), "renal", "review", {
    "BUN": { value: "25", abnormal: true }, "Creatinine": { value: "1.4", abnormal: true },
    "Uric Acid": { value: "7.8", abnormal: true }, "Phosphorus": { value: "4.8", abnormal: true },
  });

  addResults(oid(14), "bmp", "review", {
    "Glucose": { value: "78", abnormal: false }, "BUN": { value: "12", abnormal: false },
    "Creatinine": { value: "0.7", abnormal: false }, "Sodium": { value: "139", abnormal: false },
    "Potassium": { value: "4.3", abnormal: false }, "Chloride": { value: "102", abnormal: false },
    "CO2": { value: "26", abnormal: false }, "Calcium": { value: "9.5", abnormal: false },
  });

  // Draft results (technicians entered but not submitted)
  addResults(oid(15), "liver", "draft", {
    "AST": { value: "45", abnormal: true }, "ALT": { value: "55", abnormal: false },
    "ALP": { value: "110", abnormal: false }, "Bilirubin Total": { value: "0.9", abnormal: false },
    "Total Protein": { value: "6.8", abnormal: false }, "Albumin": { value: "3.9", abnormal: false },
    "GGT": { value: "52", abnormal: true },
  });

  addResults(oid(16), "bmp", "draft", {
    "Glucose": { value: "95", abnormal: false }, "BUN": { value: "16", abnormal: false },
    "Creatinine": { value: "1.0", abnormal: false }, "Sodium": { value: "141", abnormal: false },
    "Potassium": { value: "4.2", abnormal: false }, "Chloride": { value: "100", abnormal: false },
    "CO2": { value: "25", abnormal: false }, "Calcium": { value: "9.3", abnormal: false },
  });

  addResults(oid(37), "lipid", "review", {
    "Total Cholesterol": { value: "245", abnormal: true }, "Triglycerides": { value: "210", abnormal: true },
    "HDL Cholesterol": { value: "35", abnormal: true }, "LDL Cholesterol": { value: "168", abnormal: true },
  });

  addResults(oid(35), "bmp", "released", {
    "Glucose": { value: "90", abnormal: false }, "BUN": { value: "13", abnormal: false },
    "Creatinine": { value: "0.8", abnormal: false }, "Sodium": { value: "140", abnormal: false },
    "Potassium": { value: "4.0", abnormal: false }, "Chloride": { value: "102", abnormal: false },
    "CO2": { value: "26", abnormal: false }, "Calcium": { value: "9.5", abnormal: false },
  }, USERS.reviewer);

  addResults(oid(36), "liver", "released", {
    "AST": { value: "48", abnormal: true }, "ALT": { value: "62", abnormal: true },
    "ALP": { value: "140", abnormal: false }, "Bilirubin Total": { value: "1.1", abnormal: false },
    "Total Protein": { value: "6.5", abnormal: false }, "Albumin": { value: "3.6", abnormal: false },
    "GGT": { value: "55", abnormal: true },
  }, USERS.reviewer);

  await upsert("results", results);

  // ---------------------------------------------------------------------------
  // 9. Reports
  // ---------------------------------------------------------------------------
  console.log("9/9  Reports (12)...");
  const rpid = (n: number) => uuid("ab000001", n);

  const reports = [
    { id: rpid(1), report_ref: "RP-50001", order_id: oid(1), patient_id: pid(1), format: "pdf_json", version: 1, status: "released", released_by: USERS.reviewer, released_at: daysAgo(4.5) },
    { id: rpid(2), report_ref: "RP-50002", order_id: oid(2), patient_id: pid(2), format: "pdf", version: 1, status: "released", released_by: USERS.reviewer, released_at: daysAgo(3.5) },
    { id: rpid(3), report_ref: "RP-50003", order_id: oid(3), patient_id: pid(3), format: "pdf_csv", version: 1, status: "released", released_by: USERS.admin, released_at: daysAgo(2.5) },
    { id: rpid(4), report_ref: "RP-50004", order_id: oid(4), patient_id: pid(10), format: "pdf", version: 1, status: "released", released_by: USERS.reviewer, released_at: daysAgo(2) },
    { id: rpid(5), report_ref: "RP-50005", order_id: oid(5), patient_id: pid(15), format: "pdf_json", version: 1, status: "released", released_by: USERS.reviewer, released_at: daysAgo(1.5) },
    { id: rpid(6), report_ref: "RP-50006", order_id: oid(5), patient_id: pid(15), format: "pdf_csv", version: 2, status: "released", released_by: USERS.admin, released_at: daysAgo(1) },
    { id: rpid(7), report_ref: "RP-50007", order_id: oid(6), patient_id: pid(11), format: "pdf", version: 1, status: "released", released_by: USERS.reviewer, released_at: daysAgo(1) },
    { id: rpid(8), report_ref: "RP-50008", order_id: oid(7), patient_id: pid(22), format: "pdf_json", version: 1, status: "release_ready", released_by: null, released_at: null },
    { id: rpid(9), report_ref: "RP-50009", order_id: oid(8), patient_id: pid(25), format: "pdf", version: 1, status: "formatting" },
    { id: rpid(10), report_ref: "RP-50010", order_id: oid(35), patient_id: pid(1), format: "pdf", version: 1, status: "released", released_by: USERS.reviewer, released_at: daysAgo(9) },
    { id: rpid(11), report_ref: "RP-50011", order_id: oid(36), patient_id: pid(4), format: "pdf_json", version: 1, status: "released", released_by: USERS.admin, released_at: daysAgo(6) },
    { id: rpid(12), report_ref: "RP-50012", order_id: oid(36), patient_id: pid(4), format: "pdf_csv", version: 2, status: "queued" },
  ].map((r) => ({ ...r, organization_id: ORG_ID }));
  await upsert("reports", reports);

  // ---------------------------------------------------------------------------
  // Done!
  // ---------------------------------------------------------------------------
  console.log("\n=== Seed Complete! ===");
  console.log(`  Organization: Metro Clinical Labs`);
  console.log(`  Users:      5 (admin, intake, technician x2, reviewer)`);
  console.log(`  Tests:      26 | Panels: 6`);
  console.log(`  Patients:   30 (25 active, 2 inactive, 1 merged, 2 active)`);
  console.log(`  Orders:     40 (8 released, 6 review, 6 in_process, 6 collected, 8 draft, 6 multi-visit)`);
  console.log(`  Specimens:  35 (10 completed-released, 7 completed-review, 7 processing, 7 received, 4 rejected)`);
  console.log(`  Results:    ${results.length} individual test results across ${new Set(results.map(r => r.order_id)).size} orders`);
  console.log(`  Reports:    12 (9 released, 1 release_ready, 1 formatting, 1 queued)`);
}

async function upsert(table: string, data: Record<string, unknown>[], onConflict = "id") {
  const { error } = await supabase.from(table).upsert(data, { onConflict });
  if (error) {
    console.error(`  ERROR in ${table}: ${error.message}`);
    throw error;
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
