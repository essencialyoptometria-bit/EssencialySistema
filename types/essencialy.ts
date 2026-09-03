export type Role = 'ADMIN' | 'OPTOMETRISTA' | 'RECEPCAO' | 'AGENDA';
export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  city_id: string | null;
  store_id: string | null;
  active: boolean;
};
export type City = { id: string; name: string };
export type Store = { id: string; city_id: string; name: string };
export type Patient = {
  id: string;
  legacy_id?: string;
  full_name: string;
  phone: string;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  age?: number;
  address?: string;
  city_name?: string;
  notes?: string;
  triage?: Record<string, unknown>;
  created_store_id?: string;
};
export type Schedule = {
  id: string;
  city_id: string;
  store_id: string;
  professional_name: string;
  professional_id?: string | null;
  schedule_date: string;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  cities?: City;
  optical_stores?: Store;
};
export type TriageRecord = {
  id: string;
  patient_id: string;
  appointment_id?: string | null;
  recorded_at: string;
  data: Record<string, unknown>;
};
export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read_at?: string | null;
  created_at: string;
};
export type Appointment = {
  id: string;
  schedule_id: string;
  patient_id: string;
  starts_at: string;
  has_plan: boolean;
  exam_value: number;
  notes?: string;
  status: 'AGENDADO' | 'CONFIRMADO' | 'CHEGOU' | 'ANAMNESE_EM_ANDAMENTO' | 'AGUARDANDO_ATENDIMENTO' | 'EM_ATENDIMENTO' | 'ATENDIDO' | 'FALTOSO' | 'CANCELADO';
  return_pending: boolean;
  city_id: string;
  store_id: string;
  patients?: Patient;
  cities?: City;
  optical_stores?: Store;
  booker?: { full_name: string };
  confirmed_at?: string;
  confirmed_by?: string;
};
export type Consultation = {
  id: string;
  patient_id: string;
  exam_date: string;
  return_date?: string | null;
  clinical_notes?: string;
  screening?: Record<string, unknown>;
  patients?: Patient;
};
export type Prescription = {
  id: string;
  patient_id: string;
  exam_date: string;
  data: Record<string, unknown>;
  notes?: string;
  patients?: Patient;
  source?: 'CONSULTATION' | 'DIRECT_ENTRY';
  pupillary_distance?: string;
};
export type Contact = {
  id: string; patient_id: string; contacted_at: string; reason: string;
  result: string; notes?: string; scheduled_return_at?: string;
  patients?: Patient; contact_user?: { full_name: string };
};
