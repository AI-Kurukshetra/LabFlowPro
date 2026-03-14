type SeedRangeRule = {
  label: string;
  sex: "any" | "male" | "female" | "other";
  ageMinDays?: number | null;
  ageMaxDays?: number | null;
  methodology?: string | null;
  population?: string | null;
  low?: number | null;
  high?: number | null;
  textRange?: string | null;
  priority?: number;
};

export type ChemistryTestDefinition = {
  number: number;
  name: string;
  unit: string;
  resultType: "numeric" | "text" | "select";
  methodology: string;
  population: string;
  legacyRange: { min: number; max: number };
  rules: SeedRangeRule[];
};

type SeedPatient = {
  date_of_birth: string | null;
  gender: string | null;
};

const YEAR = 365;

function days(years: number): number {
  return years * YEAR;
}

function adultRule(
  label: string,
  low: number,
  high: number,
  methodology: string,
  population: string,
  overrides?: Partial<SeedRangeRule>,
): SeedRangeRule {
  return {
    label,
    sex: "any",
    ageMinDays: days(18),
    methodology,
    population,
    low,
    high,
    priority: 10,
    ...overrides,
  };
}

export const CLINICAL_CHEMISTRY_TESTS: ChemistryTestDefinition[] = [
  {
    number: 1,
    name: "Glucose",
    unit: "mg/dL",
    resultType: "numeric",
    methodology: "Hexokinase",
    population: "Fasting reference cohort",
    legacyRange: { min: 70, max: 100 },
    rules: [
      adultRule("Adult fasting", 70, 99, "Hexokinase", "Fasting reference cohort"),
      {
        label: "Adolescent fasting",
        sex: "any",
        ageMinDays: days(10),
        ageMaxDays: days(17) + 364,
        methodology: "Hexokinase",
        population: "Fasting reference cohort",
        low: 70,
        high: 105,
        priority: 20,
      },
    ],
  },
  {
    number: 2,
    name: "BUN",
    unit: "mg/dL",
    resultType: "numeric",
    methodology: "Urease UV",
    population: "General clinical",
    legacyRange: { min: 7, max: 20 },
    rules: [adultRule("Adult baseline", 7, 20, "Urease UV", "General clinical")],
  },
  {
    number: 3,
    name: "Creatinine",
    unit: "mg/dL",
    resultType: "numeric",
    methodology: "Enzymatic",
    population: "Adult outpatient cohort",
    legacyRange: { min: 0.6, max: 1.2 },
    rules: [
      {
        label: "Pediatric baseline",
        sex: "any",
        ageMinDays: 0,
        ageMaxDays: days(17) + 364,
        methodology: "Enzymatic",
        population: "Adult outpatient cohort",
        low: 0.4,
        high: 0.9,
        priority: 40,
      },
      {
        label: "Adult female",
        sex: "female",
        ageMinDays: days(18),
        methodology: "Enzymatic",
        population: "Adult outpatient cohort",
        low: 0.55,
        high: 1.05,
        priority: 30,
      },
      {
        label: "Adult male",
        sex: "male",
        ageMinDays: days(18),
        methodology: "Enzymatic",
        population: "Adult outpatient cohort",
        low: 0.74,
        high: 1.27,
        priority: 30,
      },
    ],
  },
  {
    number: 4,
    name: "Sodium",
    unit: "mEq/L",
    resultType: "numeric",
    methodology: "Ion selective electrode",
    population: "General clinical",
    legacyRange: { min: 136, max: 145 },
    rules: [adultRule("Adult baseline", 136, 145, "Ion selective electrode", "General clinical")],
  },
  {
    number: 5,
    name: "Potassium",
    unit: "mEq/L",
    resultType: "numeric",
    methodology: "Ion selective electrode",
    population: "General clinical",
    legacyRange: { min: 3.5, max: 5.0 },
    rules: [adultRule("Adult baseline", 3.5, 5.0, "Ion selective electrode", "General clinical")],
  },
  {
    number: 6,
    name: "Chloride",
    unit: "mEq/L",
    resultType: "numeric",
    methodology: "Ion selective electrode",
    population: "General clinical",
    legacyRange: { min: 98, max: 106 },
    rules: [adultRule("Adult baseline", 98, 106, "Ion selective electrode", "General clinical")],
  },
  {
    number: 7,
    name: "CO2",
    unit: "mEq/L",
    resultType: "numeric",
    methodology: "Enzymatic",
    population: "General clinical",
    legacyRange: { min: 23, max: 29 },
    rules: [adultRule("Adult baseline", 23, 29, "Enzymatic", "General clinical")],
  },
  {
    number: 8,
    name: "Calcium",
    unit: "mg/dL",
    resultType: "numeric",
    methodology: "Photometric chemistry",
    population: "General clinical",
    legacyRange: { min: 8.5, max: 10.5 },
    rules: [adultRule("Adult baseline", 8.5, 10.5, "Photometric chemistry", "General clinical")],
  },
  {
    number: 9,
    name: "Total Protein",
    unit: "g/dL",
    resultType: "numeric",
    methodology: "Biuret",
    population: "General clinical",
    legacyRange: { min: 6.0, max: 8.3 },
    rules: [adultRule("Adult baseline", 6.0, 8.3, "Biuret", "General clinical")],
  },
  {
    number: 10,
    name: "Albumin",
    unit: "g/dL",
    resultType: "numeric",
    methodology: "Bromocresol green",
    population: "General clinical",
    legacyRange: { min: 3.5, max: 5.5 },
    rules: [adultRule("Adult baseline", 3.5, 5.5, "Bromocresol green", "General clinical")],
  },
  {
    number: 11,
    name: "Bilirubin Total",
    unit: "mg/dL",
    resultType: "numeric",
    methodology: "Diazo",
    population: "General clinical",
    legacyRange: { min: 0.1, max: 1.2 },
    rules: [
      adultRule("Adult baseline", 0.2, 1.2, "Diazo", "General clinical"),
      {
        label: "Pediatric baseline",
        sex: "any",
        ageMinDays: 0,
        ageMaxDays: days(17) + 364,
        methodology: "Diazo",
        population: "General clinical",
        low: 0.1,
        high: 1.0,
        priority: 20,
      },
    ],
  },
  {
    number: 12,
    name: "ALP",
    unit: "U/L",
    resultType: "numeric",
    methodology: "Kinetic spectrophotometry",
    population: "General clinical",
    legacyRange: { min: 44, max: 147 },
    rules: [
      adultRule("Adult baseline", 44, 147, "Kinetic spectrophotometry", "General clinical"),
      {
        label: "Adolescent growth phase",
        sex: "any",
        ageMinDays: days(10),
        ageMaxDays: days(17) + 364,
        methodology: "Kinetic spectrophotometry",
        population: "General clinical",
        low: 90,
        high: 320,
        priority: 20,
      },
    ],
  },
  {
    number: 13,
    name: "AST",
    unit: "U/L",
    resultType: "numeric",
    methodology: "Kinetic spectrophotometry",
    population: "General clinical",
    legacyRange: { min: 10, max: 40 },
    rules: [adultRule("Adult baseline", 10, 40, "Kinetic spectrophotometry", "General clinical")],
  },
  {
    number: 14,
    name: "ALT",
    unit: "U/L",
    resultType: "numeric",
    methodology: "Kinetic spectrophotometry",
    population: "General clinical",
    legacyRange: { min: 7, max: 56 },
    rules: [adultRule("Adult baseline", 7, 56, "Kinetic spectrophotometry", "General clinical")],
  },
  {
    number: 15,
    name: "Total Cholesterol",
    unit: "mg/dL",
    resultType: "numeric",
    methodology: "Enzymatic colorimetry",
    population: "Fasting lipid reference set",
    legacyRange: { min: 0, max: 200 },
    rules: [
      adultRule("Adult fasting", 0, 200, "Enzymatic colorimetry", "Fasting lipid reference set"),
      {
        label: "Adolescent fasting",
        sex: "any",
        ageMinDays: days(10),
        ageMaxDays: days(17) + 364,
        methodology: "Enzymatic colorimetry",
        population: "Fasting lipid reference set",
        low: 0,
        high: 170,
        priority: 20,
      },
    ],
  },
  {
    number: 16,
    name: "Triglycerides",
    unit: "mg/dL",
    resultType: "numeric",
    methodology: "Enzymatic colorimetry",
    population: "Fasting lipid reference set",
    legacyRange: { min: 0, max: 150 },
    rules: [
      adultRule("Adult fasting", 0, 150, "Enzymatic colorimetry", "Fasting lipid reference set"),
      {
        label: "Adolescent fasting",
        sex: "any",
        ageMinDays: days(10),
        ageMaxDays: days(17) + 364,
        methodology: "Enzymatic colorimetry",
        population: "Fasting lipid reference set",
        low: 0,
        high: 130,
        priority: 20,
      },
    ],
  },
  {
    number: 17,
    name: "HDL Cholesterol",
    unit: "mg/dL",
    resultType: "numeric",
    methodology: "Enzymatic colorimetry",
    population: "Fasting lipid reference set",
    legacyRange: { min: 40, max: 60 },
    rules: [
      {
        label: "Adult male",
        sex: "male",
        ageMinDays: days(18),
        methodology: "Enzymatic colorimetry",
        population: "Fasting lipid reference set",
        low: 40,
        high: 80,
        priority: 30,
      },
      {
        label: "Adult female",
        sex: "female",
        ageMinDays: days(18),
        methodology: "Enzymatic colorimetry",
        population: "Fasting lipid reference set",
        low: 50,
        high: 90,
        priority: 30,
      },
      {
        label: "Adolescent baseline",
        sex: "any",
        ageMinDays: days(10),
        ageMaxDays: days(17) + 364,
        methodology: "Enzymatic colorimetry",
        population: "Fasting lipid reference set",
        low: 45,
        high: 90,
        priority: 20,
      },
    ],
  },
  {
    number: 18,
    name: "LDL Cholesterol",
    unit: "mg/dL",
    resultType: "numeric",
    methodology: "Enzymatic colorimetry",
    population: "Fasting lipid reference set",
    legacyRange: { min: 0, max: 100 },
    rules: [adultRule("Adult fasting", 0, 100, "Enzymatic colorimetry", "Fasting lipid reference set")],
  },
  {
    number: 19,
    name: "GGT",
    unit: "U/L",
    resultType: "numeric",
    methodology: "Kinetic spectrophotometry",
    population: "General clinical",
    legacyRange: { min: 9, max: 48 },
    rules: [adultRule("Adult baseline", 9, 48, "Kinetic spectrophotometry", "General clinical")],
  },
  {
    number: 20,
    name: "Uric Acid",
    unit: "mg/dL",
    resultType: "numeric",
    methodology: "Photometric chemistry",
    population: "Adult outpatient cohort",
    legacyRange: { min: 3.0, max: 7.0 },
    rules: [
      {
        label: "Adult female",
        sex: "female",
        ageMinDays: days(18),
        methodology: "Photometric chemistry",
        population: "Adult outpatient cohort",
        low: 2.6,
        high: 6.0,
        priority: 30,
      },
      {
        label: "Adult male",
        sex: "male",
        ageMinDays: days(18),
        methodology: "Photometric chemistry",
        population: "Adult outpatient cohort",
        low: 3.5,
        high: 7.2,
        priority: 30,
      },
    ],
  },
  {
    number: 21,
    name: "Phosphorus",
    unit: "mg/dL",
    resultType: "numeric",
    methodology: "Photometric chemistry",
    population: "General clinical",
    legacyRange: { min: 2.5, max: 4.5 },
    rules: [
      adultRule("Adult baseline", 2.5, 4.5, "Photometric chemistry", "General clinical"),
      {
        label: "Adolescent baseline",
        sex: "any",
        ageMinDays: days(10),
        ageMaxDays: days(17) + 364,
        methodology: "Photometric chemistry",
        population: "General clinical",
        low: 4.0,
        high: 5.8,
        priority: 20,
      },
    ],
  },
  {
    number: 22,
    name: "Magnesium",
    unit: "mg/dL",
    resultType: "numeric",
    methodology: "Photometric chemistry",
    population: "General clinical",
    legacyRange: { min: 1.7, max: 2.2 },
    rules: [adultRule("Adult baseline", 1.7, 2.2, "Photometric chemistry", "General clinical")],
  },
  {
    number: 23,
    name: "Iron",
    unit: "mcg/dL",
    resultType: "numeric",
    methodology: "Colorimetric",
    population: "General clinical",
    legacyRange: { min: 60, max: 170 },
    rules: [adultRule("Adult baseline", 60, 170, "Colorimetric", "General clinical")],
  },
  {
    number: 24,
    name: "TIBC",
    unit: "mcg/dL",
    resultType: "numeric",
    methodology: "Colorimetric",
    population: "General clinical",
    legacyRange: { min: 250, max: 370 },
    rules: [adultRule("Adult baseline", 250, 370, "Colorimetric", "General clinical")],
  },
  {
    number: 25,
    name: "LDH",
    unit: "U/L",
    resultType: "numeric",
    methodology: "Kinetic spectrophotometry",
    population: "General clinical",
    legacyRange: { min: 140, max: 280 },
    rules: [adultRule("Adult baseline", 140, 280, "Kinetic spectrophotometry", "General clinical")],
  },
  {
    number: 26,
    name: "Amylase",
    unit: "U/L",
    resultType: "numeric",
    methodology: "Enzymatic",
    population: "General clinical",
    legacyRange: { min: 28, max: 100 },
    rules: [adultRule("Adult baseline", 28, 100, "Enzymatic", "General clinical")],
  },
];

