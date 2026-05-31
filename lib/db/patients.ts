import { prisma } from '@/lib/db/prisma'
import { createServerClient } from '@/lib/supabase/server'
import type {
  ChartData,
  ChartPatient,
  Insurance,
  Allergy,
  CareTeamMember,
  UpcomingAppointment,
  Problem,
  Encounter,
  SeizureLog,
  Medication,
  ImagingStudy,
  ReconciliationPrompt,
  DepartmentCounts,
  LookupPatient,
  ProvenanceType,
  InsuranceEligibility,
  NoShowRisk,
} from '@/lib/types/chart'
import type {
  CardiacData,
  EFDataPoint,
  VitalReading,
  LabResult,
  CardiacStudy,
  DeviceRecord,
  RiskScore,
  RiskScoreInput,
  GdmtFlag,
} from '@/lib/types/cardiology'

const PATIENT_INCLUDE = {
  insurances: true,
  allergies: true,
  problems: true,
  medications: true,
  encounters: true,
  imagingStudies: true,
  seizureEvents: true,
  careTeamMembers: true,
  appointments: { where: { status: 'Scheduled' }, take: 1, orderBy: { appointmentDate: 'asc' as const } },
  reconciliationPrompts: true,
  labResults: true,
  cardiacStudies: true,
  devices: true,
  riskScores: true,
  vitalSigns: { orderBy: { takenAt: 'asc' as const } },
  agentObservations: true,
} as const

type PatientWithRelations = NonNullable<Awaited<ReturnType<typeof findPatientByMrn>>>

async function findPatientByMrn(mrn: string) {
  return prisma.patient.findUnique({ where: { mrn }, include: PATIENT_INCLUDE })
}

function initials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

function mapChartPatient(p: PatientWithRelations): ChartPatient {
  const addr = [p.addressStreet, p.addressCity, p.addressState, p.addressZip]
    .filter(Boolean)
    .join(', ')
  return {
    id: p.id,
    mrn: p.mrn,
    name: `${p.firstName} ${p.lastName}`,
    firstName: p.firstName,
    lastName: p.lastName,
    initials: initials(p.firstName, p.lastName),
    dob: p.dateOfBirth,
    age: p.age,
    sex: p.sex as 'M' | 'F',
    status: p.status as ChartPatient['status'],
    pcp: p.pcpName ?? p.primaryProviderName ?? '',
    preferredLanguage: p.preferredLanguage ?? 'English',
    pronouns: p.pronouns ?? '',
    allergyCount: p.allergies.filter((a) => a.active).length,
    lastSeen: p.lastSeenDate ?? '',
    address: addr,
    phone: p.phone ?? '',
    email: p.email ?? '',
    maritalStatus: p.maritalStatus ?? '',
    employer: p.employer ?? '',
    emergencyContact: {
      name: p.emergencyContactName ?? '',
      relationship: p.emergencyContactRelationship ?? '',
    },
    primaryDepartment: p.primaryDepartment,
  }
}

function mapInsurance(ins: PatientWithRelations['insurances'][0]): Insurance {
  return {
    id: ins.id,
    name: ins.payerName,
    memberId: ins.memberId ?? '',
    eligibility: (ins.eligibilityStatus ?? 'Active') as InsuranceEligibility,
    slot: (ins.slot ?? 'primary') as 'primary' | 'secondary',
    lastVerified: ins.lastVerifiedAt ?? '',
    modifiedByType: (ins.verifiedByType ?? 'human') as ProvenanceType,
    modifiedByAgentName: ins.verifiedByAgentName ?? '',
    modifiedAt: ins.lastVerifiedAt ?? '',
  }
}

function mapAllergy(a: PatientWithRelations['allergies'][0]): Allergy {
  return {
    id: a.id,
    name: a.substance,
    severity: (a.severity ?? 'Mild') as Allergy['severity'],
    reaction: a.reaction ?? '',
    year: a.yearIdentified ?? 0,
  }
}

function mapCareTeam(ct: PatientWithRelations['careTeamMembers'][0]): CareTeamMember {
  return {
    id: ct.id,
    name: ct.name,
    role: ct.role ?? '',
    relationship: ct.relationship ?? '',
  }
}

