'use client'

import * as React from 'react'
import { CheckCheck, Pencil, Trash2, Plus, Send } from 'lucide-react'
import { AuditStrip } from '@/components/synapse/chart/audit-strip'
import { ExplainabilityDrawer } from '@/components/synapse/ExplainabilityDrawer'
import { Button } from '@/components/ui/button'
import { formatDateOnly } from '@/lib/utils'
import type { LabOrder } from '@/lib/types/labs'

interface OrderingAgentDraftProps {
  agentOrders: LabOrder[]
  onReleaseAll: () => void
  onAddLabs: () => void
  onDiscardAll: () => void
  releasing: boolean
}

const confidenceDot = { high: 'bg-confidence-high', medium: 'bg-confidence-medium', low: 'bg-confidence-low' }

export function OrderingAgentDraft({
  agentOrders,
  onReleaseAll,
  onAddLabs,
  onDiscardAll,
  releasing,
}: OrderingAgentDraftProps) {
  const [drawerOrder, setDrawerOrder] = React.useState<LabOrder | null>(null)

  if (!agentOrders.length) return null

  const inHouseCount = agentOrders.filter((o) => o.performingLocation?.type === 'in_house').length
  const sendOutCount = agentOrders.filter((o) => o.catalogItem.sendOut).length

  return (
    <>
      <div className="rounded-lg border border-black/[0.06] bg-agent-tint p-4">
        {/* Header */}
        <div className="flex items-start gap-2.5 mb-3">
          <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
            <span className="text-accent text-base leading-none">⊕</span>
            <span className={`h-2 w-2 rounded-full ${confidenceDot.high}`} title="high confidence" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Ordering Agent</p>
            <p className="text-sm font-semibold text-foreground mt-0.5 leading-snug">
              {agentOrders.length} lab{agentOrders.length !== 1 ? 's' : ''} pended based on chart context
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {[
                inHouseCount > 0 && `${inHouseCount} → in-house lab`,
                sendOutCount > 0 && `${sendOutCount} → send-out (Quest)`,
              ].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {/* Orders list */}
        <div className="space-y-0 mb-3">
          {agentOrders.map((order, i) => (
            <div
              key={order.id}
              className={`flex items-start gap-2.5 py-2 ${i < agentOrders.length - 1 ? 'border-b border-black/[0.06]' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium">{order.catalogItem.name}</p>
                  {order.catalogItem.sendOut && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-chart-info-text bg-chart-info-bg rounded px-1.5 py-0.5">
                      <Send className="h-2.5 w-2.5" />
                      {order.performingLocation?.name ?? 'Send-out'}
                    </span>
                  )}
                  {order.catalogItem.fastingRequired && (
                    <span className="text-[10px] text-chart-warning-text bg-chart-warning-bg rounded px-1.5 py-0.5 font-medium">
                      Fasting
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-chart-subtle mt-0.5">
                  {[
                    order.catalogItem.specimen,
                    order.indicationIcd,
                    order.indicationText,
                  ].filter(Boolean).join(' · ')}
                </p>
                {order.pendedByRationale && (
                  <p className="text-[11px] text-muted-foreground/70 italic mt-0.5">{order.pendedByRationale}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <AuditStrip
                    modifiedByType="agent"
                    modifiedByAgentName={order.pendedByAgentName}
                    modifiedAt={order.orderedAt}
                  />
                  <button
                    onClick={() => setDrawerOrder(order)}
                    className="text-[11px] text-chart-subtle underline underline-offset-2 hover:text-muted-foreground transition-colors ml-1"
                  >
                    why
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={onReleaseAll}
            disabled={releasing}
            className="gap-1.5"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Release all
          </Button>
          <Button size="sm" variant="outline" onClick={onAddLabs} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add labs
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDiscardAll}
            className="gap-1.5 text-muted-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Discard all
          </Button>
        </div>
      </div>

      {drawerOrder && (
        <ExplainabilityDrawer
          open={!!drawerOrder}
          onClose={() => setDrawerOrder(null)}
          title={`${drawerOrder.catalogItem.name} — Ordering rationale`}
          decision={drawerOrder.indicationText ?? drawerOrder.catalogItem.name}
          why={drawerOrder.pendedByRationale ?? 'This test was selected based on the patient\'s active problems and clinical context.'}
          inputs={[
            drawerOrder.indicationIcd ? `Indication: ${drawerOrder.indicationIcd}` : null,
            drawerOrder.performingLocation ? `Location: ${drawerOrder.performingLocation.name}` : null,
            `Priority: ${drawerOrder.priority}`,
            drawerOrder.catalogItem.specimen ? `Specimen: ${drawerOrder.catalogItem.specimen}` : null,
            drawerOrder.orderedAt ? `Pended: ${formatDateOnly(drawerOrder.orderedAt)}` : null,
          ].filter((s): s is string => s !== null)}
          agentName={drawerOrder.pendedByAgentName ?? 'Ordering Agent'}
          computedAt={drawerOrder.orderedAt}
        />
      )}
    </>
  )
}
