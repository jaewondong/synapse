'use client'

import * as React from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import { OrderingAgentDraft } from './OrderingAgentDraft'
import { CatalogSearch } from './CatalogSearch'
import { OrderSetPicker } from './OrderSetPicker'
import { DraftCart } from './DraftCart'
import { SafetyChecks } from './SafetyChecks'
import type {
  LabsData,
  LabOrder,
  CatalogItem,
  SafetyAlert,
  SplitRequisition,
  OrderSetting,
} from '@/lib/types/labs'
import type { Problem } from '@/lib/types/chart'

interface LabsOrderingViewProps {
  labsData: LabsData
  mrn: string
  problems: Problem[]
}

function computeSafetyAlerts(pendedOrders: LabOrder[], recentResultNames: string[]): SafetyAlert[] {
  const alerts: SafetyAlert[] = []

  for (const order of pendedOrders) {
    // Duplicate / recent result check — fuzzy match by test name fragment
    const resultedName = recentResultNames.find(
      (n) =>
        n.toLowerCase().includes(order.catalogItem.name.toLowerCase().slice(0, 8)) ||
        order.catalogItem.name.toLowerCase().includes(n.toLowerCase().slice(0, 8))
    )
    if (resultedName) {
      alerts.push({
        id: `dup-${order.id}`,
        type: 'duplicate',
        severity: 'warn',
        catalogCode: order.catalogCode,
        testName: order.catalogItem.name,
        message: `A recent result for "${resultedName}" exists. Reorder needed?`,
        detail: `A resulted order for a similar test was found. Confirm if a repeat is clinically indicated before releasing.`,
        resolved: false,
      })
    }

    // Missing indication (outpatient)
    if (order.setting === 'out' && !order.indicationIcd) {
      alerts.push({
        id: `ind-${order.id}`,
        type: 'missing_indication',
        severity: 'warn',
        catalogCode: order.catalogCode,
        testName: order.catalogItem.name,
        message: 'No clinical indication (ICD-10) entered.',
        detail: 'Outpatient orders require a clinical indication for medical necessity. Open the order to add an ICD-10 code.',
        resolved: false,
      })
    }
  }

  return alerts
}

function computeSplitReq(orders: LabOrder[]): SplitRequisition | null {
  const inHouseOrders = orders.filter((o) => o.performingLocation?.type === 'in_house')
  const sendOutOrders = orders.filter((o) => o.catalogItem.sendOut || o.performingLocation?.type?.startsWith('reference'))

  if (inHouseOrders.length === 0 || sendOutOrders.length === 0) return null

  const sendOutLoc = sendOutOrders[0]?.performingLocation
  const questPscName = sendOutOrders[0]?.pscId ? sendOutOrders[0].performingLocation?.name : undefined

  return {
    inHouseCount: inHouseOrders.length,
    inHouseLocationName: inHouseOrders[0]?.performingLocation?.name ?? 'In-house lab',
    sendOutCount: sendOutOrders.length,
    sendOutLocationName: sendOutLoc?.name ?? 'Reference lab',
    questPscName,
  }
}