function mapAppointment(
  appt: PatientWithRelations['appointments'][0]
): UpcomingAppointment {
  const dateTime = appt.appointmentDate
    ? appt.appointmentTime
      ? `${appt.appointmentDate}T${appt.appointmentTime}:00`
      : `${appt.appointmentDate}T00:00:00`
    : ''
  return {
    id: appt.id,
    date: dateTime,
    visitType: appt.visitType ?? '',
    provider: appt.providerName ?? '',
    noShowRisk: (appt.noShowRisk ?? 'Low') as NoShowRisk,
  }
}

function mapProblem(pr: PatientWithRelations['problems'][0]): Problem {
  return {
    id: pr.id,
    name: pr.name,
    icd10: pr.icd10 ?? '',
    onset: pr.onsetYear?.toString() ?? '',
    context: '',
    status: pr.status as Problem['status'],
    department: (pr.department ?? '').toLowerCase(),
    modifiedByType: (pr.modifiedByType ?? 'human') as ProvenanceType,
    modifiedByAgentName: pr.modifiedByAgentName ?? undefined,
    modifiedAt: '',
  }
}

function mapEncounter(e: PatientWithRelations['encounters'][0]): Encounter {
  return {
    id: e.id,
    visitType: e.visitType ?? '',
    provider: e.providerName ?? '',
    date: e.encounterDate ?? '',
    summary: e.summary ?? '',
    department: (e.department ?? '').toLowerCase(),
    status: (e.status?.toLowerCase() === 'complete' ? 'complete' : 'pending') as Encounter['status'],
  }
}

function mapMedication(m: PatientWithRelations['medications'][0]): Medication {
  return {
    id: m.id,
    name: m.name,
    dose: m.dose ?? '',
    frequency: m.frequency ?? '',
    prescriber: m.prescribingProvider ?? '',
    startDate: m.startedYear?.toString() ?? '',
    active: m.active,
    modifiedByType: (m.modifiedByType ?? 'human') as ProvenanceType,
    modifiedByAgentName: m.modifiedByAgentName ?? undefined,
    modifiedAt: '',
  }
}

function mapImagingStudy(img: PatientWithRelations['imagingStudies'][0]): ImagingStudy {
  return {
    id: img.id,
    type: img.studyName ?? '',
    date: img.studyDate ?? '',
    provider: img.department ?? '',
    result: img.finding ?? '',
    status: (img.status?.toLowerCase() === 'complete' ? 'complete' : 'pending') as ImagingStudy['status'],
  }
}

function mapReconciliationPrompt(
  rp: PatientWithRelations['reconciliationPrompts'][0]
): ReconciliationPrompt {
  return {
    id: rp.id,
    message: rp.message ?? '',
    agentName: rp.agentName ?? '',
    createdAt: rp.createdAt ?? '',
    resolved: rp.resolved,
  }
}

function buildSeizureLog(
  events: PatientWithRelations['seizureEvents']
): SeizureLog | null {
  if (!events.length) return null

  const sorted = [...events].sort((a, b) => {
    const da = a.eventDate ?? ''
    const db = b.eventDate ?? ''
    return db.localeCompare(da)
  })

  const ninety = new Date()
  ninety.setDate(ninety.getDate() - 90)
  const last90Days = sorted.filter(
    (e) => e.eventDate && new Date(e.eventDate) >= ninety
  ).length

  // Trend: compare last 90 days to prior 90 days
  const oneEighty = new Date()
  oneEighty.setDate(oneEighty.getDate() - 180)
  const prior90 = sorted.filter((e) => {
    if (!e.eventDate) return false
    const d = new Date(e.eventDate)
    return d >= oneEighty && d < ninety
  }).length
  const trend =
    prior90 === 0
      ? 0
      : Math.round(((last90Days - prior90) / prior90) * 100)

  const latest = sorted[0]
  return {
    last90Days,
    trendVsPriorQuarterPercent: trend,
    lastEvent: {
      date: latest.eventDate ?? '',
      duration: latest.durationSeconds ? `${latest.durationSeconds} sec` : '',
      type: latest.type ?? '',
    },
  }
}

