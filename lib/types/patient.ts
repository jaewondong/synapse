import type { ConfidenceLevel } from './agent'

export type AppointmentStatus = 'checked-in' | 'scheduled' | 'no-show-risk' | 'completed' | 'cancelled'

export type VisitType =
  | 'Follow-up: epilepsy'
  | 'New consult: movement disorder'
  | 'Post-op f/u: DBS'
  | 'Infusion: Tysabri'
  | 'Telehealth f/u: migraine'
  | 'Follow-up: MS'

export interface Patient {
  id: string
  name: string
  mrn: string
  age: number
  sex: 'M' | 'F'
  initials: string
}

export interface Appointment {
  id: string
  time: string
  patient: Patient
  visitType: VisitType
  status: AppointmentStatus
  hasAgentPreppedChart: boolean
  noShowRiskLevel?: ConfidenceLevel
}

export interface RecentPatient extends Patient {
  lastOpened: string
}
