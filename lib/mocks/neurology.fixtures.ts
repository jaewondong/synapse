// Neurology mock fixtures (§2.8 §9). Keyed by MRN; drives the demo flow.
// Assignment of conditions follows prisma/seed/neuro-seed.ts (single source of
// truth). Patients not present here resolve to an empty spine (no-neuro state).
//
// Drawer payloads are built INLINE by the consuming components (the cardiology
// pattern), so `auditId` here is a presence flag for "an audit affordance
// exists" — it does not need an entry in explainability-fixtures.ts.

import { emptyExamSpine } from '@/lib/neurology'
import type {
  ExamDomain,
  ExamFinding,
  NeuroChart,
  NeuroScale,
} from '@/lib/neurology'
// Anchor MRNs come from the canonical assignment table (single source of truth, §8).
import { NEURO_ANCHORS } from '@/prisma/seed/neuro-seed'

// --- exam helpers ------------------------------------------------------------

// Build the 7-domain spine, overlaying any provided domain data onto the blanks.
function examWith(overrides: Partial<Record<ExamDomain['key'], Partial<ExamDomain>>>): ExamDomain[] {
  return emptyExamSpine().map((d) => ({ ...d, ...overrides[d.key] }))
}

function agentFinding(
  id: string,
  text: string,
  confidence: ExamFinding['confidence'],
  sourceLabel: string,
  rationale: string,
): ExamFinding {
  return { id, text, provenance: 'agent', confidence, reviewState: 'pending', auditId: `audit-${id}`, sourceLabel, rationale }
}

function humanFinding(id: string, text: string): ExamFinding {
  return { id, text, provenance: 'human', reviewState: 'accepted' }
}

// =============================================================================
// 00428193 — Maria Lopez — MS anchor (showcase longitudinal demo)
// =============================================================================

const mariaEdss: NeuroScale = {
  key: 'edss',
  name: 'EDSS (Kurtzke)',
  licensing: 'compute',
  totalPoints: 4.5,
  maxPoints: 10,
  capturedAt: '2026-05-28T15:00:00Z',
  provenance: 'agent',
  auditId: 'audit-edss-00428193',
  interpretation:
    'EDSS 4.5 — ambulatory without aid for ~300m; disability is moderate. Driven by pyramidal and sensory functional systems; not a simple sum of subscores (ambulation-anchored above 4.0).',
  factors: [
    { criterion: 'Pyramidal', points: 3, met: true, evidenceLabel: 'Spastic paraparesis, R>L (exam 05/28/2026)', confidence: 'high' },
    { criterion: 'Cerebellar', points: 2, met: true, evidenceLabel: 'Left finger-to-nose dysmetria', confidence: 'high' },
    { criterion: 'Brainstem', points: 1, met: true, evidenceLabel: 'Mild dysarthria on extended speech', confidence: 'medium' },
    { criterion: 'Sensory', points: 2, met: true, evidenceLabel: 'Reduced vibration to mid-shin bilaterally', confidence: 'high' },
    { criterion: 'Bowel & Bladder', points: 1, met: true, evidenceLabel: 'Mild urinary urgency (patient-reported)', confidence: 'medium' },
    { criterion: 'Visual', points: 1, met: true, evidenceLabel: 'Residual left optic neuritis, acuity 20/25', confidence: 'high' },
    { criterion: 'Cerebral', points: 1, met: true, evidenceLabel: 'Mild fatigue-related processing slowing', confidence: 'low' },
    { criterion: 'Other', points: 0, met: false },
  ],
}

const mariaMsfc: NeuroScale = {
  key: 'msfc',
  name: 'MSFC (composite)',
  licensing: 'compute',
  // Composite z-score — NOT an additive criterion score, so its audit opens an
  // agent_action (how it was computed), not a risk_score. maxPoints omitted.
  totalPoints: -0.42,
  capturedAt: '2026-05-28T15:00:00Z',
  provenance: 'agent',
  auditId: 'audit-msfc-00428193',
  interpretation:
    'Composite z = −0.42 vs. reference; modest decline driven by the timed 25-foot walk component.',
  factors: [
    { criterion: 'Timed 25-Foot Walk', points: 0, met: true, evidenceLabel: '6.8 s (z −0.60)' },
    { criterion: '9-Hole Peg Test (dominant)', points: 0, met: true, evidenceLabel: '22.4 s (z −0.30)' },
    { criterion: 'PASAT-3', points: 0, met: true, evidenceLabel: '48/60 (z +0.10)' },
  ],
}