function buildDepartmentCounts(p: PatientWithRelations, documentCount = 0): DepartmentCounts {
  const DEPT_MAP: Record<string, keyof Omit<DepartmentCounts, 'timeline'>> = {
    neurology: 'neurology',
    cardiology: 'cardiology',
    imaging: 'imaging',
    labs: 'labs',
    medications: 'medications',
    immunizations: 'immunizations',
    'primary care': 'primary-care',
    'primary-care': 'primary-care',
  }

  const counts: Omit<DepartmentCounts, 'timeline'> = {
    neurology: 0,
    cardiology: 0,
    imaging: 0,
    labs: 0,
    medications: p.medications.filter((m) => m.active).length,
    immunizations: 0,
    'primary-care': 0,
    documents: documentCount,
  }

  for (const enc of p.encounters) {
    const key = DEPT_MAP[(enc.department ?? '').toLowerCase()]
    if (key) counts[key]++
  }

  for (const img of p.imagingStudies) {
    counts.imaging++
    // Also increment the patient's specialty dept if present
    const key = DEPT_MAP[(img.department ?? '').toLowerCase()]
    if (key && key !== 'imaging') counts[key]++
  }

  return { ...counts, timeline: 'all' }
}

async function getDocumentCount(mrn: string): Promise<number> {
  try {
    const supabase = createServerClient()
    const { count } = await supabase
      .from('patient_documents')
      .select('id', { count: 'exact', head: true })
      .eq('patient_mrn', mrn)
      .is('deleted_at', null)
    return count ?? 0
  } catch {
    return 0
  }
}

function mapLabResult(r: PatientWithRelations['labResults'][0]): LabResult {
  return {
    id: r.id,
    testName: r.testName,
    value: r.value,
    unit: r.unit ?? '',
    refRange: r.refRange ?? '',
    flag: r.flag ?? 'Normal',
    resultedAt: r.resultedAt ?? '',
    modifiedByType: (r.modifiedByType ?? 'agent') as 'agent' | 'human',
    modifiedByAgentName: r.modifiedByAgentName ?? undefined,
  }
}

function mapCardiacStudy(s: PatientWithRelations['cardiacStudies'][0]): CardiacStudy {
  return {
    id: s.id,
    studyType: s.studyType as CardiacStudy['studyType'],
    performedAt: s.performedAt ?? '',
    summary: s.summary ?? '',
    lvef: s.lvef ?? undefined,
    modifiedByType: (s.modifiedByType ?? 'agent') as 'agent' | 'human',
    modifiedByAgentName: s.modifiedByAgentName ?? undefined,
  }
}

function mapDevice(d: PatientWithRelations['devices'][0]): DeviceRecord {
  return {
    id: d.id,
    deviceType: d.deviceType,
    implantedAt: d.implantedAt ?? '',
    lastInterrogationAt: d.lastInterrogationAt ?? '',
    batteryStatus: d.batteryStatus ?? '',
    afBurdenPct: d.afBurdenPct ?? 0,
    therapiesDelivered: d.therapiesDelivered ?? 0,
    physician: d.physician ?? undefined,
    modifiedByType: (d.modifiedByType ?? 'agent') as 'agent' | 'human',
    modifiedByAgentName: d.modifiedByAgentName ?? undefined,
  }
}

function mapRiskScore(rs: PatientWithRelations['riskScores'][0]): RiskScore {
  let inputs: RiskScoreInput[] = []
  if (rs.inputs) {
    try { inputs = JSON.parse(rs.inputs) } catch { inputs = [] }
  }
  return {
    id: rs.id,
    name: rs.name,
    displayName: rs.displayName ?? rs.name,
    value: rs.value,
    severity: rs.severity as RiskScore['severity'],
    computedAt: rs.computedAt ?? '',
    inputs,
    agentName: rs.agentName ?? 'Agent',
  }
}

function mapVitalSign(v: PatientWithRelations['vitalSigns'][0]): VitalReading {
  return {
    date: v.takenAt ?? '',
    systolic: v.systolic ?? 0,
    diastolic: v.diastolic ?? 0,
    hr: v.hr ?? 0,
  }
}

