import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'

const adapter = new PrismaBetterSqlite3({ url: 'file:./synapse.db' })
const prisma = new PrismaClient({ adapter })

interface RawPatient {
  mrn: string
  first_name: string
  last_name: string
  preferred_name: string | null
  sex: string
  dob: string
  age: number
  pediatric: boolean
  status: string
  preferred_language: string | null
  pronouns: string | null
  address: { street: string; city: string; state: string; zip: string }
  phone: string | null
  email: string | null
  marital_status: string | null
  employer: string | null
  emergency_contact: { name: string; relationship: string; phone: string } | null
  primary_department: string
  pcp_name: string | null
  pcp_provider_id: string | null
  primary_provider_name: string | null
  primary_provider_id: string | null
  last_seen: string | null
  registration_date: string | null
  modified_by_type: string | null
  modified_by_agent_name: string | null
  modified_at: string | null
  insurances: RawInsurance[]
  allergies: RawAllergy[]
  problems: RawProblem[]
  medications: RawMedication[]
  encounters: RawEncounter[]
  imaging_studies: RawImagingStudy[]
  seizure_events: RawSeizureEvent[]
  care_team: RawCareTeamMember[]
  upcoming_appointment: RawAppointment | null
  reconciliation_prompts: RawReconciliationPrompt[]
}

interface RawInsurance {
  slot: string
  payer_name: string
  payer_short: string
  member_id: string
  group_number: string
  eligibility_status: string
  last_verified_at: string | null
  verified_by_type: string | null
  verified_by_agent_name: string | null
  effective_start: string | null
  effective_end: string | null
}

interface RawAllergy {
  substance: string
  reaction: string | null
  severity: string | null
  year_identified: number | null
  active: boolean
  modified_by_type: string | null
  modified_by_agent_name: string | null
}

interface RawProblem {
  name: string
  icd10: string | null
  status: string
  department: string | null
  onset_year: number | null
  modified_by_type: string | null
  modified_by_agent_name: string | null
}

interface RawMedication {
  name: string
  dose: string | null
  frequency: string | null
  indication: string | null
  prescribing_provider: string | null
  started_year: number | null
  active: boolean
  modified_by_type: string | null
  modified_by_agent_name: string | null
}

interface RawEncounter {
  encounter_date: string | null
  visit_type: string | null
  department: string | null
  provider_name: string | null
  summary: string | null
  status: string | null
  modified_by_type: string | null
  modified_by_agent_name: string | null
}

interface RawImagingStudy {
  study_name: string | null
  study_date: string | null
  finding: string | null
  department: string | null
  status: string | null
  modified_by_type: string | null
  modified_by_agent_name: string | null
}

interface RawSeizureEvent {
  event_date: string | null
  duration_seconds: number | null
  type: string | null
  notes: string | null
}

interface RawCareTeamMember {
  name: string
  role: string | null
  relationship: string | null
}

interface RawAppointment {
  appointment_date: string | null
  appointment_time: string | null
  visit_type: string | null
  provider_name: string | null
  no_show_risk: string | null
}

interface RawReconciliationPrompt {
  type: string | null
  agent_name: string | null
  created_at: string | null
  message: string | null
  resolved: boolean
}

const PATIENTS_JSON = path.resolve(process.cwd(), 'patients.json')
const RESET = process.argv.includes('--reset')