const mariaLopezMs: NeuroChart = {
  mrn: NEURO_ANCHORS.ms,
  patientName: 'Maria Lopez',
  problems: [
    { id: 'p-ms-1', label: 'Relapsing-remitting multiple sclerosis', icd10: 'G35', department: 'Neurology', conditionKey: 'ms', onsetDate: '2019-02-14', status: 'active' },
    { id: 'p-ms-2', label: 'Neurogenic bladder', icd10: 'N31.9', department: 'Neurology', onsetDate: '2023-06-01', status: 'active' },
    { id: 'p-ms-3', label: 'Optic neuritis, left', icd10: 'H46.02', department: 'Neurology', onsetDate: '2022-03-10', status: 'resolved' },
  ],
  exam: examWith({
    mental_status: { findings: [humanFinding('m-ms-ment', 'Alert, oriented x3; attention and language intact.')] },
    cranial_nerves: {
      findings: [
        agentFinding('m-ms-cn1', 'Left relative afferent pupillary defect (RAPD) present.', 'medium', 'Neuro-ophthalmology note 05/28/2026', 'Documented as "trace left RAPD on swinging-flashlight test"; flagged for clinician confirmation given prior left optic neuritis.'),
        humanFinding('m-ms-cn2', 'Extraocular movements full; no nystagmus.'),
      ],
    },
    motor: {
      findings: [
        agentFinding('m-ms-mot', 'Mild spastic paraparesis, right greater than left; strength 4+/5 hip flexors.', 'high', 'PT evaluation 05/26/2026', 'Extracted from PT note describing increased lower-extremity tone and 4+/5 proximal strength; consistent with pyramidal FS = 3.'),
      ],
    },
    sensory: {
      findings: [
        agentFinding('m-ms-sen', 'Decreased vibration sense to mid-shin bilaterally.', 'high', 'Encounter note 05/28/2026', 'Note records "vibration reduced to mid-tibia, symmetric"; supports sensory FS = 2.'),
      ],
    },
    coordination: { findings: [humanFinding('m-ms-coord', 'Dysmetria on left finger-to-nose; heel-to-shin mildly impaired left.')] },
    reflexes: { findings: [humanFinding('m-ms-ref', 'Patellar 3+ bilaterally; bilateral extensor plantar responses.')] },
    gait: {
      findings: [
        agentFinding('m-ms-gait', 'Spastic-ataxic gait; uses a cane for distances over ~100 m.', 'high', 'PT evaluation 05/26/2026', 'Gait described as "spastic with mild ataxia, cane for community distances"; anchors EDSS ambulation band ~4.5.'),
      ],
    },
  }),
  studies: [
    { id: 's-ms-1', modality: 'MRI', region: 'Brain w/wo contrast', date: '2026-05-20', impression: 'Two new T2/FLAIR periventricular hyperintensities vs. 2024; no enhancing lesions.', provenance: 'agent', confidence: 'high', confirmed: false, auditId: 'audit-mri-00428193' },
    { id: 's-ms-2', modality: 'MRI', region: 'Cervical spine', date: '2026-05-20', impression: 'Stable C3-C4 demyelinating plaque; no new cord lesions.', provenance: 'agent', confidence: 'medium', confirmed: false, auditId: 'audit-mri2-00428193' },
    { id: 's-ms-3', modality: 'MRI', region: 'Brain w/wo contrast', date: '2024-04-12', impression: 'Stable demyelinating burden; no enhancement.', provenance: 'human', confirmed: true },
  ],
  medications: [
    { id: 'mx-ms-1', name: 'Ocrelizumab', dose: '600 mg', frequency: 'IV q6 months', drugClass: 'DMT', startDate: '2024-03-01', active: true },
    { id: 'mx-ms-2', name: 'Baclofen', dose: '10 mg', frequency: 'TID', drugClass: 'Antispasmodic', startDate: '2023-01-15', active: true },
    { id: 'mx-ms-3', name: 'Oxybutynin', dose: '5 mg', frequency: 'BID', drugClass: 'Anticholinergic', startDate: '2023-06-05', active: true },
    { id: 'mx-ms-4', name: 'Cholecalciferol (Vit D3)', dose: '2000 IU', frequency: 'daily', active: true },
  ],
  exceptionFlags: [
    {
      id: 'ef-ms-1',
      title: 'Relapse documented but not reflected in EDSS',
      detail: 'A sensory relapse was charted 09/2024 but the EDSS trend shows no corresponding step — verify the disability trajectory before the next DMT decision.',
      severity: 'warning',
      agentName: 'MS Quality Agent',
      confidence: 'medium',
      computedAt: '2026-05-29T12:00:00Z',
      whyRationale: 'Relapse-to-EDSS concordance is a documentation-quality check: a charted relapse with a flat EDSS often means the post-relapse exam was not re-scored.',
      whyInputs: ['Relapse log 09/14/2024', 'EDSS trend 2022–2026', 'Neurology encounter 05/28/2026'],
    },
    {
      id: 'ef-ms-2',
      title: 'Polypharmacy — anticholinergic burden',
      detail: 'Oxybutynin plus baclofen raises cumulative anticholinergic/sedative load; consider mirabegron if cognitive fatigue worsens.',
      severity: 'info',
      agentName: 'MS Quality Agent',
      confidence: 'low',
      computedAt: '2026-05-29T12:00:00Z',
      whyRationale: 'Anticholinergic burden scoring is associated with cognitive slowing in MS; surfaced as judgment-needed, not an order.',
      whyInputs: ['Active medication list', 'Cerebral FS subscore'],
    },
  ],
  scales: [],
  ms: {
    edss: mariaEdss,
    msfc: mariaMsfc,
    edssTrend: [
      { date: '2019-06-01', value: 2.0 },
      { date: '2020-06-01', value: 2.5 },
      { date: '2021-06-01', value: 3.0 },
      { date: '2022-06-01', value: 3.5 },
      { date: '2023-06-01', value: 4.0 },
      { date: '2024-06-01', value: 4.0 },
      { date: '2025-06-01', value: 4.5 },
      { date: '2026-05-28', value: 4.5 },
    ],
    relapses: [
      { date: '2022-03-10', description: 'Left optic neuritis', edssAtVisit: 3.5 },
      { date: '2024-09-14', description: 'Sensory relapse — lower-extremity numbness', edssAtVisit: 4.0 },
    ],
    dmtTimeline: [
      { id: 'dmt-1', name: 'Interferon beta-1a', startDate: '2019-03-01', endDate: '2021-08-01', status: 'discontinued', note: 'Breakthrough activity' },
      { id: 'dmt-2', name: 'Dimethyl fumarate', startDate: '2021-08-15', endDate: '2024-02-20', status: 'discontinued', note: 'New T2 lesions' },
      { id: 'dmt-3', name: 'Ocrelizumab', startDate: '2024-03-01', status: 'active' },
    ],
  },
}

