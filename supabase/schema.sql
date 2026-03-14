-- LabFlow Pro: Schema for Supabase
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- =============================================================================
-- 1. ORGANIZATIONS (tenants)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. PROFILES (extends auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name        text,
  role             text NOT NULL DEFAULT 'technician'
                   CHECK (role IN ('admin','intake','technician','reviewer')),
  scope            text,
  last_seen_at     timestamptz,
  status           text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','invited','deactivated')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 3. TESTS & PANELS (catalog)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name             text NOT NULL,
  unit             text,
  result_type      text NOT NULL DEFAULT 'numeric'
                   CHECK (result_type IN ('numeric','text','select')),
  reference_range  jsonb,
  methodology      text,
  population       text,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.panels (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name             text NOT NULL,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.panel_tests (
  panel_id  uuid REFERENCES public.panels(id) ON DELETE CASCADE,
  test_id   uuid REFERENCES public.tests(id) ON DELETE CASCADE,
  PRIMARY KEY (panel_id, test_id)
);

-- =============================================================================
-- 4. PATIENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_ref      text NOT NULL,
  full_name        text NOT NULL,
  date_of_birth    date,
  gender           text,
  phone            text,
  email            text,
  external_ref     text,
  status           text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','merged','inactive')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 5. ORDERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_ref        text NOT NULL,
  patient_id       uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  panel_id         uuid REFERENCES public.panels(id) ON DELETE SET NULL,
  priority         text NOT NULL DEFAULT 'routine'
                   CHECK (priority IN ('routine','urgent','stat')),
  status           text NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','collected','in_process','review','released')),
  collection_date  timestamptz,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 6. SPECIMENS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.specimens (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  specimen_ref     text NOT NULL,
  order_id         uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  type             text NOT NULL
                   CHECK (type IN ('serum','plasma','whole_blood','urine','csf','other')),
  collector        text,
  barcode          text,
  collected_at     timestamptz,
  status           text NOT NULL DEFAULT 'received'
                   CHECK (status IN ('received','processing','completed','rejected')),
  rejection_reason text,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 7. RESULTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.results (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id         uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  test_id          uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  value            text,
  unit             text,
  is_abnormal      boolean DEFAULT false,
  status           text NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','review','approved','released','returned')),
  reviewer_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at      timestamptz,
  approved_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 8. REPORTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_ref       text NOT NULL,
  order_id         uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  patient_id       uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  format           text NOT NULL DEFAULT 'pdf'
                   CHECK (format IN ('pdf','pdf_csv','pdf_json')),
  released_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  released_at      timestamptz,
  version          int NOT NULL DEFAULT 1,
  status           text NOT NULL DEFAULT 'queued'
                   CHECK (status IN ('queued','formatting','release_ready','released')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 9. ROW-LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reference_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panels          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panel_tests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specimens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports         ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Organization-scoped read policies (user must belong to the org)
CREATE POLICY "Org members can view their organization"
  ON public.organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can view tests"
  ON public.tests FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can view test reference ranges"
  ON public.test_reference_ranges FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can view panels"
  ON public.panels FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can view panel_tests"
  ON public.panel_tests FOR SELECT
  USING (panel_id IN (
    SELECT id FROM public.panels
    WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  ));

CREATE POLICY "Org members can view patients"
  ON public.patients FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can view orders"
  ON public.orders FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can view specimens"
  ON public.specimens FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can view results"
  ON public.results FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can view reports"
  ON public.reports FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Insert policies for org members
CREATE POLICY "Org members can insert patients"
  ON public.patients FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can insert specimens"
  ON public.specimens FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can insert results"
  ON public.results FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can insert reports"
  ON public.reports FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Update policies
CREATE POLICY "Org members can update patients"
  ON public.patients FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can update orders"
  ON public.orders FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can update specimens"
  ON public.specimens FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can update results"
  ON public.results FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Org members can update reports"
  ON public.reports FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Admin-only: manage catalog
CREATE POLICY "Admins can manage tests"
  ON public.tests FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage test reference ranges"
  ON public.test_reference_ranges FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage panels"
  ON public.panels FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- 10. UPDATED_AT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['organizations','profiles','patients','orders','specimens','results','reports','test_reference_ranges']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;
