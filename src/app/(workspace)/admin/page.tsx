import { redirect } from "next/navigation";
import { Users, FlaskConical, LayoutGrid, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/workspace/status-badge";
import { MetricCard } from "@/components/workspace/metric-card";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { hasPermission } from "@/lib/rbac/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCatalogContext(methodology: string | null, population: string | null): string {
  return [methodology, population].filter(Boolean).join(" • ") || "\u2014";
}

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard");
  }

  const supabase = await createServerSupabaseClient();

  let profile;
  try {
    profile = await getCurrentProfile(supabase);
    if (!hasPermission(profile.role as UserRole, "admin:access")) {
      redirect("/dashboard");
    }
  } catch {
    redirect("/dashboard");
  }

  const orgId = profile.organization_id;

  const [profilesResult, testsResult, panelsResult, rulesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", orgId!)
      .order("created_at", { ascending: false }),
    supabase
      .from("tests")
      .select("*")
      .eq("organization_id", orgId!)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("panels")
      .select("*, panel_tests(test_id)")
      .eq("organization_id", orgId!)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("test_reference_ranges")
      .select("id, test_id")
      .eq("organization_id", orgId!)
      .eq("is_active", true),
  ]);

  const profiles = profilesResult.data ?? [];
  const tests = testsResult.data ?? [];
  const panels = panelsResult.data ?? [];
  const referenceRules = rulesResult.data ?? [];
  const ruleCountByTest = referenceRules.reduce<Record<string, number>>((acc, rule) => {
    acc[rule.test_id] = (acc[rule.test_id] ?? 0) + 1;
    return acc;
  }, {});

  // Compute role distribution
  const roleCounts: Record<string, number> = {};
  const activeUsers = profiles.filter((p) => p.status === "active");
  for (const p of profiles) {
    roleCounts[p.role] = (roleCounts[p.role] ?? 0) + 1;
  }

  const roleDistribution = Object.entries(roleCounts)
    .map(([role, count]) => `${count} ${role}`)
    .join(", ");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Administration
        </h1>
        <p className="text-sm text-slate-600">
          Manage users, tests, and panels for your organization.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          metric={{
            label: "Active Users",
            value: String(activeUsers.length),
            helper: `${profiles.length} total users`,
          }}
          icon={Users}
        />
        <MetricCard
          metric={{
            label: "Role Distribution",
            value: String(Object.keys(roleCounts).length),
            helper: roleDistribution || "No roles",
          }}
          icon={ShieldCheck}
        />
        <MetricCard
          metric={{
            label: "Active Tests",
            value: String(tests.length),
            helper: `${referenceRules.length} active reference rules`,
          }}
          icon={FlaskConical}
        />
        <MetricCard
          metric={{
            label: "Active Panels",
            value: String(panels.length),
            helper: "Test panels configured",
          }}
          icon={LayoutGrid}
        />
      </div>

      <Card className="border border-slate-200/80 bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-slate-900">
                      {p.full_name ?? "\u2014"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.role} />
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {p.scope ?? "\u2014"}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {formatDate(p.last_seen_at)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/80 bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Test Catalog</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>Test Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Result Type</TableHead>
                <TableHead>Catalog Context</TableHead>
                <TableHead>Rules</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                    No tests found.
                  </TableCell>
                </TableRow>
              ) : (
                tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium text-slate-900">
                      {test.name}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {test.unit ?? "\u2014"}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {test.result_type
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {formatCatalogContext(test.methodology, test.population)}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {ruleCountByTest[test.id] ?? 0}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/80 bg-white overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Panels</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>Panel Name</TableHead>
                <TableHead>Tests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {panels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="py-8 text-center text-slate-500">
                    No panels found.
                  </TableCell>
                </TableRow>
              ) : (
                panels.map((panel) => {
                  const testCount = Array.isArray(panel.panel_tests)
                    ? panel.panel_tests.length
                    : 0;
                  return (
                    <TableRow key={panel.id}>
                      <TableCell className="font-medium text-slate-900">
                        {panel.name}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {testCount} {testCount === 1 ? "test" : "tests"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
