'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Brain,
  Activity,
  ScanLine,
  FlaskConical,
  Pill,
  Syringe,
  Stethoscope,
  FileText,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Department, DepartmentCounts } from '@/lib/types/chart'

interface DeptConfig {
  id: Department
  label: string
  icon: React.ElementType
}

const DEPARTMENTS: DeptConfig[] = [
  { id: 'neurology', label: 'Neurology', icon: Brain },
  { id: 'cardiology', label: 'Cardiology', icon: Activity },
  { id: 'imaging', label: 'Imaging', icon: ScanLine },
  { id: 'labs', label: 'Labs', icon: FlaskConical },
  { id: 'medications', label: 'Medications', icon: Pill },
  { id: 'immunizations', label: 'Immunizations', icon: Syringe },
  { id: 'primary-care', label: 'Primary care', icon: Stethoscope },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: History },
]

// TODO: per-practice department config

interface DepartmentRailProps {
  mrn: string
  activeDepartment: Department
  counts: DepartmentCounts
  onSelect: (dept: Department) => void
}

export function DepartmentRail({ mrn, activeDepartment, counts, onSelect }: DepartmentRailProps) {
  const router = useRouter()

  function handleClick(dept: Department) {
    if (dept === 'timeline') {
      // TODO: timeline view
      router.push(`/chart/${mrn}/timeline`)
      return
    }
    onSelect(dept)
    router.push(`/chart/${mrn}/${dept}`)
  }

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
        Departments
      </p>

      <div className="space-y-0.5">
        {DEPARTMENTS.map((dept) => {
          const count = counts[dept.id]
          const isEmpty = count !== 'all' && count === 0
          const active = dept.id === activeDepartment
          const Icon = dept.icon

          return (
            <button
              key={dept.id}
              onClick={() => handleClick(dept.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors',
                active
                  ? 'bg-chart-surface font-medium'
                  : 'hover:bg-chart-surface/60 text-foreground',
                isEmpty && !active && 'opacity-50'
              )}
            >
              <span className="flex items-center gap-1.5">
                <Icon
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ verticalAlign: '-2px' }}
                  aria-hidden
                />
                {dept.label}
              </span>
              <span
                className={cn(
                  'text-[11px]',
                  active ? 'text-muted-foreground' : 'text-chart-subtle'
                )}
              >
                {count === 'all' ? 'all' : count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
