export type ConfidenceLevel = 'high' | 'medium' | 'low'

export type AgentStatus = 'pending' | 'approved' | 'rejected' | 'deferred'

export type AgentName =
  | 'Eligibility Agent'
  | 'Message Agent'
  | 'Intake Agent'
  | 'Prior Auth Agent'
  | 'Coding Agent'
  | 'NoShow Agent'
  | 'Chart Prep Agent'

export type AgentActionCategory = 'eligibility' | 'messages' | 'documents' | 'tasks'

export interface AgentActionSource {
  label: string
  reference: string
}

export interface AgentAction {
  id: string
  agentName: AgentName
  confidence: ConfidenceLevel
  summary: string
  detail: string
  reasoningSummary: string
  sources: AgentActionSource[]
  patientName: string
  patientMrn: string
  timestamp: string
  status: AgentStatus
  category: AgentActionCategory
}

export interface AgentActivityItem {
  id: string
  agentName: AgentName
  timestamp: string
  summary: string
}

export interface EscalationItem {
  id: string
  agentName: AgentName
  situation: string
  patientRef: string
}
