const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.resolve(__dirname, '../patients.json'), 'utf-8').replace(/^﻿/, '');
const patients = JSON.parse(raw);

// Remove if already present
const existing = patients.findIndex(p => p.mrn === '00731649');
if (existing >= 0) patients.splice(existing, 1);

const robert = {
  mrn: '00731649',
  first_name: 'Robert',
  last_name: 'Hernandez',
  preferred_name: null,
  sex: 'M',
  dob: '1958-02-18',
  age: 68,
  pediatric: false,
  status: 'Active',
  preferred_language: 'English',
  pronouns: 'he/him',
  address: { street: '4521 Lake Shore Ave', city: 'Oakland', state: 'CA', zip: '94610' },
  phone: '(510) 555-0191',
  email: 'r.hernandez@em.co',
  marital_status: 'Married',
  employer: 'Retired',
  emergency_contact: { name: 'Elena Hernandez', relationship: 'Spouse', phone: '510-555-0142' },
  primary_department: 'Cardiology',
  pcp_name: 'Dr. Sandra Okafor',
  pcp_provider_id: 'pcp_okafor',
  primary_provider_name: 'Dr. Marcus Bell, MD',
  primary_provider_id: 'cardio_bell',
  last_seen: '2026-04-12',
  registration_date: '2021-01-15',
  modified_by_type: null,
  modified_by_agent_name: null,
  modified_at: null,
  insurances: [
    {
      slot: 'primary',
      payer_name: 'Medicare Part A/B',
      payer_short: 'Medicare',
      member_id: 'MED-1H9-73164',
      group_number: null,
      eligibility_status: 'Active',
      last_verified_at: '2026-05-17',
      verified_by_type: 'agent',
      verified_by_agent_name: 'Eligibility Agent',
      effective_start: '2023-02-01',
      effective_end: null
    },
    {
      slot: 'secondary',
      payer_name: 'BCBS Medigap Supplement',
      payer_short: 'BCBS Medigap',
      member_id: 'BGS-44298-RH',
      group_number: 'GRP7741',
      eligibility_status: 'Active',
      last_verified_at: '2026-05-17',
      verified_by_type: 'agent',
      verified_by_agent_name: 'Eligibility Agent',
      effective_start: '2023-02-01',
      effective_end: null
    }
  ],
  allergies: [
    {
      substance: 'Penicillins',
      reaction: 'Rash, urticaria',
      severity: 'Moderate',
      year_identified: 2005,
      active: true,
      modified_by_type: 'human',
      modified_by_agent_name: null
    },
    {
      substance: 'ACE inhibitor',
      reaction: 'Angioedema',
      severity: 'Severe',
      year_identified: 2021,
      active: true,
      modified_by_type: 'human',
      modified_by_agent_name: null
    }
  ],
  problems: [
    { name: 'Heart failure with reduced EF (HFrEF)', icd10: 'I50.22', status: 'Active', department: 'cardiology', onset_year: 2021, modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { name: 'Coronary artery disease, native vessel (s/p PCI LAD 2019)', icd10: 'I25.10', status: 'Stable', department: 'cardiology', onset_year: 2019, modified_by_type: 'human', modified_by_agent_name: null },
    { name: 'Paroxysmal atrial fibrillation', icd10: 'I48.0', status: 'Active', department: 'cardiology', onset_year: 2022, modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { name: 'Essential hypertension', icd10: 'I10', status: 'Stable', department: 'cardiology', onset_year: 2014, modified_by_type: 'human', modified_by_agent_name: null },
    { name: 'Hyperlipidemia', icd10: 'E78.5', status: 'Stable', department: 'cardiology', onset_year: 2014, modified_by_type: 'human', modified_by_agent_name: null },
    { name: 'Type 2 diabetes mellitus', icd10: 'E11.9', status: 'Stable', department: 'cardiology', onset_year: 2016, modified_by_type: 'human', modified_by_agent_name: null }
  ],
  medications: [
    { name: 'Sacubitril/valsartan', dose: '49/51 mg', frequency: 'BID', indication: 'HFrEF (ARNI)', prescribing_provider: 'Dr. Bell', started_year: 2023, active: true, modified_by_type: 'human', modified_by_agent_name: null },
    { name: 'Metoprolol succinate', dose: '100 mg', frequency: 'QD', indication: 'HFrEF (beta-blocker)', prescribing_provider: 'Dr. Bell', started_year: 2021, active: true, modified_by_type: 'human', modified_by_agent_name: null },
    { name: 'Spironolactone', dose: '25 mg', frequency: 'QD', indication: 'HFrEF (MRA)', prescribing_provider: 'Dr. Bell', started_year: 2022, active: true, modified_by_type: 'human', modified_by_agent_name: null },
    { name: 'Empagliflozin', dose: '10 mg', frequency: 'QD', indication: 'HFrEF (SGLT2i)', prescribing_provider: 'Dr. Bell', started_year: 2023, active: true, modified_by_type: 'human', modified_by_agent_name: null },
    { name: 'Apixaban', dose: '5 mg', frequency: 'BID', indication: 'AFib anticoagulation', prescribing_provider: 'Dr. Bell', started_year: 2022, active: true, modified_by_type: 'human', modified_by_agent_name: null },
    { name: 'Atorvastatin', dose: '80 mg', frequency: 'QHS', indication: 'Hyperlipidemia (statin)', prescribing_provider: 'Dr. Okafor', started_year: 2014, active: true, modified_by_type: 'human', modified_by_agent_name: null },
    { name: 'Furosemide', dose: '20 mg', frequency: 'QD PRN', indication: 'Volume management', prescribing_provider: 'Dr. Bell', started_year: 2021, active: true, modified_by_type: 'human', modified_by_agent_name: null },
    { name: 'Metformin', dose: '1000 mg', frequency: 'BID', indication: 'T2DM', prescribing_provider: 'Dr. Okafor', started_year: 2016, active: true, modified_by_type: 'human', modified_by_agent_name: null },
    { name: 'Aspirin', dose: '81 mg', frequency: 'QD', indication: 'CAD/post-PCI', prescribing_provider: 'Dr. Bell', started_year: 2019, active: true, modified_by_type: 'human', modified_by_agent_name: null }
  ],
  encounters: [
    { encounter_date: '2026-04-12', visit_type: 'Cardiology follow-up', department: 'cardiology', provider_name: 'Dr. Marcus Bell, MD', summary: 'HFrEF stable, EF up to 38%, continue GDMT, plan Entresto uptitration.', status: 'complete', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { encounter_date: '2026-03-04', visit_type: 'Device interrogation', department: 'cardiology', provider_name: 'Dr. Lena Pradhan, MD', summary: 'Leads stable, AF burden 6%, no therapies delivered.', status: 'complete', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { encounter_date: '2025-11-20', visit_type: 'Cardiology follow-up', department: 'cardiology', provider_name: 'Dr. Marcus Bell, MD', summary: 'Euvolemic, continue regimen.', status: 'complete', modified_by_type: 'human', modified_by_agent_name: null },
    { encounter_date: '2025-08-15', visit_type: 'Cardiology follow-up', department: 'cardiology', provider_name: 'Dr. Marcus Bell, MD', summary: 'NT-proBNP improving, uptitration tolerated well.', status: 'complete', modified_by_type: 'human', modified_by_agent_name: null },
    { encounter_date: '2025-05-10', visit_type: 'Lab review', department: 'cardiology', provider_name: 'Dr. Sandra Okafor', summary: 'HbA1c at goal, LDL well-controlled on atorvastatin 80.', status: 'complete', modified_by_type: 'human', modified_by_agent_name: null },
    { encounter_date: '2025-02-18', visit_type: 'Cardiology follow-up', department: 'cardiology', provider_name: 'Dr. Marcus Bell, MD', summary: 'Echo: EF 33%, continue GDMT optimization.', status: 'complete', modified_by_type: 'human', modified_by_agent_name: null },
    { encounter_date: '2024-11-12', visit_type: 'Device follow-up', department: 'cardiology', provider_name: 'Dr. Lena Pradhan, MD', summary: 'Device check: appropriate sensing and pacing, AF burden 8%.', status: 'complete', modified_by_type: 'human', modified_by_agent_name: null },
    { encounter_date: '2024-08-20', visit_type: 'Cardiology follow-up', department: 'cardiology', provider_name: 'Dr. Marcus Bell, MD', summary: 'Echo: EF 32%, tolerating SGLT2i and MRA.', status: 'complete', modified_by_type: 'human', modified_by_agent_name: null },
    { encounter_date: '2023-06-23', visit_type: 'ICD implant follow-up', department: 'cardiology', provider_name: 'Dr. Lena Pradhan, MD', summary: 'Post-implant check: ICD functioning well, healing without complications.', status: 'complete', modified_by_type: 'human', modified_by_agent_name: null }
  ],
  imaging_studies: [
    { study_name: 'Echocardiogram', study_date: '2026-04-12', finding: 'LVEF 38%, mild MR, mild LA enlargement, no significant valvular stenosis, RVSP 34 mmHg.', department: 'cardiology', status: 'complete', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { study_name: 'Chest X-ray', study_date: '2026-04-12', finding: 'Mild cardiomegaly, no acute pulmonary process, no pleural effusion.', department: 'cardiology', status: 'complete', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { study_name: 'Cardiac catheterization', study_date: '2019-03-14', finding: 'LAD 90% stenosis, DES placed; RCA 40%, medical management continued.', department: 'cardiology', status: 'complete', modified_by_type: 'human', modified_by_agent_name: null }
  ],
  seizure_events: [],
  care_team: [
    { name: 'Dr. Marcus Bell, MD', role: 'Cardiologist', relationship: 'Attending' },
    { name: 'Dr. Lena Pradhan, MD', role: 'Electrophysiologist', relationship: 'Device specialist' },
    { name: 'Dr. Sandra Okafor', role: 'Primary care physician', relationship: 'PCP' }
  ],
  upcoming_appointment: null,
  reconciliation_prompts: [
    {
      type: 'ef-reconciliation',
      agent_name: 'Documentation Agent',
      created_at: '2026-04-03',
      message: 'Outside echocardiogram (Bay Imaging, 04/02/2026) received via fax. Reported LVEF 38% vs charted 35% (12/2025). Documentation Agent updated the charted EF. Confirm reconciliation.',
      resolved: false
    }
  ],
  lab_results: [
    { test_name: 'NT-proBNP', value: '3200', unit: 'pg/mL', ref_range: '<450', flag: 'High', resulted_at: '2024-06-01', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { test_name: 'NT-proBNP', value: '1850', unit: 'pg/mL', ref_range: '<450', flag: 'High', resulted_at: '2024-09-01', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { test_name: 'NT-proBNP', value: '1200', unit: 'pg/mL', ref_range: '<450', flag: 'High', resulted_at: '2025-01-15', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { test_name: 'NT-proBNP', value: '910', unit: 'pg/mL', ref_range: '<450', flag: 'High', resulted_at: '2025-07-10', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { test_name: 'NT-proBNP', value: '740', unit: 'pg/mL', ref_range: '<450', flag: 'High, improving', resulted_at: '2026-04-12', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { test_name: 'hs-Troponin T', value: '14', unit: 'ng/L', ref_range: '<22', flag: 'Normal', resulted_at: '2026-04-12', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { test_name: 'LDL-C', value: '62', unit: 'mg/dL', ref_range: '<70 (goal)', flag: 'At goal', resulted_at: '2026-04-12', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { test_name: 'HDL-C', value: '44', unit: 'mg/dL', ref_range: '>40', flag: 'Normal', resulted_at: '2026-04-12', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { test_name: 'Triglycerides', value: '150', unit: 'mg/dL', ref_range: '<150', flag: 'Borderline', resulted_at: '2026-04-12', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { test_name: 'HbA1c', value: '6.8', unit: '%', ref_range: '<7.0', flag: 'At goal', resulted_at: '2026-04-12', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { test_name: 'Potassium', value: '4.6', unit: 'mmol/L', ref_range: '3.5-5.1', flag: 'Normal', resulted_at: '2026-04-12', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { test_name: 'Creatinine / eGFR', value: '1.2 / 62', unit: 'mg/dL / mL/min', ref_range: 'eGFR >60', flag: 'Normal', resulted_at: '2026-04-12', modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' }
  ],
  cardiac_studies: [
    { study_type: 'echo', performed_at: '2021-10-15', summary: 'LVEF 40%, mild LV dilation.', lvef: 40, modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { study_type: 'echo', performed_at: '2022-06-20', summary: 'LVEF 38%, worsening LV function.', lvef: 38, modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { study_type: 'echo', performed_at: '2023-02-14', summary: 'LVEF 28%, significant reduction. GDMT uptitration initiated.', lvef: 28, modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { study_type: 'echo', performed_at: '2023-09-12', summary: 'LVEF 32%, early response to GDMT.', lvef: 32, modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { study_type: 'echo', performed_at: '2024-05-08', summary: 'LVEF 33%, continued mild improvement.', lvef: 33, modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { study_type: 'echo', performed_at: '2025-11-14', summary: 'LVEF 35%, mild improvement.', lvef: 35, modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { study_type: 'echo', performed_at: '2026-04-12', summary: 'LVEF 38%, mild MR, mild LA enlargement, no significant stenosis, RVSP 34 mmHg.', lvef: 38, modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { study_type: 'ecg', performed_at: '2026-04-12', summary: 'Sinus rhythm 68 bpm, 1st-degree AV block, old anteroseptal infarct, QTc 448 ms.', lvef: null, modified_by_type: 'agent', modified_by_agent_name: 'Documentation Agent' },
    { study_type: 'cath', performed_at: '2019-03-14', summary: 'LAD 90% → DES placed; RCA 40%, medical management.', lvef: null, modified_by_type: 'human', modified_by_agent_name: null }
  ],
  devices: [
    {
      device_type: 'Dual-chamber ICD',
      implanted_at: '2023-06-14',
      last_interrogation_at: '2026-03-04',
      battery_status: 'OK (~5 yr remaining)',
      af_burden_pct: 6,
      therapies_delivered: 0,
      physician: 'Dr. Lena Pradhan, MD',
      modified_by_type: 'agent',
      modified_by_agent_name: 'Device Agent'
    }
  ],
  risk_scores: [
    {
      name: 'cha2ds2vasc',
      display_name: 'CHA₂DS₂-VASc',
      value: 5,
      severity: 'high',
      computed_at: '2026-04-12',
      inputs: [
        { label: 'Congestive heart failure (C)', value: 1 },
        { label: 'Hypertension (H)', value: 1 },
        { label: 'Age 65–74 (A₂)', value: 1 },
        { label: 'Diabetes mellitus (D)', value: 1 },
        { label: 'Vascular disease / CAD (V)', value: 1 },
        { label: 'Stroke / TIA / thromboembolism (S₂)', value: 0 },
        { label: 'Sex category male (Sc)', value: 0 }
      ],
      agent_name: 'Cardiology Summary Agent',
      model_version: 'v1.0'
    },
    {
      name: 'hasbled',
      display_name: 'HAS-BLED',
      value: 2,
      severity: 'moderate',
      computed_at: '2026-04-12',
      inputs: [
        { label: 'Hypertension uncontrolled (H)', value: 0 },
        { label: 'Abnormal renal/liver function (A)', value: 0 },
        { label: 'Stroke history (S)', value: 0 },
        { label: 'Bleeding history/predisposition (B)', value: 0 },
        { label: 'Labile INR (L)', value: 0 },
        { label: 'Elderly >65 (E)', value: 1 },
        { label: 'Drugs/alcohol (concomitant antiplatelet) (D)', value: 1 }
      ],
      agent_name: 'Cardiology Summary Agent',
      model_version: 'v1.0'
    }
  ],
  vital_signs: [
    { taken_at: '2025-11-01', systolic: 138, diastolic: 82, hr: 74, source: 'clinic' },
    { taken_at: '2025-12-01', systolic: 132, diastolic: 80, hr: 72, source: 'clinic' },
    { taken_at: '2026-01-10', systolic: 130, diastolic: 78, hr: 70, source: 'clinic' },
    { taken_at: '2026-02-14', systolic: 134, diastolic: 80, hr: 71, source: 'clinic' },
    { taken_at: '2026-03-04', systolic: 128, diastolic: 76, hr: 68, source: 'clinic' },
    { taken_at: '2026-04-12', systolic: 126, diastolic: 75, hr: 66, source: 'clinic' }
  ],
  agent_observations: [
    {
      category: 'summary',
      title: 'Cardiology summary',
      detail: 'HFrEF on 4-pillar GDMT, EF recovered 28→38%. AFib rate-controlled, anticoagulated (CHA₂DS₂-VASc 5). 2 optimization items flagged below.',
      agent_name: 'Cardiology Summary Agent',
      confidence: 'high',
      computed_at: '2026-04-12',
      why_rationale: 'Summary derived from echocardiogram trend, medication list, and risk score computation. EF improvement from nadir of 28% to current 38% represents partial recovery on GDMT.',
      why_inputs: ['Echo 04/2026: LVEF 38%', 'GDMT: ARNI, beta-blocker, MRA, SGLT2i', 'CHA₂DS₂-VASc: 5 (high)', 'Apixaban: active anticoagulation'],
      dismissed: false
    },
    {
      category: 'rhythm',
      title: 'Current rhythm',
      detail: 'Paroxysmal AFib, presently sinus on last ECG',
      agent_name: 'Documentation Agent',
      confidence: 'high',
      computed_at: '2026-04-12',
      why_rationale: 'ECG 04/12/2026 shows sinus rhythm. Known paroxysmal AFib on problem list.',
      why_inputs: ['ECG 04/12/2026: Sinus rhythm 68 bpm'],
      dismissed: false
    },
    {
      category: 'gdmt-flag',
      title: 'ARNI sub-target — uptitration opportunity',
      detail: 'Sacubitril/valsartan at 49/51 mg BID; target 97/103 mg BID. Current BP 126/75, K⁺ 4.6 mmol/L, eGFR 62 — all permit uptitration.',
      agent_name: 'GDMT Agent',
      confidence: 'high',
      computed_at: '2026-04-12',
      why_rationale: 'PARADIGM-HF target dose is 97/103 mg BID. Patient is currently at 49/51 mg BID (sub-target). Hemodynamic and metabolic parameters are within safe range for uptitration.',
      why_inputs: ['Current dose: sacubitril/valsartan 49/51 mg BID', 'Target dose: 97/103 mg BID (PARADIGM-HF)', 'BP 126/75 mmHg (permits uptitration >= 120 systolic)', 'K+ 4.6 mmol/L (safe range <= 5.0)', 'eGFR 62 mL/min (acceptable >= 30)'],
      dismissed: false
    },
    {
      category: 'gdmt-flag',
      title: 'Aspirin + DOAC — consider discontinuing ASA',
      detail: 'Patient is on ASA 81 mg + apixaban, >12 months post-PCI (2019). Current evidence supports discontinuing ASA to reduce bleeding risk (HAS-BLED contributor).',
      agent_name: 'GDMT Agent',
      confidence: 'medium',
      computed_at: '2026-04-12',
      why_rationale: 'AHA/ACC guidelines (2023) suggest that beyond 12 months post-PCI in patients on anticoagulation for AFib, dual antithrombotic therapy does not reduce ischemic events but increases bleeding. ASA discontinuation is recommended.',
      why_inputs: ['Apixaban 5 mg BID: active anticoagulation for AFib', 'ASA 81 mg QD: post-PCI (2019, >12 months ago)', 'HAS-BLED: 2 (antiplatelet counts as 1 point)', 'AHA/ACC 2023 guideline recommendation'],
      dismissed: false
    }
  ]
};

patients.push(robert);
fs.writeFileSync(path.resolve(__dirname, '../patients.json'), JSON.stringify(patients, null, 2));
console.log('Added Robert Hernandez. Total patients:', patients.length);
