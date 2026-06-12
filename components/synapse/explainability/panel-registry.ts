import type { ComponentType } from 'react'
import type { ExplainabilityKind, ExplainabilityPayload } from '@/lib/explainability'
import { AgentActionPanel } from './panels/agent-action-panel'
import { RiskScorePanel } from './panels/risk-score-panel'
import { ExtractionAuditPanel } from './panels/extraction-audit-panel'

export interface PanelProps {
  payload: ExplainabilityPayload
}

// kind -> panel component. An unknown kind falls back in the shell — never a
// crash, never a blank drawer.
export const PANEL_REGISTRY: Partial<Record<ExplainabilityKind, ComponentType<PanelProps>>> = {
  agent_action: AgentActionPanel,
  risk_score: RiskScorePanel,
  extraction: ExtractionAuditPanel,
}