async function main() {
  const raw = fs.readFileSync(PATIENTS_JSON, 'utf-8').replace(/^﻿/, '')
  const patients: RawPatient[] = JSON.parse(raw)

  if (RESET) {
    const mrns = patients.map((p) => p.mrn)
    const deleted = await prisma.patient.deleteMany({ where: { mrn: { in: mrns } } })
    console.log(`Reset: deleted ${deleted.count} patients (cascade-deleted all children)`)
    return
  }

  const mrns = patients.map((p) => p.mrn)
  await prisma.patient.deleteMany({ where: { mrn: { in: mrns } } })

  for (let i = 0; i < patients.length; i++) {
    const p = patients[i]

    await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          mrn: p.mrn,
          firstName: p.first_name,
          lastName: p.last_name,
          preferredName: p.preferred_name,
          sex: p.sex,
          dateOfBirth: p.dob,
          age: p.age,
          pediatric: p.pediatric ?? false,
          status: p.status ?? 'Active',
          preferredLanguage: p.preferred_language,
          pronouns: p.pronouns,
          addressStreet: p.address?.street,
          addressCity: p.address?.city,
          addressState: p.address?.state,
          addressZip: p.address?.zip,
          phone: p.phone,
          email: p.email,
          maritalStatus: p.marital_status,
          employer: p.employer,
          emergencyContactName: p.emergency_contact?.name,
          emergencyContactRelationship: p.emergency_contact?.relationship,
          emergencyContactPhone: p.emergency_contact?.phone,
          primaryDepartment: p.primary_department,
          pcpName: p.pcp_name,
          pcpProviderId: p.pcp_provider_id,
          primaryProviderName: p.primary_provider_name,
          primaryProviderId: p.primary_provider_id,
          lastSeenDate: p.last_seen,
          registrationDate: p.registration_date,
          modifiedByType: p.modified_by_type,
          modifiedByAgentName: p.modified_by_agent_name,
          modifiedAt: p.modified_at,
        },
      })

      const pid = patient.id

      if (p.insurances?.length) {
        await tx.patientInsurance.createMany({
          data: p.insurances.map((ins) => ({
            patientId: pid,
            slot: ins.slot,
            payerName: ins.payer_name,
            payerShort: ins.payer_short,
            memberId: ins.member_id,
            groupNumber: ins.group_number,
            eligibilityStatus: ins.eligibility_status ?? 'Active',
            lastVerifiedAt: ins.last_verified_at,
            verifiedByType: ins.verified_by_type,
            verifiedByAgentName: ins.verified_by_agent_name,
            effectiveStart: ins.effective_start,
            effectiveEnd: ins.effective_end,
          })),
        })
      }

      if (p.allergies?.length) {
        await tx.patientAllergy.createMany({
          data: p.allergies.map((a) => ({
            patientId: pid,
            substance: a.substance,
            reaction: a.reaction,
            severity: a.severity,
            yearIdentified: a.year_identified,
            active: a.active ?? true,
            modifiedByType: a.modified_by_type,
            modifiedByAgentName: a.modified_by_agent_name,
          })),
        })
      }

      if (p.problems?.length) {
        await tx.patientProblem.createMany({
          data: p.problems.map((pr) => ({
            patientId: pid,
            name: pr.name,
            icd10: pr.icd10,
            status: pr.status,
            department: pr.department,
            onsetYear: pr.onset_year,
            modifiedByType: pr.modified_by_type,
            modifiedByAgentName: pr.modified_by_agent_name,
          })),
        })
      }

      if (p.medications?.length) {
        await tx.patientMedication.createMany({
          data: p.medications.map((m) => ({
            patientId: pid,
            name: m.name,
            dose: m.dose,
            frequency: m.frequency,
            indication: m.indication,
            prescribingProvider: m.prescribing_provider,
            startedYear: m.started_year,
            active: m.active ?? true,
            modifiedByType: m.modified_by_type,
            modifiedByAgentName: m.modified_by_agent_name,
          })),
        })
      }

      if (p.encounters?.length) {
        await tx.patientEncounter.createMany({
          data: p.encounters.map((e) => ({
            patientId: pid,
            encounterDate: e.encounter_date,
            visitType: e.visit_type,
            department: e.department,
            providerName: e.provider_name,
            summary: e.summary,
            status: (e.status ?? 'complete').toLowerCase(),
            modifiedByType: e.modified_by_type,
            modifiedByAgentName: e.modified_by_agent_name,
          })),
        })
      }

      if (p.imaging_studies?.length) {
        await tx.patientImagingStudy.createMany({
          data: p.imaging_studies.map((img) => ({
            patientId: pid,
            studyName: img.study_name,
            studyDate: img.study_date,
            finding: img.finding,
            department: img.department,
            status: (img.status ?? 'complete').toLowerCase(),
            modifiedByType: img.modified_by_type,
            modifiedByAgentName: img.modified_by_agent_name,
          })),
        })
      }

      if (p.seizure_events?.length) {
        await tx.patientSeizureEvent.createMany({
          data: p.seizure_events.map((se) => ({
            patientId: pid,
            eventDate: se.event_date,
            durationSeconds: se.duration_seconds,
            type: se.type,
            notes: se.notes,
          })),
        })
      }

      if (p.care_team?.length) {
        await tx.patientCareTeamMember.createMany({
          data: p.care_team.map((ct) => ({
            patientId: pid,
            name: ct.name,
            role: ct.role,
            relationship: ct.relationship,
          })),
        })
      }

      if (p.upcoming_appointment) {
        const appt = p.upcoming_appointment
        await tx.patientAppointment.create({
          data: {
            patientId: pid,
            appointmentDate: appt.appointment_date,
            appointmentTime: appt.appointment_time,
            visitType: appt.visit_type,
            providerName: appt.provider_name,
            noShowRisk: appt.no_show_risk,
            status: 'Scheduled',
          },
        })
      }

      if (p.reconciliation_prompts?.length) {
        await tx.patientReconciliationPrompt.createMany({
          data: p.reconciliation_prompts.map((rp) => ({
            patientId: pid,
            type: rp.type,
            agentName: rp.agent_name,
            createdAt: rp.created_at,
            message: rp.message,
            resolved: rp.resolved ?? false,
          })),
        })
      }
    })

    console.log(`Seeded ${i + 1}/${patients.length} – ${p.first_name} ${p.last_name} (MRN ${p.mrn})`)
  }

  console.log(`\nDone. ${patients.length} patients seeded.`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
