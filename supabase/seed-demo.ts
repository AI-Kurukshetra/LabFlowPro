/**
 * Demo seed script for LabFlow Pro
 * Generates a massive, realistic clinical chemistry lab dataset for demos.
 *
 * Run: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx supabase/seed-demo.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ORG_ID = "a1b2c3d4-0000-4000-8000-000000000001";

const USERS = {
  admin: "fe10ab13-c19b-49cc-8f32-8889f359f5f2", // Mike Johnson
  intake: "05c2c02f-3995-4c7c-a297-bac9e2c96f67", // Sarah Williams
  technician1: "c676bcad-5a29-4e63-9421-b14f2caacade", // Brian Davis
  reviewer: "2a77e189-361f-4f27-943f-dea499708903", // Jessica Miller
  technician2: "0768f486-80fc-4b00-90b7-d9bb2c88b79f", // Chris Anderson
};

const REVIEWERS = [USERS.reviewer, USERS.admin];
const COLLECTORS = ["S. Williams", "B. Davis", "C. Anderson"];

const PANEL = {
  bmp: "b0000001-0000-4000-8000-000000000001",
  cmp: "b0000001-0000-4000-8000-000000000002",
  electrolytes: "b0000001-0000-4000-8000-000000000003",
  liver: "b0000001-0000-4000-8000-000000000004",
  lipid: "b0000001-0000-4000-8000-000000000005",
  renal: "b0000001-0000-4000-8000-000000000006",
};

const PANEL_KEYS = Object.keys(PANEL) as (keyof typeof PANEL)[];

const PANEL_TEST_MAP: Record<string, number[]> = {
  bmp: [1, 2, 3, 4, 5, 6, 7, 8],
  cmp: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  electrolytes: [4, 5, 6, 7],
  liver: [13, 14, 12, 11, 9, 10, 19],
  lipid: [15, 16, 17, 18],
  renal: [2, 3, 20, 21],
};

// Test definitions with reference ranges
const TESTS: {
  num: number;
  name: string;
  unit: string;
  min: number;
  max: number;
}[] = [
  { num: 1, name: "Glucose", unit: "mg/dL", min: 70, max: 100 },
  { num: 2, name: "BUN", unit: "mg/dL", min: 7, max: 20 },
  { num: 3, name: "Creatinine", unit: "mg/dL", min: 0.6, max: 1.2 },
  { num: 4, name: "Sodium", unit: "mEq/L", min: 136, max: 145 },
  { num: 5, name: "Potassium", unit: "mEq/L", min: 3.5, max: 5.0 },
  { num: 6, name: "Chloride", unit: "mEq/L", min: 98, max: 106 },
  { num: 7, name: "CO2", unit: "mEq/L", min: 23, max: 29 },
  { num: 8, name: "Calcium", unit: "mg/dL", min: 8.5, max: 10.5 },
  { num: 9, name: "Total Protein", unit: "g/dL", min: 6.0, max: 8.3 },
  { num: 10, name: "Albumin", unit: "g/dL", min: 3.5, max: 5.5 },
  { num: 11, name: "Bilirubin Total", unit: "mg/dL", min: 0.1, max: 1.2 },
  { num: 12, name: "ALP", unit: "U/L", min: 44, max: 147 },
  { num: 13, name: "AST", unit: "U/L", min: 10, max: 40 },
  { num: 14, name: "ALT", unit: "U/L", min: 7, max: 56 },
  { num: 15, name: "Total Cholesterol", unit: "mg/dL", min: 0, max: 200 },
  { num: 16, name: "Triglycerides", unit: "mg/dL", min: 0, max: 150 },
  { num: 17, name: "HDL Cholesterol", unit: "mg/dL", min: 40, max: 60 },
  { num: 18, name: "LDL Cholesterol", unit: "mg/dL", min: 0, max: 100 },
  { num: 19, name: "GGT", unit: "U/L", min: 9, max: 48 },
  { num: 20, name: "Uric Acid", unit: "mg/dL", min: 3.0, max: 7.0 },
  { num: 21, name: "Phosphorus", unit: "mg/dL", min: 2.5, max: 4.5 },
  { num: 22, name: "Magnesium", unit: "mg/dL", min: 1.7, max: 2.2 },
  { num: 23, name: "Iron", unit: "mcg/dL", min: 60, max: 170 },
  { num: 24, name: "TIBC", unit: "mcg/dL", min: 250, max: 370 },
  { num: 25, name: "LDH", unit: "U/L", min: 140, max: 280 },
  { num: 26, name: "Amylase", unit: "U/L", min: 28, max: 100 },
];

const TEST_BY_NUM = new Map(TESTS.map((t) => [t.num, t]));

// ---------------------------------------------------------------------------
// Name data
// ---------------------------------------------------------------------------

const FIRST_NAMES_M = [
  "James", "John", "Robert", "Michael", "William", "David", "Richard",
  "Joseph", "Thomas", "Charles", "Christopher", "Daniel", "Matthew",
  "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua",
  "Kenneth", "Kevin", "Brian", "George", "Timothy", "Ronald", "Edward",
  "Jason", "Jeffrey", "Ryan",
];
const FIRST_NAMES_F = [
  "Mary", "Patricia", "Jennifer", "Linda", "Barbara", "Elizabeth", "Susan",
  "Jessica", "Sarah", "Karen", "Lisa", "Nancy", "Betty", "Margaret",
  "Sandra", "Ashley", "Dorothy", "Kimberly", "Emily", "Donna", "Michelle",
  "Carol", "Amanda", "Melissa", "Deborah", "Stephanie", "Rebecca", "Sharon",
  "Laura", "Cynthia",
];
const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
  "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
];

const REJECTION_REASONS = [
  "Hemolyzed sample",
  "Insufficient volume",
  "Incorrect tube type",
  "Clotted specimen",
  "Specimen not labeled",
  "Lipemic sample",
  "Specimen expired (>24h)",
  "Contaminated specimen",
  "Wrong patient label",
  "Temperature excursion during transport",
];

const SPECIMEN_TYPES: Array<
  "serum" | "plasma" | "whole_blood" | "urine" | "csf"
> = ["serum", "plasma", "whole_blood", "urine", "serum"];
// weighted: serum appears twice for higher probability

const REPORT_FORMATS: Array<"pdf" | "pdf_csv" | "pdf_json"> = [
  "pdf",
  "pdf",
  "pdf_csv",
  "pdf_json",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date();

function uuid(prefix: string, n: number): string {
  const hex = prefix.padEnd(8, "0").slice(0, 8);
  const num = n.toString().padStart(12, "0");
  return `${hex}-0000-4000-8000-${num}`;
}

function daysAgo(d: number): string {
  return new Date(now.getTime() - d * 86400000).toISOString();
}

function hoursAgo(h: number): string {
  return new Date(now.getTime() - h * 3600000).toISOString();
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Seeded random for deterministic patient names (but still looks random)
let _seed = 42;
function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}

function seededShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function testId(n: number): string {
  return uuid("a0000001", n);
}

function patientId(n: number): string {
  return uuid("c1000001", n);
}

function orderId(n: number): string {
  return uuid("d1000001", n);
}

function specimenId(n: number): string {
  return uuid("e1000001", n);
}

function resultId(n: number): string {
  return uuid("f1000001", n);
}

function reportId(n: number): string {
  return uuid("ab100001", n);
}

/**
 * Generate a test result value based on reference range.
 * 80% normal, 15% mildly abnormal, 5% critically abnormal.
 */
