/*
 * add-cardiac-data.js — backfills a cardiology dataset onto every patient in
 * patients.json so the Cardiology view renders for all of them (not just the
 * curated Robert Hernandez showcase). Data is deterministic per-MRN (re-runnable
 * with identical output) and age-scaled so profiles stay clinically plausible.
 *
 * Shape mirrors scripts/add-robert-hernandez.js and is consumed by
 * scripts/seed-mock-patients.ts. After running this, reseed with:
 *   npm run seed:mock-patients
 */
const fs = require('fs')
const path = require('path')

const JSON_PATH = path.resolve(__dirname, '../patients.json')

// --- deterministic RNG seeded from the MRN ---------------------------------
function makeRng(seed) {
  let s = 0
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0
  if (s === 0) s = 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}
const ri = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)]
const round = (n) => Math.round(n)

const CARDIOLOGISTS = [
  'Dr. Marcus Bell, MD',
  'Dr. Aisha Rahman, MD',
  'Dr. David Cho, MD',
  'Dr. Sofia Marin, MD',
  'Dr. James Whitfield, MD',
  'Dr. Priya Nair, MD',
]
const EP_DOCS = ['Dr. Lena Pradhan, MD', 'Dr. Omar Haddad, MD', 'Dr. Grace Lin, MD']
const DOC_AGENT = 'Documentation Agent'

// Shift an ISO date string (YYYY-MM-DD) by a number of months back from anchor.
const ANCHOR = new Date('2026-04-15T00:00:00Z')
function monthsAgo(n) {
  const d = new Date(ANCHOR)
  d.setUTCMonth(d.getUTCMonth() - n)
  return d.toISOString().slice(0, 10)
}
function yearsAgo(n) {
  const d = new Date(ANCHOR)
  d.setUTCFullYear(d.getUTCFullYear() - n)
  return d.toISOString().slice(0, 10)
}