// =============================================================================
// 00428604 — James Chen — epilepsy anchor
// =============================================================================

const jamesGad7: NeuroScale = {
  key: 'gad7',
  name: 'GAD-7',
  licensing: 'compute',
  totalPoints: 9,
  maxPoints: 21,
  capturedAt: '2026-06-02T16:30:00Z',
  provenance: 'agent',
  auditId: 'audit-gad7-00428604',
  interpretation: 'GAD-7 9 — mild-to-moderate anxiety. Anxiety and depression are highly prevalent in epilepsy; rescreen and consider counseling.',
  factors: [
    { criterion: 'Feeling nervous, anxious, or on edge', points: 2, met: true, evidenceLabel: 'More than half the days' },
    { criterion: 'Not being able to stop or control worrying', points: 2, met: true, evidenceLabel: 'More than half the days' },
    { criterion: 'Worrying too much about different things', points: 1, met: true, evidenceLabel: 'Several days' },
    { criterion: 'Trouble relaxing', points: 1, met: true, evidenceLabel: 'Several days' },
    { criterion: 'Being so restless it is hard to sit still', points: 1, met: true, evidenceLabel: 'Several days' },
    { criterion: 'Becoming easily annoyed or irritable', points: 1, met: true, evidenceLabel: 'Several days' },
    { criterion: 'Feeling afraid something awful might happen', points: 1, met: true, evidenceLabel: 'Several days' },
  ],
}

