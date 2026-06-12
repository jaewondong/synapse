// Explainability Drawer mock fixtures (§2.7.7), keyed by auditId.
// `aud_missing` is intentionally absent — opening it exercises the error state.

import type { ExplainabilityPayload } from '@/lib/explainability'

export const EXPLAINABILITY_FIXTURES: Record<string, ExplainabilityPayload> = {
  aud_chadsvasc_rh: {
    kind: 'risk_score',
    title: 'CHA₂DS₂-VASc Score',
    agentName: 'Cardiac Risk Agent',
    agentVersion: 'v0.3.1',
    modifiedByType: 'agent',
    timestamp: '2026-06-08T14:22:00Z',
    patientName: 'Robert Hernandez',
    patientMrn: '00731649',
    confidence: 'high',
    scoreName: 'CHA₂DS₂-VASc',
    totalPoints: 5,
    maxPoints: 9,
    factors: [
      {
        criterion: 'Congestive heart failure',
        points: 1,
        met: true,
        evidence: {
          label: 'Echo report 04/12/2026',
          detail: 'LVEF 38%, consistent with HFrEF',
          sourceHref: '/chart/00731649/cardiology',
        },
      },
      {
        criterion: 'Hypertension',
        points: 1,
        met: true,
        evidence: { label: 'Problem list', detail: 'Essential hypertension, on lisinopril' },
      },
      { criterion: 'Age ≥75', points: 0, met: false },
      {
        criterion: 'Diabetes mellitus',
        points: 1,
        met: true,
        evidence: { label: 'A1c 7.4% — 03/30/2026' },
      },
      { criterion: 'Prior stroke / TIA / thromboembolism', points: 0, met: false },
      {
        criterion: 'Vascular disease (prior MI, PAD, or aortic plaque)',
        points: 1,
        met: true,
        evidence: { label: 'Cath report 11/2024', detail: 's/p PCI to LAD' },
      },
      {
        criterion: 'Age 65–74',
        points: 1,
        met: true,
        evidence: { label: 'DOB on file — age 71' },
      },
      { criterion: 'Sex category (female)', points: 0, met: false },
    ],
    interpretation:
      'Score of 5 corresponds to an annual stroke risk of approximately 6.7%. Oral anticoagulation is recommended unless contraindicated.',
    guidelineRef: '2023 ACC/AHA/ACCP/HRS Atrial Fibrillation Guideline',
  },

  aud_hasbled_rh: {
    kind: 'risk_score',
    title: 'HAS-BLED Score',
    agentName: 'Cardiac Risk Agent',
    agentVersion: 'v0.3.1',
    modifiedByType: 'agent',
    timestamp: '2026-06-08T14:22:00Z',
    patientName: 'Robert Hernandez',
    patientMrn: '00731649',
    confidence: 'high',
    scoreName: 'HAS-BLED',
    totalPoints: 2,
    maxPoints: 9,
    factors: [
      {
        criterion: 'Hypertension (uncontrolled, SBP >160)',
        points: 1,
        met: true,
        evidence: { label: 'Vitals 05/28/2026', detail: 'SBP 164 at last two visits' },
      },
      { criterion: 'Abnormal renal function', points: 0, met: false },
      { criterion: 'Abnormal liver function', points: 0, met: false },
      { criterion: 'Stroke history', points: 0, met: false },
      { criterion: 'Bleeding history or predisposition', points: 0, met: false },
      { criterion: 'Labile INR', points: 0, met: false },
      {
        criterion: 'Elderly (age >65)',
        points: 1,
        met: true,
        evidence: { label: 'DOB on file — age 71' },
      },
      { criterion: 'Drugs / alcohol concomitantly', points: 0, met: false },
    ],
    interpretation:
      'Score of 2 indicates moderate bleeding risk. Does not outweigh stroke-prevention benefit of anticoagulation; address modifiable factors (blood-pressure control).',
    guidelineRef: '2023 ACC/AHA/ACCP/HRS Atrial Fibrillation Guideline',
  },

  aud_gdmt_arni_rh: {
    kind: 'agent_action',
    title: 'GDMT exception — ARNI uptitration',
    agentName: 'GDMT Agent',
    agentVersion: 'v0.2.0',
    modifiedByType: 'agent',
    timestamp: '2026-06-09T09:05:00Z',
    patientName: 'Robert Hernandez',
    patientMrn: '00731649',
    confidence: 'medium',
    actionSummary:
      'Flagged sacubitril/valsartan (ARNI) for uptitration from 24/26 mg BID to 49/51 mg BID; patient remains below target dose with stable blood pressure.',
    reasoning: [
      'LVEF 38% on most recent echo — HFrEF with class I indication for ARNI at target dose.',
      'History of ACE-inhibitor angioedema — ARNI selected over ACEi per chart note 02/2025.',
      'BP 118/74 at last visit with no orthostatic symptoms; headroom for uptitration.',
      'No hyperkalemia: K 4.2 on 05/28/2026 BMP.',
    ],
    inputs: [
      {
        label: 'Medication list',
        detail: 'sacubitril/valsartan 24/26 mg BID since 03/2026',
        sourceHref: '/chart/00731649/medications',
      },
      { label: 'Vitals 05/28/2026', detail: 'BP 118/74, HR 68' },
      {
        label: 'Echo report 04/12/2026',
        detail: 'LVEF 38%',
        sourceHref: '/chart/00731649/cardiology',
      },
    ],
    output: {
      label: 'Proposed order change',
      preview:
        'Increase sacubitril/valsartan to 49/51 mg PO BID. Recheck BMP and blood pressure in 2 weeks. Continue current beta-blocker and SGLT2i dosing.',
    },
    guardrails: [
      'Angioedema-history check: ARNI not contraindicated (prior reaction was to ACEi; ARNI tolerated 14 months)',
      'Renal-function check: eGFR 64, above uptitration threshold',
      'Hyperkalemia check: K 4.2, within range',
    ],
    decisionState: 'pending',
  },

  aud_ins_commit_ml: {
    kind: 'extraction',
    title: 'Insurance Extraction — Commit v2',
    agentName: 'Insurance Agent',
    agentVersion: 'v0.1.0',
    modifiedByType: 'agent',
    timestamp: '2026-06-02T16:40:00Z',
    patientName: 'Maria Lopez',
    patientMrn: '00428193',
    confidence: 'high',
    documentLabel: 'Insurance card (front/back) — uploaded 06/02/2026',
    commitVersion: 2,
    committedBy: 'Dana Whitfield, Patient Services',
    fields: [
      {
        field: 'Payer',
        committedValue: 'Blue Cross Blue Shield',
        confidence: 'high',
        sourceRegion: 'Card front, header',
        resolution: 'kept_on_file',
        previousValue: 'Blue Cross Blue Shield',
      },
      {
        field: 'Member ID',
        committedValue: 'XGH882034591',
        previousValue: 'XJB-44213-09',
        confidence: 'high',
        sourceRegion: 'Card front, center left',
        resolution: 'replaced',
      },
      {
        field: 'Group #',
        committedValue: 'GRP1042',
        confidence: 'high',
        sourceRegion: 'Card front, center left',
      },
      {
        field: 'Plan type',
        committedValue: 'PPO',
        confidence: 'medium',
        sourceRegion: 'Card front, upper right',
      },
      {
        field: 'RxBIN',
        committedValue: '003858',
        confidence: 'high',
        sourceRegion: 'Card front, lower right',
        resolution: 'new',
      },
      {
        field: 'Payer phone',
        committedValue: '1-800-521-2227',
        confidence: 'low',
        sourceRegion: 'Card back, top',
      },
    ],
  },
}