function generateValue(
  min: number,
  max: number
): { value: string; is_abnormal: boolean } {
  const range = max - min;
  const roll = Math.random();

  if (roll < 0.8) {
    // Normal
    const v = round1(randomBetween(min, max));
    return { value: v.toString(), is_abnormal: false };
  } else if (roll < 0.95) {
    // Mildly abnormal (5-20% outside range)
    const direction = Math.random() < 0.5 ? -1 : 1;
    const offset = randomBetween(0.05, 0.2) * range;
    const v = round1(
      direction === -1 ? min - offset : max + offset
    );
    // Don't go below 0 for values that shouldn't be negative
    return { value: Math.max(0, v).toString(), is_abnormal: true };
  } else {
    // Critically abnormal (30-50% outside range)
    const direction = Math.random() < 0.5 ? -1 : 1;
    const offset = randomBetween(0.3, 0.5) * range;
    const v = round1(
      direction === -1 ? min - offset : max + offset
    );
    return { value: Math.max(0, v).toString(), is_abnormal: true };
  }
}

// ---------------------------------------------------------------------------
// Generate unique patient names
// ---------------------------------------------------------------------------

function generatePatientNames(count: number): string[] {
  const names = new Set<string>();
  const shuffledLastNames = seededShuffle(LAST_NAMES);
  const shuffledM = seededShuffle(FIRST_NAMES_M);
  const shuffledF = seededShuffle(FIRST_NAMES_F);

  // First pass: systematic combination
  let mIdx = 0;
  let fIdx = 0;
  let lIdx = 0;

  while (names.size < count) {
    const lastName = shuffledLastNames[lIdx % shuffledLastNames.length];
    // Alternate male/female
    if (names.size % 2 === 0) {
      const firstName = shuffledM[mIdx % shuffledM.length];
      const full = `${firstName} ${lastName}`;
      if (!names.has(full)) names.add(full);
      mIdx++;
    } else {
      const firstName = shuffledF[fIdx % shuffledF.length];
      const full = `${firstName} ${lastName}`;
      if (!names.has(full)) names.add(full);
      fIdx++;
    }
    lIdx++;
  }

  return Array.from(names);
}