const jamesNddie: NeuroScale = {
  key: 'nddie',
  name: 'NDDI-E',
  licensing: 'compute',
  totalPoints: 13,
  maxPoints: 24,
  capturedAt: '2026-06-02T16:30:00Z',
  provenance: 'agent',
  auditId: 'audit-nddie-00428604',
  interpretation: 'NDDI-E 13 — below the >15 threshold for major depression in epilepsy; no item-1 (suicidality) endorsement above baseline. Continue monitoring.',
  factors: [
    { criterion: 'Everything is a struggle', points: 2, met: true },
    { criterion: 'Nothing I do is right', points: 2, met: true },
    { criterion: 'Feel guilty', points: 3, met: true },
    { criterion: 'I would be better off dead', points: 1, met: false, evidenceLabel: 'Never (no active suicidality)' },
    { criterion: 'Frustrated', points: 3, met: true },
    { criterion: 'Difficulty finding pleasure', points: 2, met: true },
  ],
}

const jamesChenEpilepsy: NeuroChart = {
  mrn: NEURO_ANCHORS.epilepsy,
  patientName: 'James Chen',
  problems: [
    { id: 'p-ep-1', label: 'Focal epilepsy, left temporal', icd10: 'G40.109', department: 'Neurology', conditionKey: 'epilepsy', onsetDate: '2018-11-02', status: 'active' },
    { id: 'p-ep-2', label: 'Anxiety disorder', icd10: 'F41.1', department: 'Neurology', onsetDate: '2021-05-01', status: 'active' },
  ],
  exam: examWith({
    mental_status: {
      findings: [
        agentFinding('j-ep-ment', 'Mild word-finding difficulty on confrontation naming.', 'medium', 'Speech-language note 06/01/2026', 'Note records "occasional anomia, names 12/15 low-frequency items"; relevant to left temporal focus.'),
      ],
    },
    cranial_nerves: { findings: [humanFinding('j-ep-cn', 'Cranial nerves II–XII intact.')] },
    motor: { findings: [humanFinding('j-ep-mot', 'Strength 5/5 throughout; no drift.')], normal: true },
    sensory: { findings: [], normal: true },
    coordination: { findings: [], normal: true },
    reflexes: { findings: [humanFinding('j-ep-ref', 'Reflexes 2+ and symmetric; plantar flexor.')] },
    gait: { findings: [humanFinding('j-ep-gait', 'Normal-based gait; tandem intact.')], normal: true },
  }),
  studies: [
    { id: 's-ep-1', modality: 'EEG', region: 'Routine 21-channel', date: '2025-10-14', impression: 'Left anterior temporal interictal epileptiform discharges; no electrographic seizures captured.', provenance: 'agent', confidence: 'high', confirmed: false, auditId: 'audit-eeg-00428604' },
    { id: 's-ep-2', modality: 'MRI', region: 'Brain, epilepsy protocol', date: '2023-03-08', impression: 'Subtle left hippocampal volume loss; mesial temporal sclerosis not excluded.', provenance: 'human', confirmed: true },
  ],
  medications: [
    { id: 'mx-ep-1', name: 'Levetiracetam', dose: '1000 mg', frequency: 'BID', drugClass: 'AED', startDate: '2018-11-10', active: true },
    { id: 'mx-ep-2', name: 'Lamotrigine', dose: '200 mg', frequency: 'BID', drugClass: 'AED', startDate: '2020-02-01', active: true },
    { id: 'mx-ep-3', name: 'Valproate', dose: '500 mg', frequency: 'BID', drugClass: 'AED', startDate: '2022-07-15', active: true },
  ],
  exceptionFlags: [
    {
      id: 'ef-ep-1',
      title: 'AED level monitoring due — valproate',
      detail: 'No valproate trough or CBC/LFTs on file in the last 12 months; level monitoring and hepatic/hematologic surveillance are overdue.',
      severity: 'warning',
      agentName: 'Epilepsy Quality Agent',
      confidence: 'high',
      computedAt: '2026-06-02T13:00:00Z',
      whyRationale: 'Valproate requires periodic level and CBC/LFT monitoring; no result is on file within the guideline window.',
      whyInputs: ['Medication list — valproate since 07/2022', 'Lab results (last 12 months)'],
    },
    {
      id: 'ef-ep-2',
      title: 'SUDEP counseling gap',
      detail: 'No documented SUDEP risk counseling despite ongoing breakthrough seizures; guidelines recommend discussing risk and adherence.',
      severity: 'info',
      agentName: 'Epilepsy Quality Agent',
      confidence: 'medium',
      computedAt: '2026-06-02T13:00:00Z',
      whyRationale: 'SUDEP counseling is a documentation-quality measure; no encounter note records the discussion.',
      whyInputs: ['Seizure frequency trend', 'Encounter notes 2025–2026'],
    },
  ],
  scales: [],
  epilepsy: {
    scales: [jamesGad7, jamesNddie],
    seizures: [
      { date: '2025-07-01', type: 'Focal impaired awareness', count: 5, source: 'patient_diary' },
      { date: '2025-08-01', type: 'Focal impaired awareness', count: 4, source: 'patient_diary' },
      { date: '2025-09-01', type: 'Focal impaired awareness', count: 6, source: 'clinic' },
      { date: '2025-10-01', type: 'Focal impaired awareness', count: 3, source: 'patient_diary' },
      { date: '2025-11-01', type: 'Focal to bilateral tonic-clonic', count: 2, source: 'clinic' },
      { date: '2025-12-01', type: 'Focal impaired awareness', count: 3, source: 'patient_diary' },
      { date: '2026-01-01', type: 'Focal impaired awareness', count: 2, source: 'patient_diary' },
      { date: '2026-02-01', type: 'Focal impaired awareness', count: 4, source: 'clinic' },
      { date: '2026-03-01', type: 'Focal impaired awareness', count: 1, source: 'patient_diary' },
      { date: '2026-04-01', type: 'Focal impaired awareness', count: 2, source: 'patient_diary' },
      { date: '2026-05-01', type: 'Focal impaired awareness', count: 1, source: 'clinic' },
    ],
    aedTimeline: [
      { id: 'aed-1', name: 'Levetiracetam', startDate: '2018-11-10', status: 'active' },
      { id: 'aed-2', name: 'Lamotrigine', startDate: '2020-02-01', status: 'active' },
      { id: 'aed-3', name: 'Carbamazepine', startDate: '2019-01-05', endDate: '2020-02-01', status: 'discontinued', note: 'Rash' },
      { id: 'aed-4', name: 'Valproate', startDate: '2022-07-15', status: 'active' },
    ],
  },
}

