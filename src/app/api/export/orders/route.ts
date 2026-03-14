import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOrders } from "@/lib/queries/orders";
import { exportOrdersCSV } from "@/lib/emr/export-csv";
import { exportOrdersJSON } from "@/lib/emr/export-json";
import { hasPermission } from "@/lib/rbac/permissions";
import type { Profile } from "@/lib/types/database";

export async function GET(request: NextRequest) {
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

  if (!profile || !hasPermission((profile as Profile).role, "export:orders")) {
    return NextResponse.json(
      { error: "You don't have permission to export orders." },
      { status: 403 },
    );
  }

  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const status = request.nextUrl.searchParams.get("status") ?? undefined;

  if (!["csv", "json"].includes(format)) {
    return NextResponse.json(
      { error: "Invalid format. Use csv or json." },
      { status: 400 },
    );
  }

  const { data: orders } = await getOrders(supabase, { status });

  if (format === "csv") {
    const csv = exportOrdersCSV(orders);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders-export.csv"`,
      },
    });
  }

  const json = exportOrdersJSON(orders);
  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="orders-export.json"`,
    },
  });
}