function mapGdmtFlag(o: PatientWithRelations['agentObservations'][0]): GdmtFlag {
  let whyInputs: string[] = []
  if (o.whyInputs) {
    try { whyInputs = JSON.parse(o.whyInputs) } catch { whyInputs = [] }
  }
  return {
    id: o.id,
    title: o.title,
    detail: o.detail ?? '',
    agentName: o.agentName ?? 'GDMT Agent',
    confidence: (o.confidence ?? 'medium') as GdmtFlag['confidence'],
    computedAt: o.computedAt ?? '',
    whyRationale: o.whyRationale ?? '',
    whyInputs,
  }
}

function buildCardiacData(p: PatientWithRelations): CardiacData | null {
  if (
    !p.labResults.length &&
    !p.cardiacStudies.length &&
    !p.devices.length &&
    !p.riskScores.length &&
    !p.vitalSigns.length &&
    !p.agentObservations.length
  ) {
    return null
  }

  // EF trend from echo studies sorted chronologically
  const echos = [...p.cardiacStudies]
    .filter((s) => s.studyType === 'echo' && s.lvef != null)
    .sort((a, b) => (a.performedAt ?? '').localeCompare(b.performedAt ?? ''))
  const efTrend: EFDataPoint[] = echos.map((s) => ({
    date: s.performedAt ?? '',
    value: s.lvef!,
  }))
  const latestEcho = echos[echos.length - 1] ?? null
  const latestEf = latestEcho
    ? {
        value: latestEcho.lvef!,
        date: latestEcho.performedAt ?? '',
        agentName: latestEcho.modifiedByAgentName ?? 'Documentation Agent',
        modifiedAt: latestEcho.performedAt ?? '',
      }
    : null

  // NT-proBNP sparkline from lab results
  const ntProBnp = p.labResults.filter((r) => r.testName.toLowerCase().includes('nt-probnp'))
  const ntProBnpTrend = ntProBnp
    .map((r) => parseFloat(r.value))
    .filter((v) => !isNaN(v))

  // Rhythm from agent observations
  const rhythmObs = p.agentObservations.find((o) => o.category === 'rhythm')
  const currentRhythm = rhythmObs?.detail ?? 'Paroxysmal AFib'

  // GDMT flags
  const gdmtFlags = p.agentObservations
    .filter((o) => o.category === 'gdmt-flag' && !o.dismissed)
    .map(mapGdmtFlag)

  // Build a stable summary from risk scores if no explicit summary observation
  const summaryObs = p.agentObservations.find((o) => o.category === 'summary')
  const agentSummary = summaryObs?.detail ?? ''
  const agentSummaryConfidence = (summaryObs?.confidence ?? 'high') as CardiacData['agentSummaryConfidence']
  const agentSummaryGeneratedAt = summaryObs?.computedAt ?? ''

  return {
    agentSummary,
    agentSummaryConfidence,
    agentSummaryGeneratedAt,
    efTrend,
    latestEf,
    currentRhythm,
    vitalsTrend: p.vitalSigns.map(mapVitalSign),
    labResults: p.labResults.map(mapLabResult),
    ntProBnpTrend,
    diagnostics: [...p.cardiacStudies]
      .sort((a, b) => (b.performedAt ?? '').localeCompare(a.performedAt ?? ''))
      .map(mapCardiacStudy),
    riskScores: p.riskScores.map(mapRiskScore),
    gdmtFlags,
    device: p.devices.length > 0 ? mapDevice(p.devices[0]) : null,
  }
}

export async function getChartData(mrn: string): Promise<ChartData | null> {
  const [p, docCount] = await Promise.all([
    findPatientByMrn(mrn),
    getDocumentCount(mrn),
  ])
  if (!p) return null

  const primaryInsurance = p.insurances.find((i) => i.slot === 'primary') ?? p.insurances[0]

  return {
    patient: mapChartPatient(p),
    insurance: primaryInsurance ? mapInsurance(primaryInsurance) : {
      id: '',
      name: 'No insurance on file',
      memberId: '',
      eligibility: 'Inactive',
      slot: 'primary',
      lastVerified: '',
      modifiedByType: 'human',
      modifiedByAgentName: '',
      modifiedAt: '',
    },
    allergies: p.allergies.map(mapAllergy),
    careTeam: p.careTeamMembers.map(mapCareTeam),
    upcomingAppointment: p.appointments[0] ? mapAppointment(p.appointments[0]) : null,
    problems: p.problems.map(mapProblem),
    encounters: [...p.encounters]
      .sort((a, b) => (b.encounterDate ?? '').localeCompare(a.encounterDate ?? ''))
      .map(mapEncounter),
    seizureLog: buildSeizureLog(p.seizureEvents),
    cardiacData: buildCardiacData(p),
    medications: p.medications.filter((m) => m.active).map(mapMedication),
    imagingStudies: [...p.imagingStudies]
      .sort((a, b) => (b.studyDate ?? '').localeCompare(a.studyDate ?? ''))
      .map(mapImagingStudy),
    reconciliationPrompts: p.reconciliationPrompts.map(mapReconciliationPrompt),
    departmentCounts: buildDepartmentCounts(p, docCount),
  }
}

