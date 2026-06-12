import type { FieldConfidence } from '@/lib/types/insurance'
import { cn } from '@/lib/utils'

// Confidence is always dots, never numeric (§1.5).
const DOT_COLORS: Record<FieldConfidence, string> = {
  high: 'text-chart-success-text',
  medium: 'text-chart-warning-text',
  low: 'text-chart-danger-text',
}

const DOT_LABELS: Record<FieldConfidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
}

export function ConfidenceDot({
  confidence,
  className,
}: {
  confidence: FieldConfidence
  className?: string
}) {
  return (
    <span
      className={cn('text-[10px] leading-none', DOT_COLORS[confidence], className)}
      title={DOT_LABELS[confidence]}
      aria-label={DOT_LABELS[confidence]}
    >
      ●
    </span>
  )
}