// =============================================================================
// 00428878 — Andrew Moore — undifferentiated (workup in progress)
// =============================================================================

const andrewMoore: NeuroChart = {
  mrn: '00428878',
  patientName: 'Andrew Moore',
  problems: [
    { id: 'p-un-1', label: 'Episodic vertigo with gait unsteadiness', icd10: 'R42', department: 'Neurology', onsetDate: '2026-03-15', status: 'workup' },
  ],
  exam: examWith({
    mental_status: { findings: [humanFinding('a-un-ment', 'Alert and oriented; cognition grossly intact.')] },
    coordination: {
      findings: [
        agentFinding('a-un-coord', 'Subtle left-sided dysmetria on finger-to-nose at speed.', 'low', 'Encounter note 06/10/2026', 'Note hedges "possible mild left dysmetria, not reproducible"; low confidence, flagged for clinician confirmation.'),
      ],
    },
    gait: {
      findings: [
        agentFinding('a-un-gait', 'Widened base on tandem gait; pulls left on Romberg.', 'medium', 'PT screen 06/09/2026', 'Documented tandem instability with leftward Romberg drift.'),
      ],
    },
  }),
  studies: [
    { id: 's-un-1', modality: 'MRI', region: 'Brain w/wo contrast', date: '2026-06-18', impression: 'Ordered — pending. Posterior fossa evaluation for vertigo/ataxia.', provenance: 'human', confirmed: false },
  ],
  medications: [
    { id: 'mx-un-1', name: 'Meclizine', dose: '25 mg', frequency: 'PRN', startDate: '2026-03-20', active: true },
  ],
  exceptionFlags: [],
  scales: [],
  undifferentiated: {
    presentingSymptoms: ['Episodic vertigo (x3 months)', 'Gait unsteadiness', 'Intermittent oscillopsia'],
    differential: [
      { id: 'dx-a-1', label: 'Vestibular migraine', icd10: 'G43.A0', rationale: 'Episodic vertigo with photophobia and migraine history; most common cause of recurrent vertigo in this age band.', confidence: 'medium', auditId: 'audit-dx-a-1' },
      { id: 'dx-a-2', label: 'Demyelinating disease (possible MS)', icd10: 'G37.9', rationale: 'Subtle cerebellar signs plus oscillopsia warrant MRI to exclude a brainstem/cerebellar plaque.', confidence: 'low', auditId: 'audit-dx-a-2' },
      { id: 'dx-a-3', label: 'Posterior fossa structural lesion', icd10: 'R90.0', rationale: 'Lateralizing dysmetria and Romberg drift raise a small concern for a cerebellar lesion; MRI will resolve.', confidence: 'low', auditId: 'audit-dx-a-3' },
    ],
    pendingWorkup: ['MRI brain w/wo contrast (ordered)', 'Videonystagmography (VNG)', 'Audiogram', 'Orthostatic vitals'],
  },
}

