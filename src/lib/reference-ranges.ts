import type { Patient, Test, TestReferenceRange } from "@/lib/types/database";

export type ResolvedReferenceRange = {
  ruleId: string | null;
  source: "rule" | "legacy" | "none";
  label: string | null;
  sex: TestReferenceRange["sex"];
  ageMinDays: number | null;
  ageMaxDays: number | null;
  methodology: string | null;
  population: string | null;
  low: number | null;
  high: number | null;
  textRange: string | null;
  display: string;
};

export type ResolvedReferenceRangeMap = Record<string, ResolvedReferenceRange>;

function normalizeText(value: string | null | undefined): string | null {
  return value?.trim().toLowerCase() || null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatRangeDisplay(
  low: number | null,
  high: number | null,
  textRange: string | null,
): string {
  if (textRange) return textRange;
  if (low !== null && high !== null) return `${low}\u2013${high}`;
  if (low !== null) return `>${low}`;
  if (high !== null) return `<${high}`;
  return "";
}

function formatAgePoint(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365.25);
    return `${years}y`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30.44);
    return `${months}mo`;
  }
  return `${days}d`;
}

function formatAgeBand(minDays: number | null, maxDays: number | null): string | null {
  if (minDays === null && maxDays === null) return null;
  if (minDays === null && maxDays !== null) return `Up to ${formatAgePoint(maxDays)}`;
  if (minDays !== null && maxDays === null) return `${formatAgePoint(minDays)}+`;
  if (minDays !== null && maxDays !== null) return `${formatAgePoint(minDays)}-${formatAgePoint(maxDays)}`;
  return null;
}

export function normalizePatientSex(
  value: string | null | undefined,
): TestReferenceRange["sex"] | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (["male", "m", "man"].includes(normalized)) return "male";
  if (["female", "f", "woman"].includes(normalized)) return "female";
  return "other";
}

export function getAgeInDays(
  dateOfBirth: string | null | undefined,
  effectiveAt?: string | Date | null,
): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const effectiveDate = effectiveAt ? new Date(effectiveAt) : new Date();
  if (Number.isNaN(effectiveDate.getTime())) return null;
  const diff = effectiveDate.getTime() - dob.getTime();
  if (diff < 0) return null;
  return Math.floor(diff / 86400000);
}

export function parseLegacyReferenceRange(
  referenceRange: Record<string, unknown> | null,
): Pick<ResolvedReferenceRange, "low" | "high" | "textRange" | "display"> {
  if (!referenceRange) {
    return { low: null, high: null, textRange: null, display: "" };
  }

  const low = toNumber(referenceRange.low ?? referenceRange.min);
  const high = toNumber(referenceRange.high ?? referenceRange.max);
  const textRange =
    typeof referenceRange.text === "string"
      ? referenceRange.text
      : typeof referenceRange.display === "string"
        ? referenceRange.display
        : null;

  return {
    low,
    high,
    textRange,
    display: formatRangeDisplay(low, high, textRange),
  };
}

function isRuleEffective(
  rule: TestReferenceRange,
  effectiveAt?: string | Date | null,
): boolean {
  if (!effectiveAt) return true;
  const effectiveDate = new Date(effectiveAt);
  if (Number.isNaN(effectiveDate.getTime())) return true;

  if (rule.effective_from) {
    const start = new Date(rule.effective_from);
    if (!Number.isNaN(start.getTime()) && effectiveDate < start) return false;
  }

  if (rule.effective_to) {
    const end = new Date(rule.effective_to);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      if (effectiveDate > end) return false;
    }
  }

  return true;
}

