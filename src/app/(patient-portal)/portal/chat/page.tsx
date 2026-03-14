import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPatientProfile, getPatientResults } from "@/lib/queries/portal";
import { getReferenceRangeRulesForTests } from "@/lib/queries/reference-ranges";
import {
  buildResolvedReferenceRangeMap,
  formatResolvedReferenceRange,
  isValueAbnormal,
} from "@/lib/reference-ranges";
import { ChatContainer } from "@/components/portal/chat/chat-container";
import type { Test } from "@/lib/types/database";

type ChatPageProps = {
  searchParams: Promise<{ prompt?: string }>;
};

export default async function PortalChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const profile = await getPatientProfile(supabase);
  const patient = profile.patients!;

  let resultContext: {
    testName: string;
    value: string;
    unit: string;
    referenceRange: string;
    isAbnormal: boolean;
  }[] = [];

  try {
    const orders = await getPatientResults(supabase, patient.id);
    const uniqueTests = Array.from(
      new Map(
        orders
          .flatMap((order) => order.results)
          .map((result) => result.tests)
          .filter((test): test is Test => test !== null)
          .map((test) => [test.id, test]),
      ).values(),
    );
    const rules = await getReferenceRangeRulesForTests(
      supabase,
      uniqueTests.map((test) => test.id),
    );

    resultContext = orders.flatMap((order) =>
      {
        const orderTests = Array.from(
          new Map(
            order.results
              .map((result) => result.tests)
              .filter((test): test is Test => test !== null)
              .map((test) => [test.id, test]),
          ).values(),
        );
        const resolvedReferenceRanges = buildResolvedReferenceRangeMap(
          orderTests,
          patient,
          rules,
          order.collection_date ?? order.created_at,
        );

        return order.results
          .filter((r) => r.status === "released")
          .map((r) => {
            const test = r.tests as Test | null;
            const unit = test?.unit ?? r.unit ?? "";
            const range = r.test_id ? resolvedReferenceRanges[r.test_id] : null;

            return {
              testName: test?.name ?? "Unknown test",
              value: r.value ?? "",
              unit,
              referenceRange: formatResolvedReferenceRange(range, unit, {
                includeUnit: true,
              }),
              isAbnormal: r.value
                ? isValueAbnormal(r.value, range)
                : r.is_abnormal === true,
            };
          });
      }
    );
  } catch {
    // Context will be empty if query fails
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col sm:h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          AI assistant
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">AI Health Assistant</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ask questions about your lab results. For medical advice, always
          consult your healthcare provider.
        </p>
      </div>
      <ChatContainer
        patientContext={{
          patientName: patient.full_name,
          results: resultContext,
        }}
        initialMessage={params.prompt}
      />
    </div>
  );
}
