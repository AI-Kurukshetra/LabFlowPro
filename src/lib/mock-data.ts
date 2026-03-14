export type MetricCardData = {
  label: string;
  value: string;
  helper: string;
};

export type DataColumn = {
  key: string;
  label: string;
};

export type DataRow = Record<string, string>;

export type TableCardData = {
  title: string;
  description: string;
  columns: DataColumn[];
  rows: DataRow[];
};

export type ModulePageData = {
  title: string;
  description: string;
  status: string;
  metrics: MetricCardData[];
  columns: DataColumn[];
  rows: DataRow[];
  notes: string[];
};

export const landingMetrics: MetricCardData[] = [
  {
    label: "Intake Target",
    value: "< 2 min",
    helper: "Patient plus order creation for common cases",
  },
  {
    label: "Tracking Goal",
    value: "90%+",
    helper: "Specimens captured end-to-end in one system",
  },
  {
    label: "Release Control",
    value: "2-step",
    helper: "Result entry plus supervisor verification",
  },
];

export const dashboardMetrics: MetricCardData[] = [
  {
    label: "Samples In Flight",
    value: "128",
    helper: "Across collection, processing, and review",
  },
  {
    label: "Urgent Orders",
    value: "14",
    helper: "Marked priority and due inside 45 minutes",
  },
  {
    label: "Review Queue",
    value: "09",
    helper: "Approved results pending release packaging",
  },
  {
    label: "Released Today",
    value: "67",
    helper: "PDF reports plus structured exports",
  },
];

