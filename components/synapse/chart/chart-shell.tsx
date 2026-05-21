'use client'

import * as React from 'react'
import { PatientHeader } from './patient-header'
import { DepartmentRail } from './department-rail'
import { DemographicsRail } from './demographics-rail'
import { DepartmentView } from './department-view'
import { MedicationsCard } from './medications-card'
import { ImagingCard } from './imaging-card'
import { ReconciliationBanner } from './reconciliation-banner'
import { WrongPatientGuard } from './wrong-patient-guard'
import type { ChartData, Department } from '@/lib/types/chart'

interface ChartShellProps {
  data: ChartData
  initialDepartment: Department | null
}

export function ChartShell({ data, initialDepartment }: ChartShellProps) {
  const { patient, problems, encounters, seizureLog, medications, imagingStudies, reconciliationPrompts, departmentCounts } = data
  const defaultDept: Department = 'neurology'
  const [activeDept, setActiveDept] = React.useState<Department>(initialDepartment ?? defaultDept)

  // Filter to the active department's data
  const deptProblems = problems.filter(
    (p) => p.department === activeDept || activeDept === 'neurology'
  )
  const deptEncounters = encounters.filter(
    (e) => e.department === activeDept || activeDept === 'neurology'
  )
  const deptCount = activeDept === 'timeline' ? 0 : (departmentCounts[activeDept] as number)
  const lastVisit = deptEncounters.length > 0 ? deptEncounters[0].date : null

  // Timeline is handled as a stub; treat it like showing the default dept if routed there directly
  const viewedDept = activeDept === 'timeline' ? defaultDept : activeDept

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4">
      {/* Wrong-patient guard — invisible, just fires toasts */}
      <WrongPatientGuard mrn={patient.mrn} name={patient.name} dob={patient.dob} />

      {/* Outer container */}
      <div className="rounded-xl bg-chart-surface p-4 space-y-3">
        {/* Patient header */}
        <PatientHeader patient={patient} />

        {/* Three-region layout */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: '170px 1fr 200px', alignItems: 'start' }}
        >
          {/* Left: department rail */}
          <div className="sticky top-4">
            <DepartmentRail
              mrn={patient.mrn}
              activeDepartment={activeDept}
              counts={departmentCounts}
              onSelect={setActiveDept}
            />
          </div>

          {/* Center: main panel */}
          <div className="flex flex-col gap-3 min-w-0">
            <ReconciliationBanner prompts={reconciliationPrompts} />

            {activeDept === 'timeline' ? (
              // TODO: timeline view
              <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-8 text-center text-sm text-muted-foreground">
                Timeline view — coming soon
              </div>
            ) : (
              <DepartmentView
                department={viewedDept as Exclude<Department, 'timeline'>}
                mrn={patient.mrn}
                problems={deptProblems}
                encounters={deptEncounters}
                seizureLog={seizureLog}
                encounterCount={deptCount}
                lastVisit={lastVisit}
              />
            )}

            <MedicationsCard medications={medications} />
            <ImagingCard studies={imagingStudies} />
          </div>

          {/* Right: demographics rail */}
          <div className="sticky top-4">
            <DemographicsRail
              patient={patient}
              insurance={data.insurance}
              allergies={data.allergies}
              careTeam={data.careTeam}
              upcomingAppointment={data.upcomingAppointment}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