// =============================================================================
// 00429700 — Diego Davis — undifferentiated (workup in progress)
// =============================================================================

const diegoDavis: NeuroChart = {
  mrn: '00429700',
  patientName: 'Diego Davis',
  problems: [
    { id: 'p-un2-1', label: 'New headache with transient left arm numbness', icd10: 'R51.9', department: 'Neurology', onsetDate: '2026-06-05', status: 'workup' },
  ],
  exam: examWith({
    mental_status: { findings: [humanFinding('d-un-ment', 'Alert, oriented; fluent speech, no neglect.')] },
    sensory: {
      findings: [
        agentFinding('d-un-sen', 'Reports transient left-hand paresthesia; exam now normal to light touch and pinprick.', 'medium', 'ED note 06/05/2026', 'Symptom resolved by exam; documented as "transient, fully resolved" — captured for the differential timeline.'),
      ],
    },
  }),
  studies: [
    { id: 's-un2-1', modality: 'CT', region: 'Head, non-contrast', date: '2026-06-05', impression: 'No acute hemorrhage or large-territory infarct.', provenance: 'agent', confidence: 'high', confirmed: false, auditId: 'audit-ct-00429700' },
  ],
  medications: [],
  exceptionFlags: [],
  scales: [],
  undifferentiated: {
    presentingSymptoms: ['Thunderclap-onset headache (resolved)', 'Transient left-arm numbness (~20 min)'],
    differential: [
      { id: 'dx-d-1', label: 'Transient ischemic attack', icd10: 'G45.9', rationale: 'Focal negative symptoms with abrupt onset/offset; ABCD2 intermediate — expedite vascular imaging.', confidence: 'medium', auditId: 'audit-dx-d-1' },
      { id: 'dx-d-2', label: 'Migraine with aura', icd10: 'G43.109', rationale: 'Spreading sensory symptoms and headache could be aura; positive-vs-negative phenomenology is equivocal here.', confidence: 'medium', auditId: 'audit-dx-d-2' },
      { id: 'dx-d-3', label: 'Focal seizure with sensory aura', icd10: 'G40.209', rationale: 'A focal sensory seizure is less likely without march or automatisms but is on the list pending EEG.', confidence: 'low', auditId: 'audit-dx-d-3' },
    ],
    pendingWorkup: ['MRI brain + MRA head/neck', 'Carotid ultrasound', 'Routine EEG', 'Lipid panel + HbA1c'],
  },
}

