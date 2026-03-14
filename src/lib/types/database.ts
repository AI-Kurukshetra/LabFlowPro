export type SpecimenStatus = "received" | "processing" | "completed" | "rejected";

export type OrderStatus = "draft" | "collected" | "in_process" | "review" | "released";

export type ResultStatus = "draft" | "review" | "approved" | "released" | "returned";

export type OrderPriority = "routine" | "urgent" | "stat";

export type SpecimenType = "serum" | "plasma" | "whole_blood" | "urine" | "csf" | "other";

export type ResultType = "numeric" | "text" | "select";

export type UserRole = "admin" | "intake" | "technician" | "reviewer" | "patient";

export type ProfileStatus = "active" | "invited" | "deactivated";

export type PatientStatus = "active" | "merged" | "inactive";

export type ReportFormat = "pdf" | "pdf_csv" | "pdf_json";

export type ReportStatus = "queued" | "formatting" | "release_ready" | "released";

export type Organization = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  organization_id: string | null;
  full_name: string | null;
  role: UserRole;
  scope: string | null;
  last_seen_at: string | null;
  status: ProfileStatus;
  patient_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  profile_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type Test = {
  id: string;
  organization_id: string | null;
  name: string;
  unit: string | null;
  result_type: ResultType;
  reference_range: Record<string, unknown> | null;
  methodology: string | null;
  population: string | null;
  is_active: boolean;
  created_at: string;
};

export type TestReferenceRange = {
  id: string;
  organization_id: string | null;
  test_id: string;
  label: string | null;
  sex: "any" | "male" | "female" | "other";
  age_min_days: number | null;
  age_max_days: number | null;
  methodology: string | null;
  population: string | null;
  low: number | null;
  high: number | null;
  text_range: string | null;
  priority: number;
  is_active: boolean;
  effective_from: string | null;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
};

export type Panel = {
  id: string;
  organization_id: string | null;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type PanelTest = {
  panel_id: string;
  test_id: string;
};

export type Patient = {
  id: string;
  organization_id: string | null;
  patient_ref: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  external_ref: string | null;
  status: PatientStatus;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  organization_id: string | null;
  order_ref: string;
  patient_id: string;
  panel_id: string | null;
  priority: OrderPriority;
  status: OrderStatus;
  collection_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Specimen = {
  id: string;
  organization_id: string | null;
  specimen_ref: string;
  order_id: string;
  type: SpecimenType;
  collector: string | null;
  barcode: string | null;
  collected_at: string | null;
  status: SpecimenStatus;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Result = {
  id: string;
  organization_id: string | null;
  order_id: string;
  test_id: string | null;
  value: string | null;
  unit: string | null;
  is_abnormal: boolean | null;
  status: ResultStatus;
  reviewer_id: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Report = {
  id: string;
  organization_id: string | null;
  report_ref: string;
  order_id: string;
  patient_id: string;
  format: ReportFormat;
  released_by: string | null;
  released_at: string | null;
  version: number;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
};

export type OrderWithRelations = Order & {
  patients: Patient;
  panels: Panel | null;
};

export type SpecimenWithOrder = Specimen & {
  orders: Order & {
    patients: Patient;
  };
};

export type ResultWithTestAndOrder = Result & {
  tests: Test | null;
  orders: Order & {
    patients: Patient;
  };
};

export type PatientWithOrders = Patient & {
  orders: (Order & {
    panels: Panel | null;
  })[];
};

export type ReportWithRelations = Report & {
  orders: Order & {
    patients: Patient;
    panels: Panel | null;
  };
  patients: Patient;
};
