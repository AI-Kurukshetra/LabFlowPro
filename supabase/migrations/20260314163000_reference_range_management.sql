-- =============================================================================
-- Reference range management
-- =============================================================================

ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS methodology text,
  ADD COLUMN IF NOT EXISTS population text;

CREATE TABLE IF NOT EXISTS public.test_reference_ranges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  test_id         uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  label           text,
  sex             text NOT NULL DEFAULT 'any'
                  CHECK (sex IN ('any','male','female','other')),
  age_min_days    integer,
  age_max_days    integer,
  methodology     text,
  population      text,
  low             numeric,
  high            numeric,
  text_range      text,
  priority        integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  effective_from  date,
  effective_to    date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT test_reference_ranges_age_min_check
    CHECK (age_min_days IS NULL OR age_min_days >= 0),
  CONSTRAINT test_reference_ranges_age_max_check
    CHECK (age_max_days IS NULL OR age_max_days >= 0),
  CONSTRAINT test_reference_ranges_age_order_check
    CHECK (
      age_min_days IS NULL
      OR age_max_days IS NULL
      OR age_max_days >= age_min_days
    ),
  CONSTRAINT test_reference_ranges_value_check
    CHECK (low IS NOT NULL OR high IS NOT NULL OR text_range IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_test_reference_ranges_lookup
  ON public.test_reference_ranges (test_id, is_active, sex, methodology, population);

CREATE INDEX IF NOT EXISTS idx_test_reference_ranges_org_test
  ON public.test_reference_ranges (organization_id, test_id);

UPDATE public.tests
SET methodology = COALESCE(
      methodology,
      CASE
        WHEN name = 'Glucose' THEN 'Hexokinase'
        WHEN name = 'BUN' THEN 'Urease UV'
        WHEN name = 'Creatinine' THEN 'Enzymatic'
        WHEN name IN ('Total Cholesterol', 'Triglycerides', 'HDL Cholesterol', 'LDL Cholesterol') THEN 'Enzymatic colorimetry'
        WHEN name IN ('AST', 'ALT', 'ALP', 'GGT', 'LDH', 'Amylase') THEN 'Kinetic spectrophotometry'
        ELSE 'Photometric chemistry'
      END
    ),
    population = COALESCE(
      population,
      CASE
        WHEN name IN ('Total Cholesterol', 'Triglycerides', 'HDL Cholesterol', 'LDL Cholesterol') THEN 'Adult fasting'
        ELSE 'General clinical'
      END
    )
WHERE methodology IS NULL OR population IS NULL;

INSERT INTO public.test_reference_ranges (
  organization_id,
  test_id,
  label,
  sex,
  age_min_days,
  age_max_days,
  methodology,
  population,
  low,
  high,
  text_range
)
SELECT
  t.organization_id,
  t.id,
  'Legacy baseline',
  'any',
  NULL,
  NULL,
  t.methodology,
  t.population,
  COALESCE(
    NULLIF(t.reference_range ->> 'low', '')::numeric,
    NULLIF(t.reference_range ->> 'min', '')::numeric
  ),
  COALESCE(
    NULLIF(t.reference_range ->> 'high', '')::numeric,
    NULLIF(t.reference_range ->> 'max', '')::numeric
  ),
  NULLIF(t.reference_range ->> 'text', '')
FROM public.tests t
WHERE t.reference_range IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.test_reference_ranges existing
    WHERE existing.test_id = t.id
  );

ALTER TABLE public.test_reference_ranges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view test reference ranges" ON public.test_reference_ranges;
CREATE POLICY "Org members can view test reference ranges"
  ON public.test_reference_ranges FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage test reference ranges" ON public.test_reference_ranges;
CREATE POLICY "Admins can manage test reference ranges"
  ON public.test_reference_ranges FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS set_updated_at ON public.test_reference_ranges;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.test_reference_ranges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