// =============================================================================
// 00429837 — Kimberly Johnson — unmapped (movement disorder → FallbackModule)
// =============================================================================

const kimberlyMdsUpdrs: NeuroScale = {
  key: 'mds_updrs',
  name: 'MDS-UPDRS',
  // HARD RULE (§5): the MDS-UPDRS may NOT be embedded/computed without Movement
  // Disorder Society authorization. link_out only — never compute, never reproduce items.
  licensing: 'link_out',
  externalHref: 'https://www.movementdisorders.org/MDS/MDS-Rating-Scales/MDS-Unified-Parkinsons-Disease-Rating-Scale-MDS-UPDRS.htm',
  provenance: 'human',
}

const kimberlyMoca: NeuroScale = {
  key: 'moca',
  name: 'MoCA',
  // record_only / verify licensing before any compute path (§5).
  licensing: 'record_only',
  recordedValue: '24 / 30 (administered 06/11/2026)',
  capturedAt: '2026-06-11T14:00:00Z',
  provenance: 'human',
}

const kimberlyJohnson: NeuroChart = {
  mrn: '00429837',
  patientName: 'Kimberly Johnson',
  problems: [
    // conditionKey is intentionally OFF the v1 registry → exercises FallbackModule (§9).
    { id: 'p-md-1', label: 'Parkinsonism, unspecified', icd10: 'G20', department: 'Neurology', conditionKey: 'movement_disorders', onsetDate: '2025-09-01', status: 'active' },
  ],
  exam: examWith({
    mental_status: { findings: [humanFinding('k-md-ment', 'MoCA 24/30; recall and visuospatial mildly reduced.')] },
    motor: {
      findings: [
        agentFinding('k-md-mot1', 'Resting tremor, right hand, ~4–6 Hz.', 'high', 'Encounter video 06/11/2026', 'Tremor characterized from clinic video as low-frequency resting; supports parkinsonism.'),
        agentFinding('k-md-mot2', 'Cogwheel rigidity, right upper extremity.', 'high', 'Encounter note 06/11/2026', 'Documented cogwheeling on passive wrist movement, right > left.'),
      ],
    },
    gait: {
      findings: [
        agentFinding('k-md-gait', 'Reduced right arm swing; mild shuffling, no festination.', 'medium', 'PT screen 06/11/2026', 'Asymmetric arm swing and short stride; early gait involvement.'),
      ],
    },
  }),
  studies: [
    { id: 's-md-1', modality: 'MRI', region: 'Brain', date: '2025-10-02', impression: 'No structural lesion; no vascular parkinsonism features.', provenance: 'human', confirmed: true },
  ],
  medications: [
    { id: 'mx-md-1', name: 'Carbidopa-levodopa', dose: '25-100 mg', frequency: 'TID', startDate: '2025-10-10', active: true },
  ],
  exceptionFlags: [],
  scales: [kimberlyMdsUpdrs, kimberlyMoca],
}

// =============================================================================
// Registry of fixtures
// =============================================================================

export const NEURO_FIXTURES: Record<string, NeuroChart> = {
  [NEURO_ANCHORS.ms]: mariaLopezMs,
  [NEURO_ANCHORS.epilepsy]: jamesChenEpilepsy,
  '00428878': andrewMoore,
  '00429700': diegoDavis,
  '00429837': kimberlyJohnson,
}
