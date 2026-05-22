'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Brain,
  Activity,
  ScanLine,
  FlaskConical,
  Pill,
  Syringe,
  Stethoscope,
  FileText,
  ArrowRight,
} from 'lucide-react'
import { AuditStrip } from './audit-strip'
import { NeurologyWidget } from './neurology-widget'
import { DocumentList } from '@/components/synapse/documents/document-list'
import { UploadDialog } from '@/components/synapse/documents/upload-dialog'
import { formatDateOnly } from '@/lib/utils'
import type { Department, Problem, Encounter, SeizureLog } from '@/lib/types/chart'

const deptIcons: Record<Exclude<Department, 'timeline'>, React.ElementType> = {
  neurology: Brain,
  cardiology: Activity,
  imaging: ScanLine,
  labs: FlaskConical,
  medications: Pill,
  immunizations: Syringe,
  'primary-care': Stethoscope,
  documents: FileText,
}

const deptLabels: Record<Exclude<Department, 'timeline'>, string> = {
  neurology: 'Neurology',
  cardiology: 'Cardiology',
  imaging: 'Imaging',
  labs: 'Labs',
  medications: 'Medications',
  immunizations: 'Immunizations',
  'primary-care': 'Primary care',
  documents: 'Documents',
}

const problemStatusColors: Record<Problem['status'], string> = {
  Active: 'text-chart-danger-text bg-chart-danger-bg',
  Stable: 'text-chart-warning-text bg-chart-warning-bg',
  Evaluating: 'text-chart-neutral-text bg-chart-neutral-bg',
  Resolved: 'text-muted-foreground bg-muted',
}

function ActiveProblems({ problems }: { problems: Problem[] }) {
  const visible = problems.filter((p) => p.status !== 'Resolved')
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
        Active problems
      </p>
      {visible.length === 0 ? (
        <p className="text-[13px] text-muted-foreground py-2">None recorded</p>
      ) : (
        <div>
          {visible.map((p, i) => (
            <div
              key={p.id}
              className={`flex justify-between py-2 text-[13px] ${i < visible.length - 1 ? 'border-b border-black/[0.06]' : ''}`}
            >
              <div className="min-w-0 mr-4">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {[p.icd10, p.onset && `Onset ${p.onset}`, p.context].filter(Boolean).join(' · ')}
                </p>
                {p.modifiedByType === 'agent' && (
                  <AuditStrip
                    modifiedByType={p.modifiedByType}
                    modifiedByAgentName={p.modifiedByAgentName}
                    modifiedAt={p.modifiedAt}
                  />
                )}
              </div>
              <span
                className={`shrink-0 self-start rounded-lg px-2 py-0.5 text-[11px] font-medium ${problemStatusColors[p.status]}`}
              >
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
      {/* TODO: expand problem history */}
    </div>
  )
}

function RecentEncounters({ encounters, mrn }: { encounters: Encounter[]; mrn: string }) {
  const recent = encounters.slice(0, 5)
  return (
    <div className="mt-4">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
        Recent encounters
      </p>
      {recent.length === 0 ? (
        <p className="text-[13px] text-muted-foreground py-2">None recorded</p>
      ) : (
        <div>
          {recent.map((e, i) => (
            <div
              key={e.id}
              className={`flex justify-between items-center py-2 text-[13px] ${i < recent.length - 1 ? 'border-b border-black/[0.06]' : ''}`}
            >
              <div className="min-w-0 mr-4">
                <p className="font-medium truncate">{e.visitType} · {e.provider}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatDateOnly(e.date)} · {e.summary}
                </p>
              </div>
              {e.status === 'complete' ? (
                // TODO: convert to side panel
                <Link
                  href={`/chart/${mrn}/encounter/${e.id}`}
                  className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  aria-label={`Open encounter from ${e.date}`}
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="shrink-0 rounded-lg bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  Pending
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface DepartmentViewProps {
  department: Exclude<Department, 'timeline'>
  mrn: string
  patient?: { name: string; dob: string; age: number; sex: string }
  problems: Problem[]
  encounters: Encounter[]
  seizureLog: SeizureLog | null
  encounterCount: number
  lastVisit: string | null
}

function DocumentsView({
  mrn,
  patient,
  docCount,
}: {
  mrn: string
  patient?: { name: string; dob: string; age: number; sex: string }
  docCount: number
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3.5 border-b border-black/[0.06]">
        <div className="flex items-center gap-2">
          <FileText className="h-[18px] w-[18px]" aria-hidden />
          <span className="text-[15px] font-medium">Documents</span>
        </div>
        <span className="text-[11px] text-chart-subtle">
          {docCount} {docCount === 1 ? 'document' : 'documents'}
        </span>
      </div>

      <DocumentList
        patientMrn={mrn}
        onUploadClick={() => setDialogOpen(true)}
        refreshTrigger={refreshTrigger}
      />

      <UploadDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        prefillPatient={patient ? { mrn, ...patient } : undefined}
        onUploaded={() => {
          setDialogOpen(false)
          setRefreshTrigger((n) => n + 1)
        }}
      />
    </div>
  )
}

export function DepartmentView({
  department,
  mrn,
  patient,
  problems,
  encounters,
  seizureLog,
  encounterCount,
  lastVisit,
}: DepartmentViewProps) {
  if (department === 'documents') {
    return (
      <DocumentsView mrn={mrn} patient={patient} docCount={encounterCount} />
    )
  }

  const Icon = deptIcons[department]
  const label = deptLabels[department]

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white px-4 py-3.5">
      {/* Department header */}
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2">
          <Icon className="h-[18px] w-[18px]" aria-hidden />
          <span className="text-[15px] font-medium">{label}</span>
        </div>
        <span className="text-[11px] text-chart-subtle">
          {encounterCount} {encounterCount === 1 ? 'entry' : 'entries'}
          {lastVisit ? ` · Last visit ${formatDateOnly(lastVisit)}` : ''}
        </span>
      </div>

      <ActiveProblems problems={problems} />
      <RecentEncounters encounters={encounters} mrn={mrn} />

      {/* Neurology-specific specialty data */}
      {department === 'neurology' && seizureLog && (
        <NeurologyWidget seizureLog={seizureLog} />
      )}
      {department !== 'neurology' && (
        // TODO: specialty widgets per department (v1.5+ scope)
        <div />
      )}

      {/* TODO: orders & results in scope */}
      {/* TODO: department notes */}
    </div>
  )
}
