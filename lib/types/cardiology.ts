export type CardiacConfidence = 'high' | 'medium' | 'low'

export interface EFDataPoint {
  date: string
  value: number
}

export interface VitalReading {
  date: string
  systolic: number
  diastolic: number
  hr: number
}

export interface LabResult {
  id: string
  testName: string
  value: string
  unit: string
  refRange: string
  flag: string
  resultedAt: string
  modifiedByType: 'agent' | 'human'
  modifiedByAgentName?: string
}

export interface CardiacStudy {
  id: string
  studyType: 'ecg' | 'echo' | 'cath' | 'chest-xray'
  performedAt: string
  summary: string
  lvef?: number
  modifiedByType: 'agent' | 'human'
  modifiedByAgentName?: string
}

export interface DeviceRecord {
  id: string
  deviceType: string
  implantedAt: string
  lastInterrogationAt: string
  batteryStatus: string
  afBurdenPct: number
  therapiesDelivered: number
  physician?: string
  modifiedByType: 'agent' | 'human'
  modifiedByAgentName?: string
}

export interface RiskScoreInput {
  label: string
  value: number
}

export interface RiskScore {
  id: string
  name: string
  displayName: string
  value: number
  severity: 'low' | 'moderate' | 'high'
  computedAt: string
  inputs: RiskScoreInput[]
  agentName: string
}

export interface GdmtFlag {
  id: string
  title: string
  detail: string
  agentName: string
  confidence: CardiacConfidence
  computedAt: string
  whyRationale: string
  whyInputs: string[]
}

export interface CardiacData {
  agentSummary: string
  agentSummaryConfidence: CardiacConfidence
  agentSummaryGeneratedAt: string

  efTrend: EFDataPoint[]
  latestEf: { value: number; date: string; agentName: string; modifiedAt: string } | null

  currentRhythm: string

  vitalsTrend: VitalReading[]

  labResults: LabResult[]
  ntProBnpTrend: number[]

  diagnostics: CardiacStudy[]

  riskScores: RiskScore[]

  gdmtFlags: GdmtFlag[]

  device: DeviceRecord | null
}
