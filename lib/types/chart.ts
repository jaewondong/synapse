export type PatientStatus = 'Active' | 'Inactive' | 'Deceased'
export type ProblemStatus = 'Active' | 'Stable' | 'Evaluating' | 'Resolved'
export type InsuranceEligibility = 'Active' | 'Inactive' | 'Pending' | 'Error'
export type NoShowRisk = 'Low' | 'Medium' | 'High'
export type Department =
  | 'neurology'
  | 'cardiology'
  | 'imaging'
  | 'labs'
  | 'medications'
  | 'immunizations'
  | 'primary-care'
  | 'documents'
  | 'timeline'
export type ProvenanceType = 'agent' | 'human'

export interface ChartPatient {
  id: string
  mrn: string
  name: string
  firstName: string
  lastName: string
  initials: string
  dob: string
  age: number
  sex: 'M' | 'F'
  status: PatientStatus
  pcp: string
  preferredLanguage: string
  pronouns: string
  allergyCount: number
  lastSeen: string
  // Demographics
  address: string
  phone: string
  email: string
  maritalStatus: string
  employer: string
  emergencyContact: { name: string; relationship: string }
  // Search fields
  primaryDepartment: string
}

export interface Insurance {
  id: string
  name: string
  memberId: string
  eligibility: InsuranceEligibility
  slot: 'primary' | 'secondary'
  lastVerified: string
  modifiedByType: ProvenanceType
  modifiedByAgentName: string
  modifiedAt: string
}

export interface Allergy {
  id: string
  name: string
  severity: 'Severe' | 'Moderate' | 'Mild'
  reaction: string
  year: number
}

export interface CareTeamMember {
  id: string
  name: string
  role: string
  relationship: string
}

export interface UpcomingAppointment {
  id: string
  date: string
  visitType: string
  provider: string
  noShowRisk: NoShowRisk
}

export interface Problem {
  id: string
  name: string
  icd10: string
  onset: string
  context: string
  status: ProblemStatus
  department: string
  modifiedByType: ProvenanceType
  modifiedByAgentName?: string
  modifiedAt: string
}

export interface Encounter {
  id: string
  visitType: string
  provider: string
  date: string
  summary: string
  department: string
  status: 'complete' | 'pending'
}

export interface SeizureLog {
  last90Days: number
  trendVsPriorQuarterPercent: number
  lastEvent: {
    date: string
    duration: string
    type: string
  }
}

export interface Medication {
  id: string
  name: string
  dose: string
  frequency: string
  prescriber: string
  startDate: string
  active: boolean
  modifiedByType: ProvenanceType
  modifiedByAgentName?: string
  modifiedAt: string
}

export interface ImagingStudy {
  id: string
  type: string
  date: string
  provider: string
  result: string
  status: 'complete' | 'pending'
}

export interface ReconciliationPrompt {
  id: string
  message: string
  agentName: string
  createdAt: string
  resolved: boolean
}

export interface DepartmentCounts {
  neurology: number
  cardiology: number
  imaging: number
  labs: number
  medications: number
  immunizations: number
  'primary-care': number
  documents: number
  timeline: 'all'
}

export interface ChartData {
  patient: ChartPatient
  insurance: Insurance
  allergies: Allergy[]
  careTeam: CareTeamMember[]
  upcomingAppointment: UpcomingAppointment | null
  problems: Problem[]
  encounters: Encounter[]
  seizureLog: SeizureLog | null
  medications: Medication[]
  imagingStudies: ImagingStudy[]
  reconciliationPrompts: ReconciliationPrompt[]
  departmentCounts: DepartmentCounts
}

export interface LookupPatient {
  id: string
  mrn: string
  name: string
  initials: string
  dob: string
  age: number
  sex: 'M' | 'F'
  primaryDepartment: string
  lastSeen: string
}
