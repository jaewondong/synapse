export interface Patient {
  id: string;
  name: string;
  dob: string;
  mrn: string;
  insurance: string;
  insuranceStatus: 'Active' | 'Pending' | 'Inactive';
  visitReason: string;
}

export type InboxCategory =
  | 'eligibility'
  | 'message'
  | 'prior-auth'
  | 'document'
  | 'coding'
  | 'scheduling'
  | 'no-show';

export type InboxStatus = 'pending' | 'approved' | 'rejected';

export type Priority = 'high' | 'medium' | 'low';

export interface InboxItem {
  id: string;
  type: string;
  category: InboxCategory;
  patientId: string;
  patientName: string;
  title: string;
  summary: string;
  agentName: string;
  confidence: number;
  status: InboxStatus;
  priority: Priority;
  createdAt: string;
  slaMinutes: number;
  reasoning: string;
  sources: string[];
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked-in'
  | 'in-room'
  | 'complete'
  | 'no-show'
  | 'cancelled';

export type NoShowRisk = 'low' | 'medium' | 'high';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  time: string;
  duration: number;
  visitType: string;
  provider: string;
  status: AppointmentStatus;
  noShowRisk: NoShowRisk;
  room?: string;
}

export interface AgentActivity {
  id: string;
  agentName: string;
  action: string;
  patientName: string;
  timestamp: string;
  outcome: 'success' | 'pending' | 'escalated';
}

export interface AutoCompletedItem {
  id: string;
  agentName: string;
  description: string;
  patientName: string;
  timestamp: string;
  category: InboxCategory;
}