export const dashboardQueues: TableCardData[] = [
  {
    title: "Urgent Order Queue",
    description: "Priority work that should stay in the technician focus lane.",
    columns: [
      { key: "order", label: "Order" },
      { key: "patient", label: "Patient" },
      { key: "panel", label: "Panel" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
    ],
    rows: [
      {
        order: "LF-1042",
        patient: "Mia Patel",
        panel: "CMP",
        priority: "STAT",
        status: "Ready for review",
      },
      {
        order: "LF-1046",
        patient: "Noah Kim",
        panel: "Electrolytes",
        priority: "Urgent",
        status: "Analyzer queued",
      },
      {
        order: "LF-1051",
        patient: "Ava Singh",
        panel: "Liver function",
        priority: "Urgent",
        status: "Specimen received",
      },
    ],
  },
  {
    title: "Specimen Exceptions",
    description: "Work needing direct intervention before release can continue.",
    columns: [
      { key: "specimen", label: "Specimen" },
      { key: "order", label: "Order" },
      { key: "issue", label: "Issue" },
      { key: "owner", label: "Owner" },
      { key: "status", label: "Status" },
    ],
    rows: [
      {
        specimen: "SP-22018",
        order: "LF-1049",
        issue: "Volume below threshold",
        owner: "Intake desk",
        status: "Awaiting recollection",
      },
      {
        specimen: "SP-22022",
        order: "LF-1050",
        issue: "Barcode mismatch",
        owner: "Bench 2",
        status: "Manual verification",
      },
      {
        specimen: "SP-22029",
        order: "LF-1053",
        issue: "Tube type incorrect",
        owner: "Supervisor",
        status: "Rejected",
      },
    ],
  },
  {
    title: "Release Queue",
    description: "Approved cases staged for PDF generation and downstream export.",
    columns: [
      { key: "report", label: "Report" },
      { key: "patient", label: "Patient" },
      { key: "reviewer", label: "Reviewer" },
      { key: "channel", label: "Channel" },
      { key: "status", label: "Status" },
    ],
    rows: [
      {
        report: "RP-9001",
        patient: "Nora Wells",
        reviewer: "Dr. Patel",
        channel: "PDF + JSON",
        status: "Release ready",
      },
      {
        report: "RP-9002",
        patient: "Zaid Mir",
        reviewer: "Dr. Chen",
        channel: "PDF",
        status: "Formatting check",
      },
      {
        report: "RP-9003",
        patient: "Lena Ortiz",
        reviewer: "Dr. Patel",
        channel: "PDF + CSV",
        status: "Export queued",
      },
    ],
  },
];

export const modulePageData = {
  patients: {
    title: "Patients",
    description:
      "Capture patient demographics, external references, and order history without bouncing across disconnected tools.",
    status: "Active",
    metrics: [
      { label: "Active records", value: "2,418", helper: "Current organization scope" },
      { label: "New today", value: "37", helper: "Created by intake and support staff" },
      { label: "Duplicate flags", value: "04", helper: "Records needing merge review" },
    ],
    columns: [
      { key: "patient", label: "Patient" },
      { key: "patientId", label: "Patient ID" },
      { key: "latestOrder", label: "Latest order" },
      { key: "status", label: "Status" },
    ],
    rows: [
      {
        patient: "Anika Rao",
        patientId: "PT-00142",
        latestOrder: "CMP + Lipid panel",
        status: "Awaiting specimen",
      },
      {
        patient: "Luca Bennett",
        patientId: "PT-00143",
        latestOrder: "Renal function",
        status: "In processing",
      },
      {
        patient: "Maya Coleman",
        patientId: "PT-00144",
        latestOrder: "Electrolytes",
        status: "Released",
      },
    ],
    notes: [
      "Search by patient name, internal ID, phone, or external reference.",
      "Warn staff on likely duplicates before patient creation is committed.",
      "Show order and report history from the patient detail view.",
    ],
  },
  orders: {
    title: "Orders",
    description:
      "Turn patient requests into structured work with priorities, panel selection, and a clear status model.",
    status: "Active",
    metrics: [
      { label: "Open orders", value: "186", helper: "Draft through review" },
      { label: "Collected today", value: "83", helper: "Specimens logged against an order" },
      { label: "Average TAT", value: "4h 18m", helper: "Operational benchmark snapshot" },
    ],
    columns: [
      { key: "order", label: "Order" },
      { key: "patient", label: "Patient" },
      { key: "panel", label: "Panel" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
    ],
    rows: [
      {
        order: "LF-1048",
        patient: "Dylan Hughes",
        panel: "Basic metabolic panel",
        priority: "Routine",
        status: "Collected",
      },
      {
        order: "LF-1049",
        patient: "Eva Iqbal",
        panel: "Liver function",
        priority: "STAT",
        status: "In process",
      },
      {
        order: "LF-1050",
        patient: "Owen Shah",
        panel: "Electrolytes",
        priority: "Urgent",
        status: "Review",
      },
    ],
    notes: [
      "Orders accept tests or reusable panels from the configurable catalog.",
      "Priority and collection date stay visible in queues and detail pages.",
      "Draft, collected, in_process, review, and released are the initial state model.",
    ],
  },
  specimens: {
    title: "Specimens",
    description:
      "Track each specimen from collection to completion with barcode-ready identifiers and exception handling.",
    status: "Active",
    metrics: [
      { label: "Collected today", value: "91", helper: "Specimens linked to an order" },
      { label: "Processing now", value: "28", helper: "Bench work currently active" },
      { label: "Rejected", value: "03", helper: "Requires recollection or cancellation" },
    ],
    columns: [
      { key: "specimen", label: "Specimen" },
      { key: "order", label: "Order" },
      { key: "type", label: "Type" },
      { key: "collector", label: "Collector" },
      { key: "status", label: "Status" },
    ],
    rows: [
      {
        specimen: "SP-22018",
        order: "LF-1049",
        type: "Serum",
        collector: "R. Moore",
        status: "Received",
      },
      {
        specimen: "SP-22021",
        order: "LF-1050",
        type: "Plasma",
        collector: "J. Patel",
        status: "Processing",
      },
      {
        specimen: "SP-22024",
        order: "LF-1052",
        type: "Whole blood",
        collector: "A. Lewis",
        status: "Completed",
      },
    ],
    notes: [
      "Each specimen gets a unique identifier plus a print-ready barcode value.",
      "Collection timestamp, collector, and notes are part of the core record.",
      "Rejected specimens block downstream release until resolved or replaced.",
    ],
  },
  results: {
    title: "Results",
    description:
      "Support manual entry, draft saves, review approval, and a release-safe audit trail.",
    status: "Active",
    metrics: [
      { label: "Draft sets", value: "21", helper: "Still being entered or validated" },
      { label: "Pending review", value: "09", helper: "Ready for supervisor verification" },
      { label: "Returned", value: "02", helper: "Rejected back to bench for correction" },
    ],
    columns: [
      { key: "order", label: "Order" },
      { key: "patient", label: "Patient" },
      { key: "panel", label: "Panel" },
      { key: "reviewer", label: "Reviewer" },
      { key: "status", label: "Status" },
    ],
    rows: [
      {
        order: "LF-1046",
        patient: "Noah Kim",
        panel: "Electrolytes",
        reviewer: "Pending",
        status: "Draft",
      },
      {
        order: "LF-1047",
        patient: "Priya Das",
        panel: "CMP",
        reviewer: "Dr. Chen",
        status: "Review",
      },
      {
        order: "LF-1051",
        patient: "Ava Singh",
        panel: "Liver function",
        reviewer: "Dr. Patel",
        status: "Approved",
      },
    ],
    notes: [
      "Numeric, text, and select-based result types are supported in the first pass.",
      "Approval state records who reviewed, when they reviewed, and what changed.",
      "Release is blocked until every required ordered test is approved.",
    ],
  },
  reports: {
    title: "Reports",
    description:
      "Package approved results into branded PDFs and lightweight exports for downstream systems.",
    status: "Active",
    metrics: [
      { label: "Generated today", value: "67", helper: "Finalized report outputs" },
      { label: "Versioned edits", value: "05", helper: "Post-release revisions tracked" },
      { label: "Export channels", value: "02", helper: "PDF plus CSV or JSON" },
    ],
    columns: [
      { key: "report", label: "Report" },
      { key: "patient", label: "Patient" },
      { key: "format", label: "Format" },
      { key: "releasedBy", label: "Released by" },
      { key: "status", label: "Status" },
    ],
    rows: [
      {
        report: "RP-9001",
        patient: "Nora Wells",
        format: "PDF + JSON",
        releasedBy: "Dr. Patel",
        status: "Released",
      },
      {
        report: "RP-9002",
        patient: "Zaid Mir",
        format: "PDF",
        releasedBy: "Dr. Chen",
        status: "Version 2",
      },
      {
        report: "RP-9003",
        patient: "Lena Ortiz",
        format: "PDF + CSV",
        releasedBy: "Dr. Patel",
        status: "Queued",
      },
    ],
    notes: [
      "Only approved result sets can generate a final report artifact.",
      "Release timestamp and releasing user are part of the report record.",
      "CSV and JSON exports keep external system handoff intentionally simple in v1.",
    ],
  },
  admin: {
    title: "Admin",
    description:
      "Control tenant configuration, users, roles, and the starting test catalog without drifting into enterprise setup overhead.",
    status: "Active",
    metrics: [
      { label: "Active users", value: "17", helper: "Across intake, bench, and review" },
      { label: "Role sets", value: "04", helper: "Admin, intake, technician, reviewer" },
      { label: "Active tests", value: "26", helper: "Clinical chemistry-first catalog" },
    ],
    columns: [
      { key: "user", label: "User" },
      { key: "role", label: "Role" },
      { key: "scope", label: "Scope" },
      { key: "lastSeen", label: "Last seen" },
      { key: "status", label: "Status" },
    ],
    rows: [
      {
        user: "Rina Moore",
        role: "Intake staff",
        scope: "Registration",
        lastSeen: "08:14",
        status: "Active",
      },
      {
        user: "Dr. Chen",
        role: "Reviewer",
        scope: "Result approval",
        lastSeen: "08:42",
        status: "Active",
      },
      {
        user: "Sam Ortega",
        role: "Lab admin",
        scope: "Catalog and users",
        lastSeen: "Yesterday",
        status: "Pending invite",
      },
    ],
    notes: [
      "Tenant-aware roles are enforced through Supabase Auth and row-level security.",
      "User invitations and deactivation stay in scope; deep workforce management does not.",
      "The catalog is kept intentionally light: tests, panels, units, and default ranges.",
    ],
  },
} satisfies Record<
  "patients" | "orders" | "specimens" | "results" | "reports" | "admin",
  ModulePageData
>;