function buildCardiac(patient) {
  const rng = makeRng(patient.mrn)
  const age = patient.age ?? 50
  const sex = patient.sex === 'F' ? 'F' : 'M'
  const pediatric = patient.pediatric || age < 18
  const cardiologist = pick(rng, CARDIOLOGISTS)

  // --- EF / archetype ------------------------------------------------------
  // Pediatric & young patients trend toward preserved EF; older patients have a
  // chance of reduced EF (HFrEF) which unlocks the richer GDMT/device content.
  let efCurrent
  let archetype
  if (pediatric) {
    efCurrent = ri(rng, 58, 66)
    archetype = 'preserved'
  } else {
    const roll = rng()
    if (age >= 60 && roll < 0.45) {
      efCurrent = ri(rng, 28, 42)
      archetype = 'hfref'
    } else if (roll < 0.35) {
      efCurrent = ri(rng, 45, 52)
      archetype = 'borderline'
    } else {
      efCurrent = ri(rng, 55, 64)
      archetype = 'preserved'
    }
  }
  const isHf = archetype === 'hfref'
  const afib = !pediatric && (isHf ? rng() < 0.6 : rng() < 0.25)

  // --- vital signs (6 monthly clinic readings) -----------------------------
  const sysBase = pediatric ? ri(rng, 100, 115) : ri(rng, 118, 145)
  const diaBase = pediatric ? ri(rng, 60, 72) : ri(rng, 72, 90)
  const hrBase = pediatric ? ri(rng, 72, 92) : ri(rng, 58, 84)
  const vital_signs = []
  for (let i = 5; i >= 0; i--) {
    const drift = (5 - i) // gentle downward control trend
    vital_signs.push({
      taken_at: monthsAgo(i),
      systolic: round(sysBase - drift * ri(rng, 0, 2)),
      diastolic: round(diaBase - drift * ri(rng, 0, 1)),
      hr: round(hrBase + ri(rng, -3, 3)),
      source: 'clinic',
    })
  }

  // --- echo series → EF trend ---------------------------------------------
  const nEchos = pediatric ? 2 : ri(rng, 3, 5)
  const efStart = isHf ? Math.max(22, efCurrent - ri(rng, 6, 14)) : efCurrent - ri(rng, 0, 4)
  const cardiac_studies = []
  for (let i = 0; i < nEchos; i++) {
    const frac = nEchos === 1 ? 1 : i / (nEchos - 1)
    const ef = round(efStart + (efCurrent - efStart) * frac)
    const yearsBack = round((nEchos - 1 - i) * 1.1)
    const summary = isHf
      ? `LVEF ${ef}%${i === 0 ? ', reduced systolic function' : i === nEchos - 1 ? ', response to GDMT' : ', interval change'}.`
      : archetype === 'borderline'
      ? `LVEF ${ef}%, low-normal systolic function.`
      : `LVEF ${ef}%, preserved systolic function, no significant valvular disease.`
    cardiac_studies.push({
      study_type: 'echo',
      performed_at: yearsAgo(yearsBack),
      summary,
      lvef: ef,
      modified_by_type: 'agent',
      modified_by_agent_name: DOC_AGENT,
    })
  }
  // most recent ECG
  cardiac_studies.push({
    study_type: 'ecg',
    performed_at: monthsAgo(0),
    summary: afib
      ? `Atrial fibrillation, ventricular rate ${ri(rng, 68, 96)} bpm, no acute ST changes.`
      : `Sinus rhythm ${ri(rng, 60, 80)} bpm, normal axis, no acute ischemic changes.`,
    lvef: null,
    modified_by_type: 'agent',
    modified_by_agent_name: DOC_AGENT,
  })
  if (!pediatric && (isHf || rng() < 0.25)) {
    cardiac_studies.push({
      study_type: 'cath',
      performed_at: yearsAgo(ri(rng, 2, 7)),
      summary: pick(rng, [
        'LAD 80% → DES placed; remaining vessels without significant disease.',
        'Non-obstructive coronary disease, medical management.',
        'RCA 70% lesion, DES placed; preserved LV function.',
      ]),
      lvef: null,
      modified_by_type: 'human',
      modified_by_agent_name: null,
    })
  }

  // --- labs ----------------------------------------------------------------
  const today = monthsAgo(0)
  const lab_results = [
    { test_name: 'LDL-C', value: String(ri(rng, 55, 130)), unit: 'mg/dL', ref_range: '<100', flag: null, resulted_at: today },
    { test_name: 'HDL-C', value: String(ri(rng, 38, 62)), unit: 'mg/dL', ref_range: '>40', flag: null, resulted_at: today },
    { test_name: 'Triglycerides', value: String(ri(rng, 80, 210)), unit: 'mg/dL', ref_range: '<150', flag: null, resulted_at: today },
    { test_name: 'Potassium', value: (ri(rng, 36, 50) / 10).toFixed(1), unit: 'mmol/L', ref_range: '3.5-5.1', flag: 'Normal', resulted_at: today },
    { test_name: 'Creatinine / eGFR', value: `${(ri(rng, 7, 14) / 10).toFixed(1)} / ${ri(rng, 55, 95)}`, unit: 'mg/dL / mL/min', ref_range: 'eGFR >60', flag: null, resulted_at: today },
  ].map((r) => ({ ...r, flag: r.flag ?? 'Normal', modified_by_type: 'agent', modified_by_agent_name: DOC_AGENT }))

  // NT-proBNP series — elevated & improving for HFrEF, single normal otherwise.
  const ntProBnpTrend = []
  if (isHf) {
    let v = ri(rng, 2200, 4200)
    for (let i = 4; i >= 0; i--) {
      ntProBnpTrend.push({
        test_name: 'NT-proBNP',
        value: String(round(v)),
        unit: 'pg/mL',
        ref_range: '<450',
        flag: i === 0 ? 'High, improving' : 'High',
        resulted_at: monthsAgo(i * 4),
        modified_by_type: 'agent',
        modified_by_agent_name: DOC_AGENT,
      })
      v *= 0.7 // improving toward the present
    }
    lab_results.push(...ntProBnpTrend)
    lab_results.push({ test_name: 'hs-Troponin T', value: String(ri(rng, 6, 20)), unit: 'ng/L', ref_range: '<22', flag: 'Normal', resulted_at: today, modified_by_type: 'agent', modified_by_agent_name: DOC_AGENT })
  } else if (!pediatric) {
    lab_results.push({ test_name: 'NT-proBNP', value: String(ri(rng, 40, 240)), unit: 'pg/mL', ref_range: '<450', flag: 'Normal', resulted_at: today, modified_by_type: 'agent', modified_by_agent_name: DOC_AGENT })
  }

  // --- risk scores ---------------------------------------------------------
  const risk_scores = []
  if (!pediatric) {
    // CHA2DS2-VASc
    const c = isHf ? 1 : 0
    const h = sysBase >= 130 ? 1 : 0
    const a2 = age >= 75 ? 2 : age >= 65 ? 1 : 0
    const d = rng() < 0.25 ? 1 : 0
    const v = cardiac_studies.some((s) => s.study_type === 'cath') ? 1 : 0
    const sc = sex === 'F' ? 1 : 0
    const cha = c + h + a2 + d + v + sc
    risk_scores.push({
      name: 'cha2ds2vasc',
      display_name: 'CHA₂DS₂-VASc',
      value: cha,
      severity: cha >= 4 ? 'high' : cha >= 2 ? 'moderate' : 'low',
      computed_at: today,
      inputs: [
        { label: 'Congestive heart failure (C)', value: c },
        { label: 'Hypertension (H)', value: h },
        { label: age >= 75 ? 'Age ≥75 (A₂)' : 'Age 65–74 (A₂)', value: a2 },
        { label: 'Diabetes mellitus (D)', value: d },
        { label: 'Vascular disease (V)', value: v },
        { label: 'Sex category female (Sc)', value: sc },
      ],
      agent_name: 'Cardiology Summary Agent',
      model_version: 'v1.0',
    })
    // ASCVD 10-year risk
    const ascvd = Math.min(39, round((age - 40) * 0.45 + (sysBase - 120) * 0.2 + (isHf ? 6 : 0) + ri(rng, 0, 5)))
    if (ascvd > 0) {
      risk_scores.push({
        name: 'ascvd',
        display_name: 'ASCVD 10-yr',
        value: ascvd,
        severity: ascvd >= 20 ? 'high' : ascvd >= 7 ? 'moderate' : 'low',
        computed_at: today,
        inputs: [
          { label: 'Age', value: age },
          { label: 'Systolic BP', value: sysBase },
          { label: 'Total cholesterol / HDL', value: 1 },
          { label: 'Smoker', value: 0 },
        ],
        agent_name: 'Cardiology Summary Agent',
        model_version: 'v1.0',
      })
    }
  }

  // --- device (older HFrEF only) ------------------------------------------
  const devices = []
  if (isHf && age >= 55 && efCurrent <= 35 && rng() < 0.7) {
    devices.push({
      device_type: pick(rng, ['Dual-chamber ICD', 'CRT-D', 'Single-chamber ICD']),
      implanted_at: yearsAgo(ri(rng, 1, 4)),
      last_interrogation_at: monthsAgo(ri(rng, 1, 3)),
      battery_status: pick(rng, ['OK (~5 yr remaining)', 'OK (~3 yr remaining)', 'OK (~6 yr remaining)']),
      af_burden_pct: afib ? ri(rng, 3, 22) : ri(rng, 0, 3),
      therapies_delivered: rng() < 0.85 ? 0 : ri(rng, 1, 2),
      physician: pick(rng, EP_DOCS),
      modified_by_type: 'agent',
      modified_by_agent_name: 'Device Agent',
    })
  }

  // --- agent observations --------------------------------------------------
  const agent_observations = []
  const efText = isHf
    ? `HFrEF, EF ${efStart}→${efCurrent}% on GDMT.`
    : archetype === 'borderline'
    ? `Low-normal LV systolic function (EF ${efCurrent}%).`
    : `Preserved LV systolic function (EF ${efCurrent}%).`
  agent_observations.push({
    category: 'summary',
    title: 'Cardiology summary',
    detail: `${efText} ${afib ? 'Paroxysmal AFib, ' : 'Sinus rhythm, '}${isHf ? 'optimizing 4-pillar therapy.' : 'routine cardiology follow-up.'}`,
    agent_name: 'Cardiology Summary Agent',
    confidence: isHf ? 'high' : 'medium',
    computed_at: today,
    why_rationale: 'Summary derived from echocardiogram trend, rhythm assessment, medication list, and risk score computation.',
    why_inputs: [
      `Echo ${today.slice(0, 7)}: LVEF ${efCurrent}%`,
      afib ? 'ECG: atrial fibrillation' : 'ECG: sinus rhythm',
      ...(risk_scores[0] ? [`${risk_scores[0].display_name}: ${risk_scores[0].value} (${risk_scores[0].severity})`] : []),
    ],
    dismissed: false,
  })
  agent_observations.push({
    category: 'rhythm',
    title: 'Current rhythm',
    detail: afib ? 'Paroxysmal atrial fibrillation' : 'Normal sinus rhythm',
    agent_name: DOC_AGENT,
    confidence: 'high',
    computed_at: today,
    why_rationale: `Most recent ECG (${today}) interpretation.`,
    why_inputs: [afib ? `ECG ${today}: atrial fibrillation` : `ECG ${today}: sinus rhythm`],
    dismissed: false,
  })
  if (isHf) {
    agent_observations.push({
      category: 'gdmt-flag',
      title: 'GDMT optimization opportunity',
      detail: 'Beta-blocker / ARNI below target dose; hemodynamics and labs permit uptitration.',
      agent_name: 'GDMT Agent',
      confidence: 'high',
      computed_at: today,
      why_rationale: 'Guideline-directed medical therapy targets not yet reached; BP, potassium, and eGFR are within safe range for uptitration.',
      why_inputs: ['Current dose below guideline target', `BP ${vital_signs[5].systolic}/${vital_signs[5].diastolic} mmHg`, 'K+ and eGFR within safe range'],
      dismissed: false,
    })
  }

  return {
    cardiologist,
    lab_results,
    cardiac_studies,
    devices,
    risk_scores,
    vital_signs,
    agent_observations,
  }
}

function main() {
  const raw = fs.readFileSync(JSON_PATH, 'utf-8').replace(/^﻿/, '')
  const patients = JSON.parse(raw)

  let updated = 0
  let skipped = 0
  for (const p of patients) {
    if (Array.isArray(p.cardiac_studies) && p.cardiac_studies.length > 0) {
      skipped++ // preserve curated patients (e.g. Robert Hernandez)
      continue
    }
    const c = buildCardiac(p)
    p.lab_results = [...(p.lab_results ?? []), ...c.lab_results]
    p.cardiac_studies = c.cardiac_studies
    p.devices = c.devices
    p.risk_scores = c.risk_scores
    p.vital_signs = c.vital_signs
    p.agent_observations = c.agent_observations
    updated++
  }

  fs.writeFileSync(JSON_PATH, JSON.stringify(patients, null, 2))
  console.log(`Cardiac backfill complete: ${updated} updated, ${skipped} preserved (already had cardiac data).`)
}

main()
