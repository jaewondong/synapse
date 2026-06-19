import { cn } from '@/lib/utils'

interface DecisionPillProps {
  operation: string
  className?: string
}

const styles: Record<string, string> = {
  approve: 'bg-signal-high-bg text-signal-high border-signal-high/30',
  reject: 'bg-signal-low-bg text-signal-low border-signal-low/30',
  snooze: 'bg-muted text-muted-foreground border-border',
}

const labels: Record<string, string> = {
  approve: 'Approved',
  reject: 'Rejected',
  snooze: 'Snoozed',
}

export function DecisionPill({ operation, className }: DecisionPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        styles[operation] ?? 'bg-muted text-muted-foreground border-border',
        className
      )}
    >
      {labels[operation] ?? operation}
    </span>
  )
}
