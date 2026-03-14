import type { SupabaseClient } from "@supabase/supabase-js";

// ---------- types ----------

export type AnalyticsData = {
  // KPI row 1 — volume
  totalPatients: number;
  totalOrders30d: number;
  totalSpecimens30d: number;
  totalResults30d: number;

  // KPI row 2 — performance
  avgTurnaroundMinutes: number;
  approvalRate: number;
  rejectionRate: number;
  reportsReleased30d: number;

  // Order pipeline
  orderPipeline: Record<string, number>;
  recentOrders: RecentOrderRow[];

  // Specimen analytics
  specimenStatusCounts: Record<string, number>;
  specimenTypeCounts: Record<string, number>;
  rejectionReasons: { reason: string; count: number }[];
  recentRejectedSpecimens: RejectedSpecimenRow[];

  // Result metrics
  resultStatusCounts: Record<string, number>;
  abnormalRate: number;
  topAbnormalTests: AbnormalTestRow[];

  // Staff activity
  staffActivity: StaffActivityRow[];

  // Report output
  reportStatusCounts: Record<string, number>;
  reportFormatCounts: Record<string, number>;
  recentReports: RecentReportRow[];
};

export type RecentOrderRow = {
  id: string;
  order_ref: string;
  patient_name: string;
  panel_name: string;
  priority: string;
  status: string;
  created_at: string;
};

export type RejectedSpecimenRow = {
  id: string;
  specimen_ref: string;
  patient_name: string;
  type: string;
  rejection_reason: string;
  created_at: string;
};

export type AbnormalTestRow = {
  test_name: string;
  total: number;
  abnormal_count: number;
  abnormal_pct: number;
};

export type StaffActivityRow = {
  id: string;
  full_name: string;
  role: string;
  orders_created: number;
  specimens_processed: number;
  results_reviewed: number;
  last_seen_at: string | null;
};

export type RecentReportRow = {
  id: string;
  report_ref: string;
  patient_name: string;
  format: string;
  status: string;
  released_at: string | null;
};

// ---------- helpers ----------

function thirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

