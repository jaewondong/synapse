'use client'

import * as React from 'react'
import { CheckCheck, Save, Trash2, Building2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrderRow } from './OrderRow'
import { LocationPicker } from './LocationPicker'
import type { LabOrder, PerformingLocation, QuestPsc, OrderSetting, SplitRequisition } from '@/lib/types/labs'

interface DraftCartProps {
  pendedOrders: LabOrder[]
  performingLocations: PerformingLocation[]
  questPscs: QuestPsc[]
  setting: OrderSetting
  onSettingChange: (s: OrderSetting) => void
  defaultLocationId: string
  defaultPscId: string
  onDefaultLocationChange: (id: string) => void
  onDefaultPscChange: (id: string) => void
  onUpdate: (id: string, updates: Partial<LabOrder>) => void
  onRemove: (id: string) => void
  onRelease: () => void
  onPendAndExit: () => void
  onDiscardAll: () => void
  releasing: boolean
  splitReq: SplitRequisition | null
}

export function DraftCart({
  pendedOrders,
  performingLocations,
  questPscs,
  setting,
  onSettingChange,
  defaultLocationId,
  defaultPscId,
  onDefaultLocationChange,
  onDefaultPscChange,
  onUpdate,
  onRemove,
  onRelease,
  onPendAndExit,
  onDiscardAll,
  releasing,
  splitReq,
}: DraftCartProps) {
  return (
    <div className="rounded-lg border border-black/[0.08] bg-white p-4 sticky top-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.5px] text-chart-subtle">
          Order cart · {pendedOrders.length}
        </p>
        {pendedOrders.length > 0 && (
          <button
            onClick={onDiscardAll}
            className="text-[10px] text-chart-subtle hover:text-chart-danger-text transition-colors flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Discard all
          </button>
        )}
      </div>

      {/* Default location for new adds */}
      <div className="mb-3 pb-3 border-b border-black/[0.06]">
        <LocationPicker
          setting={setting}
          onSettingChange={onSettingChange}
          performingLocations={performingLocations}
          questPscs={questPscs}
          selectedLocationId={defaultLocationId}
          onLocationChange={onDefaultLocationChange}
          selectedPscId={defaultPscId}
          onPscChange={onDefaultPscChange}
          compact
        />
      </div>

      {/* Split requisition summary */}
      {splitReq && (splitReq.inHouseCount > 0 && splitReq.sendOutCount > 0) && (
        <div className="mb-3 rounded-lg bg-chart-info-bg px-3 py-2 text-[11px] text-chart-info-text">
          <p className="font-semibold mb-1">Split requisition</p>
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3 shrink-0" />
            <span>{splitReq.inHouseCount} test{splitReq.inHouseCount !== 1 ? 's' : ''} → {splitReq.inHouseLocationName}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Send className="h-3 w-3 shrink-0" />
            <span>{splitReq.sendOutCount} test{splitReq.sendOutCount !== 1 ? 's' : ''} → {splitReq.sendOutLocationName}{splitReq.questPscName ? ` · ${splitReq.questPscName}` : ''}</span>
          </div>
        </div>
      )}

      {/* Order list */}
      {pendedOrders.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-muted-foreground">Cart is empty</p>
          <p className="text-[11px] text-chart-subtle mt-1">Search the catalog to add labs</p>
        </div>
      ) : (
        <div className="mb-3 max-h-80 overflow-y-auto -mx-4 px-4">
          {pendedOrders.map((order, i) => (
            <OrderRow
              key={order.id}
              order={order}
              performingLocations={performingLocations}
              questPscs={questPscs}
              onUpdate={onUpdate}
              onRemove={onRemove}
              setting={setting}
              isLast={i === pendedOrders.length - 1}
            />
          ))}
        </div>
      )}

      {/* Footer actions */}
      {pendedOrders.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-black/[0.06]">
          <Button
            size="sm"
            onClick={onRelease}
            disabled={releasing}
            className="w-full gap-1.5"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {releasing ? 'Releasing…' : `Release ${pendedOrders.length} order${pendedOrders.length !== 1 ? 's' : ''}`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onPendAndExit}
            className="w-full gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            Pend & exit
          </Button>
        </div>
      )}
    </div>
  )
}
