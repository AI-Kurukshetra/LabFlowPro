import type { SupabaseClient } from "@supabase/supabase-js";

import { buildResolvedReferenceRangeMap } from "@/lib/reference-ranges";
import type {
  Patient,
  Test,
  TestReferenceRange,
} from "@/lib/types/database";

export async function getReferenceRangeRulesForTests(
  supabase: SupabaseClient,
  testIds: string[],
): Promise<TestReferenceRange[]> {
  const uniqueTestIds = Array.from(new Set(testIds.filter(Boolean)));

  if (uniqueTestIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("test_reference_ranges")
    .select("*")
    .in("test_id", uniqueTestIds)
    .eq("is_active", true);

  if (error) throw error;
  return (data ?? []) as TestReferenceRange[];
}

export async function resolveReferenceRangesForTests(
  supabase: SupabaseClient,
  tests: Test[],
  patient: Patient | null | undefined,
  effectiveAt?: string | Date | null,
) {
  const rules = await getReferenceRangeRulesForTests(
    supabase,
    tests.map((test) => test.id),
  );

  return buildResolvedReferenceRangeMap(tests, patient, rules, effectiveAt);
}
