// Shared types for the Scheduling Agent email feature.

export type AppointmentRow = {
  id: string;
  patient_id: string;
  provider_id: string;
  scheduled_ma_id: string | null;
  starts_at: string;
  ends_at: string;
  visit_type:
    | "new_patient_eval"
    | "follow_up"
    | "procedure"
    | "infusion"
    | "telehealth"
    | "other";
  status:
    | "scheduled"
    | "confirmed"
    | "checked_in"
    | "in_room"
    | "complete"
    | "no_show"
    | "cancelled";
  room: string | null;
  notes: string | null;
  created_by_agent: string | null;
  agent_reasoning: string | null;
  agent_confidence: number | null;
  reschedule_reason: string | null;
  cancellation_reason: string | null;
  previous_starts_at: string | null;
  previous_ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PatientLite = {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
};

export type ProviderLite = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialty: string | null;
};

export type NotificationKind =
  | "appointment_created"
  | "appointment_rescheduled"
  | "appointment_cancelled";

export type EmailContext = {
  kind: NotificationKind;
  appointment: AppointmentRow;
  patient: PatientLite;
  provider: ProviderLite;
  recipients: string[];
};
