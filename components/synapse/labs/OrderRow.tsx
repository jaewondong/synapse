'use client'

import * as React from 'react'
import { X, ChevronDown, FlaskConical, Send } from 'lucide-react'
import { AuditStrip } from '@/components/synapse/chart/audit-strip'
import { formatDateOnly } from '@/lib/utils'
import type { LabOrder, OrderPriority, OrderFrequency, PerformingLocation, QuestPsc, OrderSetting } from '@/lib/types/labs'

interface OrderRowProps {
  order: LabOrder
  performingLocations: PerformingLocation[]
  questPscs: QuestPsc[]
  onUpdate: (id: string, updates: Partial<LabOrder>) => void
  onRemove: (id: string) => void
  setting: OrderSetting
  isLast?: boolean
}

const PRIORITIES: { value: OrderPriority; label: string }[] = [
  { value: 'routine', label: 'Routine' },
  { value: 'stat', label: 'STAT' },
  { value: 'timed', label: 'Timed' },
  { value: 'am_draw', label: 'AM draw' },
  { value: 'now', label: 'Now' },
]

const FREQUENCIES: { value: OrderFrequency; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'future', label: 'Future date' },
]

export function OrderRow({ order, performingLocations, questPscs, onUpdate, onRemove, setting, isLast }: OrderRowProps) {
  const [expanded, setExpanded] = React.useState(false)
  const item = order.catalogItem
  const loc = performingLocations.find((l) => l.id === order.performingLocationId)
  const psc = questPscs.find((p) => p.id === order.pscId)
  const isAgent = order.pendedByType === 'agent'

  return (
    <div className={`py-2.5 ${!isLast ? 'border-b border-black/[0.06]' : ''}`}>
      {/* Main row */}
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
          {isAgent ? (
            <span className="text-accent text-sm leading-none">⊕</span>
          ) : (
            <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-medium leading-tight">{item.name}</p>
            {item.sendOut && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-chart-info-text bg-chart-info-bg rounded px-1.5 py-0.5">
                <Send className="h-2.5 w-2.5" />
                Send-out
              </span>
            )}
            {item.fastingRequired && (
              <span className="text-[10px] text-chart-warning-text bg-chart-warning-bg rounded px-1.5 py-0.5 font-medium">
                Fasting
              </span>
            )}
          </div>

          <p className="text-[11px] text-chart-subtle mt-0.5">
            {[
              item.specimen,
              loc?.name,
              psc?.name,
              order.indicationIcd,
            ].filter(Boolean).join(' · ')}
          </p>

          {isAgent && order.pendedByRationale && (
            <p className="text-[11px] text-muted-foreground/70 italic mt-0.5">{order.pendedByRationale}</p>
          )}

          {isAgent && (
            <AuditStrip
              modifiedByType="agent"
              modifiedByAgentName={order.pendedByAgentName}
              modifiedAt={order.orderedAt}
            />
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 ${
            order.priority === 'stat' || order.priority === 'now'
              ? 'text-chart-danger-text bg-chart-danger-bg'
              : 'text-chart-neutral-text bg-chart-neutral-bg'
          }`}>
            {PRIORITIES.find((p) => p.value === order.priority)?.label ?? order.priority}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-chart-subtle hover:text-muted-foreground transition-colors"
            aria-label="Edit order"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => onRemove(order.id)}
            className="text-chart-subtle hover:text-chart-danger-text transition-colors"
            aria-label="Remove order"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded inline editor */}
      {expanded && (
        <div className="mt-2 ml-5 grid grid-cols-2 gap-2">
          {/* Priority */}
          <div>
            <label className="text-[10px] font-medium text-chart-subtle uppercase tracking-[0.5px] block mb-0.5">Priority</label>
            <select
              value={order.priority}
              onChange={(e) => onUpdate(order.id, { priority: e.target.value as OrderPriority })}
              className="w-full rounded border border-border bg-card text-[11px] px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {PRIORITIES.filter((p) => setting === 'in' || !['now', 'am_draw'].includes(p.value)).map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label className="text-[10px] font-medium text-chart-subtle uppercase tracking-[0.5px] block mb-0.5">Frequency</label>
            <select
              value={order.frequency}
              onChange={(e) => onUpdate(order.id, { frequency: e.target.value as OrderFrequency })}
              className="w-full rounded border border-border bg-card text-[11px] px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Performing location */}
          <div>
            <label className="text-[10px] font-medium text-chart-subtle uppercase tracking-[0.5px] block mb-0.5">Location</label>
            <select
              value={order.performingLocationId ?? ''}
              onChange={(e) => onUpdate(order.id, { performingLocationId: e.target.value || undefined })}
              className="w-full rounded border border-border bg-card text-[11px] px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">— Select —</option>
              {performingLocations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Indication */}
          <div>
            <label className="text-[10px] font-medium text-chart-subtle uppercase tracking-[0.5px] block mb-0.5">Indication (ICD-10)</label>
            <input
              type="text"
              value={order.indicationIcd ?? ''}
              onChange={(e) => onUpdate(order.id, { indicationIcd: e.target.value || undefined })}
              placeholder="e.g. I50.22"
              className="w-full rounded border border-border bg-card text-[11px] px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Quest PSC */}
          {loc?.type === 'reference:quest' && setting === 'out' && (
            <div className="col-span-2">
              <label className="text-[10px] font-medium text-chart-subtle uppercase tracking-[0.5px] block mb-0.5">Quest PSC</label>
              <select
                value={order.pscId ?? ''}
                onChange={(e) => onUpdate(order.id, { pscId: e.target.value || undefined })}
                className="w-full rounded border border-border bg-card text-[11px] px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Patient will choose / walk-in</option>
                {questPscs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} · {p.hours}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