function soundexCode(s: string): string {
  const map: Record<string, string> = {
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6',
  }
  const lower = s.toLowerCase().replace(/[^a-z]/g, '')
  if (!lower) return ''
  const coded =
    lower[0].toUpperCase() +
    lower
      .slice(1)
      .split('')
      .map((c) => map[c] ?? '0')
      .filter((c, i, a) => c !== '0' && c !== a[i - 1])
      .join('')
  return (coded + '000').slice(0, 4)
}

function nameMatches(
  firstName: string,
  lastName: string,
  query: string
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const full = `${firstName} ${lastName}`.toLowerCase()
  if (full.includes(q)) return true

  const qWords = q.split(/\s+/)
  const nameWords = full.split(/\s+/)
  return qWords.every((qw) =>
    nameWords.some((nw) => soundexCode(nw) === soundexCode(qw))
  )
}

function parseDate(raw: string): Date | null {
  const iso = new Date(raw)
  if (!isNaN(iso.getTime())) return iso

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slashMatch) {
    let year = parseInt(slashMatch[3], 10)
    if (year < 100) year += year < 30 ? 2000 : 1900
    const d = new Date(year, parseInt(slashMatch[1], 10) - 1, parseInt(slashMatch[2], 10))
    if (!isNaN(d.getTime())) return d
  }

  const text = new Date(raw)
  if (!isNaN(text.getTime())) return text

  return null
}

export type SearchResult =
  | { patients: LookupPatient[]; directLoad?: string }
  | { patients: LookupPatient[]; dobError: string }

export async function searchPatients(params: {
  name?: string
  dob?: string
  mrn?: string
}): Promise<SearchResult> {
  const { name = '', dob = '', mrn = '' } = params

  if (!name && !dob && !mrn) return { patients: [] }

  // MRN direct load
  if (mrn) {
    const p = await prisma.patient.findUnique({ where: { mrn } })
    if (p) {
      const result = toLookup(p)
      return { patients: [result], directLoad: p.mrn }
    }
    return { patients: [] }
  }

  // Parse DOB if provided
  let dobIso: string | null = null
  if (dob) {
    const parsed = parseDate(dob)
    if (!parsed) return { patients: [], dobError: 'Unable to parse date. Try MM/DD/YYYY.' }
    dobIso = parsed.toISOString().slice(0, 10)
  }

  // Fetch from DB — for 50 patients we can load all and filter in JS
  const where = dobIso ? { dateOfBirth: dobIso } : undefined
  const rows = await prisma.patient.findMany({ where, orderBy: { lastSeenDate: 'desc' } })

  const filtered = name
    ? rows.filter((p) => nameMatches(p.firstName, p.lastName, name))
    : rows

  return { patients: filtered.map(toLookup) }
}

function toLookup(p: {
  id: string
  mrn: string
  firstName: string
  lastName: string
  dateOfBirth: string
  age: number
  sex: string
  primaryDepartment: string
  lastSeenDate: string | null
  pediatric: boolean
}): LookupPatient {
  return {
    id: p.id,
    mrn: p.mrn,
    name: `${p.firstName} ${p.lastName}`,
    initials: initials(p.firstName, p.lastName),
    dob: p.dateOfBirth,
    age: p.age,
    sex: p.sex as 'M' | 'F',
    primaryDepartment: p.primaryDepartment,
    lastSeen: p.lastSeenDate ?? '',
  }
}