export function LabsOrderingView({ labsData, mrn, problems }: LabsOrderingViewProps) {
  const { performingLocations, questPscs, catalog, orderSets } = labsData

  // Separate agent-pended from all pended
  const [orders, setOrders] = React.useState<LabOrder[]>(labsData.orders)
  const [setting, setSetting] = React.useState<OrderSetting>('out')
  const [defaultLocationId, setDefaultLocationId] = React.useState(
    () => performingLocations.find((l) => l.type === 'in_house')?.id ?? ''
  )
  const [defaultPscId, setDefaultPscId] = React.useState('')
  const [releasing, setReleasing] = React.useState(false)
  const [resolvedAlerts, setResolvedAlerts] = React.useState<Set<string>>(new Set())

  const searchRef = React.useRef<HTMLInputElement | null>(null)

  // Keyboard shortcuts
  useHotkeys('a', () => handleReleaseAll(), { preventDefault: true })
  useHotkeys('/', () => searchRef.current?.focus(), { preventDefault: true })

  const pendedOrders = orders.filter((o) => o.status === 'pended')
  const agentOrders = pendedOrders.filter((o) => o.pendedByType === 'agent')
  const pendedCodes = new Set(pendedOrders.map((o) => o.catalogCode))

  // Recent resulted test names for duplicate check
  const resultedOrders = orders.filter((o) => o.status === 'resulted')
  const recentResultNames = resultedOrders.map((o) => o.catalogItem.name)

  const rawAlerts = computeSafetyAlerts(pendedOrders, recentResultNames)
  const alerts = rawAlerts.map((a) => ({ ...a, resolved: resolvedAlerts.has(a.id) }))

  const splitReq = computeSplitReq(pendedOrders)

  // ─── Mutations (optimistic, then sync to DB) ────────────────────────────

  const handleAddToCart = React.useCallback(async (item: CatalogItem) => {
    if (pendedCodes.has(item.code)) return

    const tempId = `temp-${Date.now()}-${item.code}`
    const defaultLoc = performingLocations.find((l) => l.id === defaultLocationId)

    // Optimistic
    const optimisticOrder: LabOrder = {
      id: tempId,
      patientId: '',
      catalogCode: item.code,
      catalogItem: item,
      setting,
      priority: item.defaultPriority,
      frequency: 'once',
      performingLocationId: defaultLocationId || undefined,
      performingLocation: defaultLoc,
      pscId: defaultPscId || undefined,
      status: 'pended',
      pendedByType: 'human',
      orderedAt: new Date().toISOString(),
      indicationIcd: problems[0]?.icd10 || undefined,
    }
    setOrders((prev) => [...prev, optimisticOrder])

    try {
      const res = await fetch('/api/labs/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mrn,
          catalogCode: item.code,
          setting,
          priority: item.defaultPriority,
          frequency: 'once',
          performingLocationId: defaultLocationId || undefined,
          pscId: defaultPscId || undefined,
          pendedByType: 'human',
          indicationIcd: problems[0]?.icd10 || undefined,
        }),
      })
      const data = await res.json()
      if (data.order) {
        setOrders((prev) => prev.map((o) => (o.id === tempId ? data.order : o)))
      }
    } catch {
      setOrders((prev) => prev.filter((o) => o.id !== tempId))
      toast.error('Failed to add order')
    }
  }, [mrn, setting, defaultLocationId, defaultPscId, pendedCodes, performingLocations, problems])

  const handleAddSet = React.useCallback((items: CatalogItem[]) => {
    items.forEach((item) => handleAddToCart(item))
  }, [handleAddToCart])

  const handleUpdate = React.useCallback(async (id: string, updates: Partial<LabOrder>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)))
    try {
      await fetch(`/api/labs/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    } catch {
      toast.error('Failed to update order')
    }
  }, [])

  const handleRemove = React.useCallback(async (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id))
    try {
      await fetch(`/api/labs/orders/${id}`, { method: 'DELETE' })
    } catch {
      toast.error('Failed to remove order')
    }
  }, [])

  const handleRelease = React.useCallback(async (ids?: string[]) => {
    const targetIds = ids ?? pendedOrders.map((o) => o.id)
    if (!targetIds.length) return

    setReleasing(true)
    try {
      const res = await fetch('/api/labs/orders/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: targetIds, releasedBy: 'physician' }),
      })
      const data = await res.json()
      if (data.released?.length) {
        setOrders((prev) =>
          prev.map((o) => (data.released.includes(o.id) ? { ...o, status: 'released' as const } : o))
        )
        const inHouseCount = pendedOrders.filter(
          (o) => data.released.includes(o.id) && o.performingLocation?.type === 'in_house'
        ).length
        const questCount = pendedOrders.filter(
          (o) => data.released.includes(o.id) && o.performingLocation?.type?.startsWith('reference')
        ).length

        const parts = [
          inHouseCount > 0 && `${inHouseCount} → GHS Lab. Collection task created.`,
          questCount > 0 && `${questCount} → Quest. Requisition generated.`,
        ].filter(Boolean)

        toast.success(`${data.released.length} order${data.released.length !== 1 ? 's' : ''} released. ${parts.join(' ')}`)
      }
    } catch {
      toast.error('Release failed')
    } finally {
      setReleasing(false)
    }
  }, [pendedOrders])

  const handleReleaseAll = React.useCallback(() => handleRelease(), [handleRelease])

  const handleDiscardAll = React.useCallback(async () => {
    const ids = pendedOrders.map((o) => o.id)
    setOrders((prev) => prev.filter((o) => o.status !== 'pended'))
    await Promise.all(ids.map((id) => fetch(`/api/labs/orders/${id}`, { method: 'DELETE' })))
    toast.info('All pending orders discarded')
  }, [pendedOrders])

  const handleDiscardAgentOrders = React.useCallback(async () => {
    const ids = agentOrders.map((o) => o.id)
    setOrders((prev) => prev.filter((o) => !ids.includes(o.id)))
    await Promise.all(ids.map((id) => fetch(`/api/labs/orders/${id}`, { method: 'DELETE' })))
    toast.info('Agent-suggested orders discarded')
  }, [agentOrders])

  const handleResolveAlert = React.useCallback((id: string, override?: string) => {
    setResolvedAlerts((prev) => new Set([...prev, id]))
    if (override === 'override') {
      toast.info('Override logged — proceeding with order')
    }
  }, [])

  return (
    <div className="space-y-3 mt-4">
      {/* Agent draft at top */}
      <OrderingAgentDraft
        agentOrders={agentOrders}
        onReleaseAll={handleReleaseAll}
        onAddLabs={() => searchRef.current?.focus()}
        onDiscardAll={handleDiscardAgentOrders}
        releasing={releasing}
      />

      {/* Safety checks */}
      <SafetyChecks alerts={alerts} onResolve={handleResolveAlert} />

      {/* Two-column: search + cart */}
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 280px', alignItems: 'start' }}>
        <div className="space-y-0">
          <CatalogSearch
            catalog={catalog}
            pendedCodes={pendedCodes}
            onAdd={handleAddToCart}
            searchRef={searchRef}
          />
          <OrderSetPicker
            orderSets={orderSets}
            catalog={catalog}
            pendedCodes={pendedCodes}
            onAddSet={handleAddSet}
          />
        </div>

        <DraftCart
          pendedOrders={pendedOrders}
          performingLocations={performingLocations}
          questPscs={questPscs}
          setting={setting}
          onSettingChange={setSetting}
          defaultLocationId={defaultLocationId}
          defaultPscId={defaultPscId}
          onDefaultLocationChange={setDefaultLocationId}
          onDefaultPscChange={setDefaultPscId}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          onRelease={handleReleaseAll}
          onPendAndExit={() => toast.success('Orders saved as pended')}
          onDiscardAll={handleDiscardAll}
          releasing={releasing}
          splitReq={splitReq}
        />
      </div>
    </div>
  )
}