function countByField<T extends Record<string, unknown>>(
  rows: T[],
  field: keyof T,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = String(row[field] ?? "unknown");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

// ---------- main fetcher ----------

export async function getAnalyticsData(
  supabase: SupabaseClient,
): Promise<AnalyticsData> {
  const since = thirtyDaysAgo();

  const [
    // KPI row 1
    patientsRes,
    orders30dRes,
    specimens30dRes,
    results30dRes,

    // KPI row 2
    releasedOrdersRes,
    allResults30dStatusRes,
    allSpecimens30dStatusRes,
    reports30dReleasedRes,

    // Order pipeline
    ordersByStatusRes,
    recentOrdersRes,

    // Specimens
    specimens30dAllRes,
    rejectedSpecimensRes,

    // Results
    results30dAllRes,
    resultsWithTestsRes,

    // Staff
    profilesRes,

    // Reports
    reports30dAllRes,
    recentReportsRes,
  ] = await Promise.all([
    // KPI row 1
    supabase.from("patients").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("specimens").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("results").select("id", { count: "exact", head: true }).gte("created_at", since),

    // KPI row 2 — turnaround: released orders in last 30d with timestamps
    supabase.from("orders").select("created_at, updated_at").eq("status", "released").gte("created_at", since),
    // approval rate: results statuses in 30d
    supabase.from("results").select("status").gte("created_at", since),
    // rejection rate: specimen statuses in 30d
    supabase.from("specimens").select("status").gte("created_at", since),
    // reports released 30d
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "released").gte("created_at", since),

    // Order pipeline — all statuses in 30d
    supabase.from("orders").select("status").gte("created_at", since),
    // Recent 10 orders
    supabase.from("orders").select("id, order_ref, priority, status, created_at, patients(full_name), panels(name)").gte("created_at", since).order("created_at", { ascending: false }).limit(10),

    // Specimens — all in 30d for status + type breakdown
    supabase.from("specimens").select("status, type, rejection_reason").gte("created_at", since),
    // Recent rejected specimens
    supabase.from("specimens").select("id, specimen_ref, type, rejection_reason, created_at, orders(patients(full_name))").eq("status", "rejected").order("created_at", { ascending: false }).limit(10),

    // Results — all in 30d for status breakdown
    supabase.from("results").select("status, is_abnormal").gte("created_at", since),
    // Results with test names for abnormal analysis
    supabase.from("results").select("is_abnormal, tests(name)").gte("created_at", since).not("test_id", "is", null),

    // Staff profiles
    supabase.from("profiles").select("id, full_name, role, last_seen_at").neq("role", "patient").eq("status", "active"),

    // Reports — all in 30d
    supabase.from("reports").select("status, format").gte("created_at", since),
    // Recent reports
    supabase.from("reports").select("id, report_ref, format, status, released_at, patients(full_name)").order("created_at", { ascending: false }).limit(15),
  ]);

  // --- KPI row 1 ---
  const totalPatients = patientsRes.count ?? 0;
  const totalOrders30d = orders30dRes.count ?? 0;
  const totalSpecimens30d = specimens30dRes.count ?? 0;
  const totalResults30d = results30dRes.count ?? 0;

  // --- KPI row 2 ---
  // Avg turnaround
  const releasedOrders = releasedOrdersRes.data ?? [];
  let avgTurnaroundMinutes = 0;
  if (releasedOrders.length > 0) {
    const totalMs = releasedOrders.reduce((sum: number, o: { created_at: string; updated_at: string }) => {
      return sum + (new Date(o.updated_at).getTime() - new Date(o.created_at).getTime());
    }, 0);
    avgTurnaroundMinutes = totalMs / releasedOrders.length / 60000;
  }

  // Approval rate
  const resultStatuses = (allResults30dStatusRes.data ?? []) as { status: string }[];
  const approvedOrReleased = resultStatuses.filter((r) => r.status === "approved" || r.status === "released").length;
  const approvalRate = resultStatuses.length > 0 ? (approvedOrReleased / resultStatuses.length) * 100 : 0;

  // Rejection rate
  const specimenStatuses = (allSpecimens30dStatusRes.data ?? []) as { status: string }[];
  const rejectedCount = specimenStatuses.filter((s) => s.status === "rejected").length;
  const rejectionRate = specimenStatuses.length > 0 ? (rejectedCount / specimenStatuses.length) * 100 : 0;

  const reportsReleased30d = reports30dReleasedRes.count ?? 0;

  // --- Order pipeline ---
  const orderStatuses = (ordersByStatusRes.data ?? []) as { status: string }[];
  const orderPipeline: Record<string, number> = { draft: 0, collected: 0, in_process: 0, review: 0, released: 0 };
  for (const o of orderStatuses) {
    orderPipeline[o.status] = (orderPipeline[o.status] ?? 0) + 1;
  }

  const recentOrders: RecentOrderRow[] = (recentOrdersRes.data ?? []).map((o: Record<string, unknown>) => {
    const patient = o.patients as { full_name: string } | null;
    const panel = o.panels as { name: string } | null;
    return {
      id: o.id as string,
      order_ref: o.order_ref as string,
      patient_name: patient?.full_name ?? "\u2014",
      panel_name: panel?.name ?? "\u2014",
      priority: o.priority as string,
      status: o.status as string,
      created_at: o.created_at as string,
    };
  });

  // --- Specimen analytics ---
  const specimensAll = (specimens30dAllRes.data ?? []) as { status: string; type: string; rejection_reason: string | null }[];
  const specimenStatusCounts = countByField(specimensAll, "status");
  const specimenTypeCounts = countByField(specimensAll, "type");

  // Rejection reasons
  const reasonMap: Record<string, number> = {};
  for (const s of specimensAll) {
    if (s.status === "rejected" && s.rejection_reason) {
      reasonMap[s.rejection_reason] = (reasonMap[s.rejection_reason] ?? 0) + 1;
    }
  }
  const rejectionReasons = Object.entries(reasonMap)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const recentRejectedSpecimens: RejectedSpecimenRow[] = (rejectedSpecimensRes.data ?? []).map((s: Record<string, unknown>) => {
    const orders = s.orders as { patients: { full_name: string } | null } | null;
    return {
      id: s.id as string,
      specimen_ref: s.specimen_ref as string,
      patient_name: orders?.patients?.full_name ?? "\u2014",
      type: s.type as string,
      rejection_reason: (s.rejection_reason as string) ?? "\u2014",
      created_at: s.created_at as string,
    };
  });

  // --- Result metrics ---
  const resultsAll = (results30dAllRes.data ?? []) as { status: string; is_abnormal: boolean | null }[];
  const resultStatusCounts: Record<string, number> = { draft: 0, review: 0, approved: 0, released: 0, returned: 0 };
  for (const r of resultsAll) {
    resultStatusCounts[r.status] = (resultStatusCounts[r.status] ?? 0) + 1;
  }

  const abnormalCount = resultsAll.filter((r) => r.is_abnormal === true).length;
  const abnormalRate = resultsAll.length > 0 ? (abnormalCount / resultsAll.length) * 100 : 0;

  // Top abnormal tests
  const testAbnormalMap: Record<string, { total: number; abnormal: number }> = {};
  for (const r of (resultsWithTestsRes.data ?? []) as unknown as { is_abnormal: boolean | null; tests: { name: string } | null }[]) {
    const name = r.tests?.name ?? "Unknown";
    if (!testAbnormalMap[name]) testAbnormalMap[name] = { total: 0, abnormal: 0 };
    testAbnormalMap[name].total++;
    if (r.is_abnormal === true) testAbnormalMap[name].abnormal++;
  }
  const topAbnormalTests: AbnormalTestRow[] = Object.entries(testAbnormalMap)
    .map(([test_name, { total, abnormal }]) => ({
      test_name,
      total,
      abnormal_count: abnormal,
      abnormal_pct: total > 0 ? (abnormal / total) * 100 : 0,
    }))
    .filter((t) => t.abnormal_count > 0)
    .sort((a, b) => b.abnormal_pct - a.abnormal_pct)
    .slice(0, 10);

  // --- Staff activity ---
  // We need per-staff counts. For simplicity, fetch order creators, specimen processors, result reviewers
  // This is done client-side from the profiles list. In production you'd use aggregates.
  const profiles = (profilesRes.data ?? []) as { id: string; full_name: string | null; role: string; last_seen_at: string | null }[];

  // Fetch per-staff review counts
  const staffActivity: StaffActivityRow[] = await Promise.all(
    profiles.map(async (p) => {
      const reviewedRes = await supabase
        .from("results")
        .select("id", { count: "exact", head: true })
        .eq("reviewer_id", p.id);

      return {
        id: p.id,
        full_name: p.full_name ?? "Unknown",
        role: p.role,
        orders_created: 0,
        specimens_processed: 0,
        results_reviewed: reviewedRes.count ?? 0,
        last_seen_at: p.last_seen_at,
      };
    }),
  );

  // --- Report output ---
  const reportsAll = (reports30dAllRes.data ?? []) as { status: string; format: string }[];
  const reportStatusCounts: Record<string, number> = { queued: 0, formatting: 0, release_ready: 0, released: 0 };
  for (const r of reportsAll) {
    reportStatusCounts[r.status] = (reportStatusCounts[r.status] ?? 0) + 1;
  }
  const reportFormatCounts = countByField(reportsAll, "format");

  const recentReports: RecentReportRow[] = (recentReportsRes.data ?? []).map((r: Record<string, unknown>) => {
    const patient = r.patients as { full_name: string } | null;
    return {
      id: r.id as string,
      report_ref: r.report_ref as string,
      patient_name: patient?.full_name ?? "\u2014",
      format: r.format as string,
      status: r.status as string,
      released_at: r.released_at as string | null,
    };
  });

  return {
    totalPatients,
    totalOrders30d,
    totalSpecimens30d,
    totalResults30d,
    avgTurnaroundMinutes,
    approvalRate,
    rejectionRate,
    reportsReleased30d,
    orderPipeline,
    recentOrders,
    specimenStatusCounts,
    specimenTypeCounts,
    rejectionReasons,
    recentRejectedSpecimens,
    resultStatusCounts,
    abnormalRate,
    topAbnormalTests,
    staffActivity,
    reportStatusCounts,
    reportFormatCounts,
    recentReports,
  };
}
