import type { AgentActivityItem, EscalationItem } from '@/lib/types/agent'
import type { Appointment, RecentPatient } from '@/lib/types/patient'
import { allAgentActions } from './agent-actions'

export { allAgentActions }

export const mockEscalations: EscalationItem[] = [
  {
    id: 'esc-1',
    agentName: 'NoShow Agent',
    situation: '2 patients flagged as high no-show risk for tomorrow\'s morning block.',
    patientRef: 'Marcus Bell (MRN 8823741) and Yuki Tanaka (MRN 9912034)',
  },
]

export const mockAgentActions = allAgentActions

export const mockAppointments: Appointment[] = [
  {
    id: 'appt-1',
    time: '8:00',
    patient: { id: 'p1', name: 'Sandra Perez', mrn: '00432303', age: 32, sex: 'M', initials: 'SP' },
    visitType: 'Follow-up: epilepsy',
    status: 'checked-in',
    hasAgentPreppedChart: true,
  },
  {
    id: 'appt-2',
    time: '8:45',
    patient: { id: 'p2', name: 'Carol Rodriguez', mrn: '00430522', age: 36, sex: 'F', initials: 'CR' },
    visitType: 'Infusion: Tysabri',
    status: 'scheduled',
    hasAgentPreppedChart: true,
  },
  {
    id: 'appt-3',
    time: '9:30',
    patient: { id: 'p3', name: 'Robert Hernandez', mrn: '00431892', age: 59, sex: 'M', initials: 'RH' },
    visitType: 'Follow-up: MS',
    status: 'checked-in',
    hasAgentPreppedChart: false,
  },
  {
    id: 'appt-4',
    time: '10:15',
    patient: { id: 'p4', name: 'Daniel Nguyen', mrn: '00432988', age: 31, sex: 'M', initials: 'DN' },
    visitType: 'Post-op f/u: DBS',
    status: 'no-show-risk',
    hasAgentPreppedChart: true,
    noShowRiskLevel: 'high',
  },
  {
    id: 'appt-5',
    time: '11:00',
    patient: { id: 'p5', name: 'Nancy Singh', mrn: '00433536', age: 52, sex: 'F', initials: 'NS' },
    visitType: 'Telehealth f/u: migraine',
    status: 'no-show-risk',
    hasAgentPreppedChart: false,
    noShowRiskLevel: 'medium',
  },
  {
    id: 'appt-6',
    time: '12:30',
    patient: { id: 'p6', name: 'Diego Davis', mrn: '00429700', age: 77, sex: 'M', initials: 'DD' },
    visitType: 'Follow-up: epilepsy',
    status: 'scheduled',
    hasAgentPreppedChart: true,
  },
  {
    id: 'appt-7',
    time: '1:30',
    patient: { id: 'p7', name: 'Thomas Chen', mrn: '00431344', age: 43, sex: 'F', initials: 'TC' },
    visitType: 'New consult: movement disorder',
    status: 'scheduled',
    hasAgentPreppedChart: true,
  },
  {
    id: 'appt-8',
    time: '3:00',
    patient: { id: 'p8', name: 'Patricia Anderson', mrn: '00434358', age: 33, sex: 'F', initials: 'PA' },
    visitType: 'Telehealth f/u: migraine',
    status: 'scheduled',
    hasAgentPreppedChart: false,
  },
]

export const mockAgentActivity: AgentActivityItem[] = [
  {
    id: 'act-1',
    agentName: 'Eligibility Agent',
    timestamp: '2026-05-18T02:10:00Z',
    summary: 'Verified Kaiser (OON) benefits for Fatima Al-Rashid — flagged for billing review',
  },
  {
    id: 'act-2',
    agentName: 'Chart Prep Agent',
    timestamp: '2026-05-18T01:44:00Z',
    summary: 'Pre-populated DBS programming notes for Marcus Bell from prior visit',
  },
  {
    id: 'act-3',
    agentName: 'Message Agent',
    timestamp: '2026-05-18T01:30:00Z',
    summary: 'Sent appointment reminder to 6 patients for today\'s schedule',
  },
  {
    id: 'act-4',
    agentName: 'Eligibility Agent',
    timestamp: '2026-05-18T00:58:00Z',
    summary: 'Batch eligibility check complete — 7/8 patients verified, 1 flagged (Kaiser OON)',
  },
  {
    id: 'act-5',
    agentName: 'Intake Agent',
    timestamp: '2026-05-17T23:15:00Z',
    summary: 'Processed new patient intake forms for David Park and Fatima Al-Rashid',
  },
  {
    id: 'act-6',
    agentName: 'Prior Auth Agent',
    timestamp: '2026-05-17T22:00:00Z',
    summary: 'Submitted PA request for natalizumab (James Okonkwo) — tracking #2026-44901',
  },
  {
    id: 'act-7',
    agentName: 'Coding Agent',
    timestamp: '2026-05-17T20:30:00Z',
    summary: 'Audited yesterday\'s encounter codes — 3 G2211 add-ons applied, saving est. $420',
  },
  {
    id: 'act-8',
    agentName: 'NoShow Agent',
    timestamp: '2026-05-17T18:00:00Z',
    summary: 'Ran no-show risk model on tomorrow\'s schedule — 2 high-risk appointments flagged',
  },
]

export const mockRecentPatients: RecentPatient[] = [
  { id: 'p1', name: 'Sandra Perez', mrn: '00432303', age: 32, sex: 'M', initials: 'SP', lastOpened: '2026-05-18T07:45:00Z' },
  { id: 'p4', name: 'Daniel Nguyen', mrn: '00432988', age: 31, sex: 'M', initials: 'DN', lastOpened: '2026-05-17T16:20:00Z' },
  { id: 'p3', name: 'Carol Rodriguez', mrn: '00430522', age: 36, sex: 'F', initials: 'CR', lastOpened: '2026-05-17T11:05:00Z' },
  { id: 'p6', name: 'Nancy Singh', mrn: '00433536', age: 52, sex: 'F', initials: 'NS', lastOpened: '2026-05-16T15:30:00Z' },
  { id: 'p7', name: 'Robert Hernandez', mrn: '00431892', age: 59, sex: 'M', initials: 'RH', lastOpened: '2026-05-16T09:00:00Z' },
]

export const mockStats = {
  unsignedNotes: 3,
  unsignedNotesFromYesterday: 2,
  openTasks: 7,
  openTasksOverdue: 1,
  messagesAwaiting: 4,
  messagesUrgent: 1,
}

export const mockAgentSummary = {
  needsReview: 23,
  autoCompletedOvernight: 12,
  escalations: mockEscalations.length,
}