function scoreRule(
  rule: TestReferenceRange,
  patientSex: TestReferenceRange["sex"] | null,
  ageInDays: number | null,
  test: Test,
  effectiveAt?: string | Date | null,
): number {
  if (!rule.is_active || !isRuleEffective(rule, effectiveAt)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (rule.sex !== "any") {
    if (!patientSex || rule.sex !== patientSex) {
      return Number.NEGATIVE_INFINITY;
    }
  }

  if (ageInDays === null) {
    if (rule.age_min_days !== null || rule.age_max_days !== null) {
      return Number.NEGATIVE_INFINITY;
    }
  } else {
    if (rule.age_min_days !== null && ageInDays < rule.age_min_days) {
      return Number.NEGATIVE_INFINITY;
    }
    if (rule.age_max_days !== null && ageInDays > rule.age_max_days) {
      return Number.NEGATIVE_INFINITY;
    }
  }

  const testMethodology = normalizeText(test.methodology);
  const testPopulation = normalizeText(test.population);
  const ruleMethodology = normalizeText(rule.methodology);
  const rulePopulation = normalizeText(rule.population);

  if (ruleMethodology && ruleMethodology !== testMethodology) {
    return Number.NEGATIVE_INFINITY;
  }

  if (rulePopulation && rulePopulation !== testPopulation) {
    return Number.NEGATIVE_INFINITY;
  }

  const ageSpan =
    rule.age_min_days !== null || rule.age_max_days !== null
      ? (rule.age_max_days ?? 365000) - (rule.age_min_days ?? 0)
      : 365000;

  let score = 0;
  score += rule.priority * 1000;
  score += rule.sex === patientSex && patientSex !== null ? 400 : 0;
  score += ruleMethodology ? 200 : 0;
  score += rulePopulation ? 120 : 0;
  score += (rule.age_min_days !== null || rule.age_max_days !== null) ? 80 : 0;
  score += Math.max(0, 365000 - ageSpan);

  return score;
}

function toResolvedRange(
  rule: TestReferenceRange,
  source: ResolvedReferenceRange["source"],
): ResolvedReferenceRange {
  return {
    ruleId: rule.id,
    source,
    label: rule.label,
    sex: rule.sex,
    ageMinDays: rule.age_min_days,
    ageMaxDays: rule.age_max_days,
    methodology: rule.methodology,
    population: rule.population,
    low: rule.low,
    high: rule.high,
    textRange: rule.text_range,
    display: formatRangeDisplay(rule.low, rule.high, rule.text_range),
  };
}

export function resolveReferenceRange(
  test: Test,
  patient: Patient | null | undefined,
  rules: TestReferenceRange[],
  effectiveAt?: string | Date | null,
): ResolvedReferenceRange {
  const patientSex = normalizePatientSex(patient?.gender);
  const ageInDays = getAgeInDays(patient?.date_of_birth, effectiveAt);

  let bestRule: TestReferenceRange | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const rule of rules) {
    if (rule.test_id !== test.id) continue;
    const score = scoreRule(rule, patientSex, ageInDays, test, effectiveAt);
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  if (bestRule) {
    return toResolvedRange(bestRule, "rule");
  }

  const legacy = parseLegacyReferenceRange(test.reference_range);
  if (legacy.display) {
    return {
      ruleId: null,
      source: "legacy",
      label: null,
      sex: "any",
      ageMinDays: null,
      ageMaxDays: null,
      methodology: test.methodology,
      population: test.population,
      low: legacy.low,
      high: legacy.high,
      textRange: legacy.textRange,
      display: legacy.display,
    };
  }

  return {
    ruleId: null,
    source: "none",
    label: null,
    sex: "any",
    ageMinDays: null,
    ageMaxDays: null,
    methodology: test.methodology,
    population: test.population,
    low: null,
    high: null,
    textRange: null,
    display: "",
  };
}

export function buildResolvedReferenceRangeMap(
  tests: Test[],
  patient: Patient | null | undefined,
  rules: TestReferenceRange[],
  effectiveAt?: string | Date | null,
): ResolvedReferenceRangeMap {
  return tests.reduce<ResolvedReferenceRangeMap>((acc, test) => {
    acc[test.id] = resolveReferenceRange(test, patient, rules, effectiveAt);
    return acc;
  }, {});
}

export function formatResolvedReferenceRange(
  range: ResolvedReferenceRange | null | undefined,
  unit?: string | null,
  options?: { includeUnit?: boolean },
): string {
  if (!range?.display) return "";
  if (options?.includeUnit === false || !unit) return range.display;
  return `${range.display} ${unit}`;
}

export function getReferenceRangeContextLabel(
  range: ResolvedReferenceRange | null | undefined,
): string {
  if (!range) return "";
  if (range.label) return range.label;

  const parts: string[] = [];
  if (range.sex !== "any") {
    parts.push(capitalize(range.sex));
  }

  const ageBand = formatAgeBand(range.ageMinDays, range.ageMaxDays);
  if (ageBand) {
    parts.push(ageBand);
  }

  if (range.methodology) {
    parts.push(range.methodology);
  }

  if (range.population) {
    parts.push(range.population);
  }

  return parts.join(" • ");
}

export function isValueAbnormal(
  value: string | null | undefined,
  range: Pick<ResolvedReferenceRange, "low" | "high"> | null | undefined,
): boolean {
  if (!value) return false;
  const numericValue = Number.parseFloat(value);
  if (Number.isNaN(numericValue)) return false;
  if (range?.low !== null && range?.low !== undefined && numericValue < range.low) return true;
  if (range?.high !== null && range?.high !== undefined && numericValue > range.high) return true;
  return false;
}
