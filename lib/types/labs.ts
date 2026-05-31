export type OrderSetting = 'out' | 'in'
export type OrderPriority = 'routine' | 'stat' | 'timed' | 'am_draw' | 'now'
export type OrderFrequency = 'once' | 'daily' | 'weekly' | 'recurring' | 'future'
export type OrderStatus = 'pended' | 'released' | 'collected' | 'in_lab' | 'resulted' | 'cancelled'
export type LocationType = 'in_house' | 'reference:quest' | 'reference:labcorp' | 'regional_reference'

export interface CatalogItem {
  code: string
  name: string
  aliases: string[]
  category: string
  specimen: string
  cpt?: string
  setting: 'out' | 'in' | 'both'
  fastingRequired: boolean
  sendOut: boolean
  defaultPriority: 'routine' | 'stat'
  isPanel: boolean
  panelComponents: string[]
}

export interface OrderSet {
  id: string
  name: string
  setting: 'out' | 'in' | 'both'
  memberCodes: string[]
}

export interface PerformingLocation {
  id: string
  type: LocationType
  name: string
  address?: string
  active: boolean
}

export interface QuestPsc {
  id: string
  name: string
  address: string
  zip: string
  hours?: string
  lat?: number
  lng?: number
  performingLocationId: string
}

export interface LabOrder {
  id: string
  patientId: string
  catalogCode: string
  catalogItem: CatalogItem
  setting: OrderSetting
  priority: OrderPriority
  frequency: OrderFrequency
  futureDate?: string
  indicationIcd?: string
  indicationText?: string
  performingLocationId?: string
  performingLocation?: PerformingLocation
  pscId?: string
  status: OrderStatus
  pendedBy?: string
  pendedByType?: 'agent' | 'human'
  pendedByAgentName?: string
  pendedByRationale?: string
  releasedBy?: string
  orderedAt: string
  releasedAt?: string
  modifiedByType?: 'agent' | 'human'
  modifiedByAgentName?: string
  notes?: string
}

export interface SafetyAlert {
  id: string
  type: 'duplicate' | 'missing_indication' | 'abn' | 'drug_level_timing'
  severity: 'warn' | 'block'
  catalogCode: string
  testName: string
  message: string
  detail: string
  resolved: boolean
  override?: string
}

export interface SplitRequisition {
  inHouseCount: number
  inHouseLocationName: string
  sendOutCount: number
  sendOutLocationName: string
  questPscName?: string
}

export interface LabsData {
  orders: LabOrder[]
  performingLocations: PerformingLocation[]
  questPscs: QuestPsc[]
  catalog: CatalogItem[]
  orderSets: OrderSet[]
}
