-- Add patient role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin','intake','technician','reviewer','patient'));

-- Add patient_id to profiles for linking patient users to patient records
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL;

-- Update trigger to read role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  matched_patient_id uuid;
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'technician')
  );

  IF (NEW.raw_user_meta_data ->> 'role') = 'patient' THEN
    SELECT id INTO matched_patient_id
    FROM public.patients
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;

    IF matched_patient_id IS NOT NULL THEN
      UPDATE public.profiles SET patient_id = matched_patient_id WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- RLS policies for patient access
CREATE POLICY "Patients can view own orders"
  ON public.orders FOR SELECT
  USING (
    patient_id IN (SELECT p.patient_id FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'patient')
  );

CREATE POLICY "Patients can view own results"
  ON public.results FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      WHERE o.patient_id IN (SELECT p.patient_id FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'patient')
    )
    AND status = 'released'
  );

CREATE POLICY "Patients can view own reports"
  ON public.reports FOR SELECT
  USING (
    patient_id IN (SELECT p.patient_id FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'patient')
    AND status = 'released'
  );

CREATE POLICY "Patients can view own patient record"
  ON public.patients FOR SELECT
  USING (
    id IN (SELECT p.patient_id FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'patient')
  );

CREATE POLICY "Patients can view tests catalog"
  ON public.tests FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patient'));

CREATE POLICY "Patients can view panels"
  ON public.panels FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'patient'));