function normalizeSex(value: string | null | undefined): SeedRangeRule["sex"] | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (["male", "m", "man"].includes(normalized)) return "male";
  if (["female", "f", "woman"].includes(normalized)) return "female";
  return "other";
}

function getAgeInDays(dateOfBirth: string | null | undefined, effectiveAt?: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const when = effectiveAt ? new Date(effectiveAt) : new Date();
  if (Number.isNaN(when.getTime())) return null;
  const diff = when.getTime() - dob.getTime();
  if (diff < 0) return null;
  return Math.floor(diff / 86400000);
}

export function buildSeedTests(
  organizationId: string,
  makeTestId: (n: number) => string,
) {
  return CLINICAL_CHEMISTRY_TESTS.map((definition) => ({
    id: makeTestId(definition.number),
    organization_id: organizationId,
    name: definition.name,
    unit: definition.unit,
    result_type: definition.resultType,
    methodology: definition.methodology,
    population: definition.population,
    reference_range: definition.legacyRange,
  }));
}

export function buildSeedReferenceRangeRows(
  organizationId: string,
  makeTestId: (n: number) => string,
  makeRuleId: (n: number) => string,
) {
  return CLINICAL_CHEMISTRY_TESTS.flatMap((definition) =>
    definition.rules.map((rule, index) => ({
      id: makeRuleId(definition.number * 10 + index + 1),
      organization_id: organizationId,
      test_id: makeTestId(definition.number),
      label: rule.label,
      sex: rule.sex,
      age_min_days: rule.ageMinDays ?? null,
      age_max_days: rule.ageMaxDays ?? null,
      methodology: rule.methodology ?? definition.methodology,
      population: rule.population ?? definition.population,
      low: rule.low ?? null,
      high: rule.high ?? null,
      text_range: rule.textRange ?? null,
      priority: rule.priority ?? 0,
      is_active: true,
    })),
  );
}

