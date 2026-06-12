import * as React from 'react'
import Link from 'next/link'
import { AuditStrip } from './audit-strip'
import { agentActionPayload } from '@/lib/explainability'
import type { ChartPatient, Insurance, Allergy, CareTeamMember, UpcomingAppointment } from '@/lib/types/chart'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
      {children}
    </p>
  )
}

function KvRow({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex justify-between border-b border-black/[0.06] py-1.5 last:border-0">
      <span className={`text-muted-foreground ${small ? 'text-[11px]' : 'text-[13px]'}`}>{label}</span>
      <span className={`text-right max-w-[55%] ${small ? 'text-[11px]' : 'text-[13px]'}`}>{value}</span>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-3.5 py-3">
      {children}
    </div>
  )
}

function formatDob(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// ------- Individual cards -------

function DemographicsCard({ patient }: { patient: ChartPatient }) {
  return (
    <Card>
      <SectionLabel>Demographics</SectionLabel>
      <KvRow label="Address" value={patient.address} small />
      <KvRow label="Phone" value={patient.phone} />
      <KvRow label="Email" value={patient.email} small />
      <KvRow label="Marital" value={patient.maritalStatus} />
      <KvRow label="Employer" value={patient.employer} small />
      <KvRow
        label="Emerg."
        value={`${patient.emergencyContact.name} (${patient.emergencyContact.relationship})`}
        small
      />
    </Card>
  )
}

const eligibilityDot: Record<Insurance['eligibility'], string> = {
  Active: '● Active',
  Inactive: '● Inactive',
  Pending: '● Pending',
  Error: '● Error',
}

const eligibilityColors: Record<Insurance['eligibility'], string> = {
  Active: 'text-chart-success-text bg-chart-success-bg',
  Inactive: 'text-chart-danger-text bg-chart-danger-bg',
  Pending: 'text-chart-neutral-text bg-chart-neutral-bg',
  Error: 'text-chart-warning-text bg-chart-warning-bg',
}

function InsuranceCard({ insurance, mrn }: { insurance: Insurance; mrn: string }) {
  return (
    <Card>
      <SectionLabel>Insurance</SectionLabel>
      <p className="text-[13px] font-medium">{insurance.name}</p>
      <p className="text-[11px] text-muted-foreground">Mem {insurance.memberId}</p>
      <span
        className={`mt-1.5 inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium ${eligibilityColors[insurance.eligibility]}`}
      >
        {eligibilityDot[insurance.eligibility]}
      </span>
      {insurance.modifiedByType === 'agent' && (
        <AuditStrip
          modifiedByType={insurance.modifiedByType}
          modifiedByAgentName={insurance.modifiedByAgentName}
          modifiedAt={insurance.modifiedAt}
          explainability={agentActionPayload({
            agentName: insurance.modifiedByAgentName || 'Eligibility Agent',
            timestamp: insurance.modifiedAt,
            title: 'Insurance eligibility verified',
            actionSummary: `Verified ${insurance.name} coverage with the payer; eligibility returned ${insurance.eligibility}.`,
            patientMrn: mrn,
            inputs: [
              { label: 'Coverage record on file', detail: insurance.memberId ? `Member ${insurance.memberId}` : undefined },
            ],
            output: { label: 'Eligibility result', preview: `${insurance.name} — ${insurance.eligibility}` },
          })}
        />
      )}
      {/* Entry point to the Insurance Document Agent (§2.6) */}
      <Link
        href={`/chart/${mrn}/insurance`}
        className="mt-1.5 block text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
      >
        Scan insurance document →
      </Link>
    </Card>
  )
}

const severityColors: Record<Allergy['severity'], string> = {
  Severe: 'text-chart-danger-text bg-chart-danger-bg',
  Moderate: 'text-chart-warning-text bg-chart-warning-bg',
  Mild: 'text-chart-neutral-text bg-chart-neutral-bg',
}

function AllergiesCard({ allergies }: { allergies: Allergy[] }) {
  return (
    <Card>
      <SectionLabel>Allergies</SectionLabel>
      {allergies.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">None on record</p>
      ) : (
        <div className="space-y-2">
          {allergies.map((a) => (
            <div key={a.id}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium">{a.name}</span>
                <span
                  className={`rounded-lg px-1.5 py-px text-[11px] font-medium ${severityColors[a.severity]}`}
                >
                  {a.severity}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {a.reaction} · {a.year}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function CareTeamCard({ members }: { members: CareTeamMember[] }) {
  return (
    <Card>
      <SectionLabel>Care team</SectionLabel>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id}>
            <p className="text-[13px] font-medium">{m.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {m.role} · {m.relationship}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}

const noShowColors: Record<UpcomingAppointment['noShowRisk'], string> = {
  Low: 'text-chart-success-text',
  Medium: 'text-chart-warning-text',
  High: 'text-chart-danger-text',
}

function UpcomingCard({ appt }: { appt: UpcomingAppointment | null }) {
  return (
    <Card>
      <SectionLabel>Upcoming</SectionLabel>
      {!appt ? (
        <p className="text-[13px] text-muted-foreground">No upcoming appointments</p>
      ) : (
        <>
          <p className="text-[13px] font-medium">{formatDateTime(appt.date)}</p>
          <p className="text-[11px] text-muted-foreground">
            {appt.visitType} · {appt.provider}
          </p>
          <p className={`mt-1 text-[11px] font-medium ${noShowColors[appt.noShowRisk]}`}>
            ● {appt.noShowRisk} no-show risk
          </p>
        </>
      )}
    </Card>
  )
}

// ------- Rail -------

interface DemographicsRailProps {
  patient: ChartPatient
  insurance: Insurance
  allergies: Allergy[]
  careTeam: CareTeamMember[]
  upcomingAppointment: UpcomingAppointment | null
}

export function DemographicsRail({
  patient,
  insurance,
  allergies,
  careTeam,
  upcomingAppointment,
}: DemographicsRailProps) {
  return (
    <div className="flex flex-col gap-3">
      <DemographicsCard patient={patient} />
      <InsuranceCard insurance={insurance} mrn={patient.mrn} />
      <AllergiesCard allergies={allergies} />
      <CareTeamCard members={careTeam} />
      <UpcomingCard appt={upcomingAppointment} />
    </div>
  )
}