// ---------------------------------------------------------------------------
// Generate DOBs (ages 18-85)
// ---------------------------------------------------------------------------

function generateDOB(index: number): string {
  // Spread ages across 18-85, weighted toward 30-70
  const ageBase = 18 + ((index * 67) % 68); // deterministic spread
  const jitter = Math.floor(seededRandom() * 3) - 1; // -1, 0, or +1 year
  const age = Math.max(18, Math.min(85, ageBase + jitter));
  const year = now.getFullYear() - age;
  const month = ((index * 7 + 3) % 12) + 1;
  const day = ((index * 13 + 5) % 28) + 1;
  return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed() {
  console.log("=== LabFlow Pro DEMO Seed ===\n");
  console.log("Generating realistic clinical chemistry demo dataset...\n");

  // =========================================================================
  // 1/8 PATIENTS (100)
  // =========================================================================
  console.log("1/8  Patients (100)...");

  const patientNames = generatePatientNames(100);
  const patients = patientNames.map((fullName, i) => {
    const n = i + 1;
    const gender = fullName.split(" ")[0]
      ? FIRST_NAMES_M.includes(fullName.split(" ")[0])
        ? "male"
        : "female"
      : "male";

    let status: "active" | "inactive" | "merged" = "active";
    if (n >= 91 && n <= 95) status = "inactive";
    else if (n >= 96 && n <= 98) status = "merged";
    // 99-100 stay active (totaling 90 active + 5 inactive + 3 merged + 2 active = 100)

    return {
      id: patientId(n),
      organization_id: ORG_ID,
      patient_ref: `PT-${20000 + n}`,
      full_name: fullName,
      date_of_birth: generateDOB(n),
      gender,
      phone: `555-${(1000 + n).toString()}`,
      email: `${fullName.toLowerCase().replace(" ", ".")}@email.com`,
      status,
    };
  });

  await batchUpsert("patients", patients);

  // =========================================================================
  // 2/8 ORDERS (260)
  // =========================================================================
  console.log("2/8  Orders (260)...");

  type OrderDef = {
    id: string;
    organization_id: string;
    order_ref: string;
    patient_id: string;
    panel_id: string;
    priority: "routine" | "urgent" | "stat";
    status: "draft" | "collected" | "in_process" | "review" | "released";
    collection_date: string | null;
    notes?: string;
  };

  const orders: OrderDef[] = [];

  // Status distribution: ~30% released (78), ~15% review (39), ~15% in_process (39),
  // ~15% collected (39), ~25% draft (65) = 260 total
  const statusBuckets: {
    status: OrderDef["status"];
    count: number;
    daysRange: [number, number];
  }[] = [
    { status: "released", count: 78, daysRange: [1, 30] },
    { status: "review", count: 39, daysRange: [0, 5] },
    { status: "in_process", count: 39, daysRange: [0, 3] },
    { status: "collected", count: 39, daysRange: [0, 2] },
    { status: "draft", count: 65, daysRange: [0, 0] },
  ];

  let orderIdx = 0;

  for (const bucket of statusBuckets) {
    for (let i = 0; i < bucket.count; i++) {
      orderIdx++;
      const patIdx = ((orderIdx * 7 + i * 3) % 90) + 1; // cycle through active patients (1-90)

      // Priority distribution: 70% routine, 20% urgent, 10% STAT
      let priority: "routine" | "urgent" | "stat" = "routine";
      const pRoll = Math.random();
      if (pRoll > 0.9) priority = "stat";
      else if (pRoll > 0.7) priority = "urgent";

      const panelKey = PANEL_KEYS[orderIdx % PANEL_KEYS.length];

      // Time distribution: more recent orders are more common
      let collectionDate: string | null = null;
      if (bucket.status !== "draft") {
        const [minD, maxD] = bucket.daysRange;
        // Weighted toward recent: square root distribution
        const dayOffset = minD + Math.pow(Math.random(), 2) * (maxD - minD);
        collectionDate =
          dayOffset < 1
            ? hoursAgo(randomBetween(0.5, 24))
            : daysAgo(round1(dayOffset));
      }

      const order: OrderDef = {
        id: orderId(orderIdx),
        organization_id: ORG_ID,
        order_ref: `LF-${3000 + orderIdx}`,
        patient_id: patientId(patIdx),
        panel_id: PANEL[panelKey],
        priority,
        status: bucket.status,
        collection_date: collectionDate,
      };

      // Add notes to some orders
      if (orderIdx % 15 === 0) order.notes = "Follow-up from previous visit";
      else if (orderIdx % 23 === 0)
        order.notes = "Annual physical labs";
      else if (orderIdx % 31 === 0)
        order.notes = "Elevated values on prior panel - recheck";
      else if (orderIdx % 37 === 0)
        order.notes = "Pre-surgical workup";
      else if (orderIdx % 41 === 0)
        order.notes = "Medication monitoring";

      orders.push(order);
    }
  }

  await batchUpsert("orders", orders);

  // =========================================================================
  // 3/8 SPECIMENS (220)
  // =========================================================================
  console.log("3/8  Specimens (220)...");

  type SpecimenDef = {
    id: string;
    organization_id: string;
    specimen_ref: string;
    order_id: string;
    type: "serum" | "plasma" | "whole_blood" | "urine" | "csf" | "other";
    collector: string;
    barcode: string;
    collected_at: string | null;
    status: "received" | "processing" | "completed" | "rejected";
    rejection_reason?: string;
  };

  const specimens: SpecimenDef[] = [];
  let specIdx = 0;

  // Specimens for non-draft orders (orders 1-195, i.e., released + review + in_process + collected)
  const nonDraftOrders = orders.filter((o) => o.status !== "draft");

  for (const order of nonDraftOrders) {
    specIdx++;
    let specimenStatus: SpecimenDef["status"];

    switch (order.status) {
      case "released":
      case "review":
        specimenStatus = "completed";
        break;
      case "in_process":
        specimenStatus = "processing";
        break;
      case "collected":
        specimenStatus = "received";
        break;
      default:
        specimenStatus = "received";
    }

    specimens.push({
      id: specimenId(specIdx),
      organization_id: ORG_ID,
      specimen_ref: `SP-${40000 + specIdx}`,
      order_id: order.id,
      type: randomFrom(SPECIMEN_TYPES),
      collector: COLLECTORS[specIdx % COLLECTORS.length],
      barcode: `LF${40000 + specIdx}A`,
      collected_at: order.collection_date,
      status: specimenStatus,
    });

    // ~10% of orders get a second specimen (rejected, then recollected)
    if (specIdx % 10 === 0 && specIdx <= 195) {
      specIdx++;
      specimens.push({
        id: specimenId(specIdx),
        organization_id: ORG_ID,
        specimen_ref: `SP-${40000 + specIdx}`,
        order_id: order.id,
        type: randomFrom(SPECIMEN_TYPES),
        collector: COLLECTORS[specIdx % COLLECTORS.length],
        barcode: `LF${40000 + specIdx}B`,
        collected_at: order.collection_date
          ? new Date(
              new Date(order.collection_date).getTime() - 3600000 * 2
            ).toISOString()
          : null,
        status: "rejected",
        rejection_reason: randomFrom(REJECTION_REASONS),
      });
    }
  }

  await batchUpsert("specimens", specimens);

  // =========================================================================
  // 4/8 RESULTS (500+)
  // =========================================================================
  console.log("4/8  Results...");

  type ResultDef = {
    id: string;
    organization_id: string;
    order_id: string;
    test_id: string;
    value: string;
    unit: string;
    is_abnormal: boolean;
    status: "draft" | "review" | "approved" | "released" | "returned";
    reviewer_id?: string;
    reviewed_at?: string;
    approved_at?: string;
  };

  const results: ResultDef[] = [];
  let resIdx = 0;

  // Generate results for all orders that have progressed past collection
  const ordersWithResults = orders.filter(
    (o) =>
      o.status === "released" ||
      o.status === "review" ||
      o.status === "in_process"
  );

  for (const order of ordersWithResults) {
    const panelKey = PANEL_KEYS.find(
      (k) => PANEL[k] === order.panel_id
    );
    if (!panelKey) continue;

    const testNums = PANEL_TEST_MAP[panelKey];

    let resultStatus: ResultDef["status"];
    switch (order.status) {
      case "released":
        resultStatus = "released";
        break;
      case "review":
        resultStatus = "review";
        break;
      case "in_process":
        resultStatus = "draft";
        break;
      default:
        resultStatus = "draft";
    }

    for (const testNum of testNums) {
      const test = TEST_BY_NUM.get(testNum);
      if (!test) continue;

      resIdx++;

      const { value, is_abnormal } = generateValue(test.min, test.max);

      const result: ResultDef = {
        id: resultId(resIdx),
        organization_id: ORG_ID,
        order_id: order.id,
        test_id: testId(testNum),
        value,
        unit: test.unit,
        is_abnormal,
        status: resultStatus,
      };

      // Add reviewer for released and approved results
      if (resultStatus === "released") {
        const reviewer = REVIEWERS[resIdx % REVIEWERS.length];
        result.reviewer_id = reviewer;
        // Reviewed some time after collection
        const collMs = order.collection_date
          ? new Date(order.collection_date).getTime()
          : now.getTime() - 86400000;
        const reviewedMs = collMs + randomBetween(3600000, 86400000); // 1-24h after collection
        result.reviewed_at = new Date(
          Math.min(reviewedMs, now.getTime())
        ).toISOString();
        result.approved_at = new Date(
          Math.min(reviewedMs + 1800000, now.getTime())
        ).toISOString();
      }

      results.push(result);
    }
  }

  // Also add partial draft results for some in_process orders that are partially entered
  // (already handled above since in_process -> draft status)

  // Add a few "returned" results scattered across review orders for realism
  const reviewOrders = orders.filter((o) => o.status === "review");
  for (let i = 0; i < Math.min(8, reviewOrders.length); i += 4) {
    const order = reviewOrders[i];
    const panelKey = PANEL_KEYS.find(
      (k) => PANEL[k] === order.panel_id
    );
    if (!panelKey) continue;
    const testNums = PANEL_TEST_MAP[panelKey];
    if (testNums.length === 0) continue;

    // Add a returned result for the first test in the panel
    const testNum = testNums[0];
    const test = TEST_BY_NUM.get(testNum);
    if (!test) continue;

    resIdx++;
    const { value, is_abnormal } = generateValue(test.min, test.max);
    results.push({
      id: resultId(resIdx),
      organization_id: ORG_ID,
      order_id: order.id,
      test_id: testId(testNum),
      value,
      unit: test.unit,
      is_abnormal,
      status: "returned",
      reviewer_id: USERS.reviewer,
      reviewed_at: hoursAgo(randomBetween(2, 6)),
    });
  }

  await batchUpsert("results", results);

  // =========================================================================
  // 5/8 REPORTS (85)
  // =========================================================================
  console.log("5/8  Reports (85)...");

  type ReportDef = {
    id: string;
    organization_id: string;
    report_ref: string;
    order_id: string;
    patient_id: string;
    format: "pdf" | "pdf_csv" | "pdf_json";
    version: number;
    status: "queued" | "formatting" | "release_ready" | "released";
    released_by?: string | null;
    released_at?: string | null;
  };

  const reports: ReportDef[] = [];
  let rptIdx = 0;

  const releasedOrders = orders.filter((o) => o.status === "released");

  // Released orders get released reports
  for (const order of releasedOrders) {
    rptIdx++;
    const format = randomFrom(REPORT_FORMATS);
    const collMs = order.collection_date
      ? new Date(order.collection_date).getTime()
      : now.getTime() - 86400000;
    const releasedMs = collMs + randomBetween(86400000, 172800000); // 1-2 days after collection

    reports.push({
      id: reportId(rptIdx),
      organization_id: ORG_ID,
      report_ref: `RP-${60000 + rptIdx}`,
      order_id: order.id,
      patient_id: order.patient_id,
      format,
      version: 1,
      status: "released",
      released_by: REVIEWERS[rptIdx % REVIEWERS.length],
      released_at: new Date(
        Math.min(releasedMs, now.getTime())
      ).toISOString(),
    });

    // ~10% get a version 2 (re-released with corrections)
    if (rptIdx % 10 === 0) {
      rptIdx++;
      reports.push({
        id: reportId(rptIdx),
        organization_id: ORG_ID,
        report_ref: `RP-${60000 + rptIdx}`,
        order_id: order.id,
        patient_id: order.patient_id,
        format: randomFrom(REPORT_FORMATS),
        version: 2,
        status: "released",
        released_by: USERS.admin,
        released_at: new Date(
          Math.min(releasedMs + 86400000, now.getTime())
        ).toISOString(),
      });
    }
  }

  // A few reports in pipeline stages (for review orders that are almost done)
  const reviewOrdersForReports = orders
    .filter((o) => o.status === "review")
    .slice(0, 5);

  for (const order of reviewOrdersForReports) {
    rptIdx++;
    const statuses: ReportDef["status"][] = [
      "queued",
      "formatting",
      "release_ready",
      "queued",
      "formatting",
    ];
    reports.push({
      id: reportId(rptIdx),
      organization_id: ORG_ID,
      report_ref: `RP-${60000 + rptIdx}`,
      order_id: order.id,
      patient_id: order.patient_id,
      format: randomFrom(REPORT_FORMATS),
      version: 1,
      status: statuses[rptIdx % statuses.length],
      released_by: null,
      released_at: null,
    });
  }

  await batchUpsert("reports", reports);

  // =========================================================================
  // SUMMARY
  // =========================================================================
  const statusCounts = (arr: { status: string }[]) => {
    const counts: Record<string, number> = {};
    for (const item of arr) {
      counts[item.status] = (counts[item.status] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([k, v]) => `${v} ${k}`)
      .join(", ");
  };

  const abnormalCount = results.filter((r) => r.is_abnormal).length;

  console.log("\n=== Demo Seed Complete! ===");
  console.log(`  Patients:   ${patients.length} (${statusCounts(patients)})`);
  console.log(`  Orders:     ${orders.length} (${statusCounts(orders)})`);
  console.log(`  Specimens:  ${specimens.length} (${statusCounts(specimens)})`);
  console.log(
    `  Results:    ${results.length} across ${new Set(results.map((r) => r.order_id)).size} orders (${abnormalCount} abnormal, ${statusCounts(results)})`
  );
  console.log(`  Reports:    ${reports.length} (${statusCounts(reports)})`);
  console.log(
    `\n  Total records: ${patients.length + orders.length + specimens.length + results.length + reports.length}`
  );
}

// ---------------------------------------------------------------------------
// Upsert helper with batching (Supabase has row limits per request)
// ---------------------------------------------------------------------------

async function batchUpsert(
  table: string,
  data: Record<string, unknown>[],
  onConflict = "id",
  batchSize = 100
) {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict });
    if (error) {
      console.error(
        `  ERROR in ${table} (batch ${Math.floor(i / batchSize) + 1}): ${error.message}`
      );
      throw error;
    }
  }
  console.log(`    -> ${data.length} rows upserted into ${table}`);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