export function findDefinitionByName(name: string) {
  return CLINICAL_CHEMISTRY_TESTS.find((definition) => definition.name === name) ?? null;
}

export function resolveSeedRule(
  definition: ChemistryTestDefinition,
  patient: SeedPatient,
  effectiveAt?: string | null,
) {
  const patientSex = normalizeSex(patient.gender);
  const ageInDays = getAgeInDays(patient.date_of_birth, effectiveAt);

  let bestRule: SeedRangeRule | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const rule of definition.rules) {
    if (rule.sex !== "any" && rule.sex !== patientSex) continue;
    if (ageInDays === null) {
      if (rule.ageMinDays != null || rule.ageMaxDays != null) continue;
    } else {
      if (rule.ageMinDays != null && ageInDays < rule.ageMinDays) continue;
      if (rule.ageMaxDays != null && ageInDays > rule.ageMaxDays) continue;
    }

    let score = rule.priority ?? 0;
    if (rule.sex !== "any") score += 100;
    if (rule.ageMinDays != null || rule.ageMaxDays != null) score += 40;

    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  return bestRule;
}

export function isSeedValueAbnormal(
  value: string,
  rule: Pick<SeedRangeRule, "low" | "high"> | null | undefined,
) {
  const numericValue = Number.parseFloat(value);
  if (Number.isNaN(numericValue)) return false;
  if (rule?.low !== undefined && rule?.low !== null && numericValue < rule.low) return true;
  if (rule?.high !== undefined && rule?.high !== null && numericValue > rule.high) return true;
  return false;
}
