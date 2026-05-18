'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ReasonCaptureProps {
  operation: 'approve' | 'reject' | 'snooze'
  onConfirm: (reason: string) => void
  onCancel: () => void
  className?: string
}

const chipsByOp: Record<string, string[]> = {
  approve: ['Verified against record', 'Matches protocol', 'Reviewed sources', 'Standard workflow'],
  reject: ['Incorrect recommendation', 'Needs more info', 'Deferring to colleague', 'Out of scope'],
  snooze: ['Not urgent today', 'Waiting on info', 'Review later'],
}

export function ReasonCapture({ operation, onConfirm, onCancel, className }: ReasonCaptureProps) {
  const [value, setValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const chips = chipsByOp[operation] ?? []

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    onConfirm(value.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onCancel()
    }
  }

  const opLabel = operation === 'approve' ? 'Approving' : operation === 'reject' ? 'Rejecting' : 'Snoozing'
  const borderColor = operation === 'approve' ? 'border-accent/40' : operation === 'reject' ? 'border-red-200' : 'border-border'

  return (
    <div
      className={cn(
        'mt-2 rounded-lg border bg-card px-3 py-2.5 space-y-2',
        borderColor,
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-medium text-muted-foreground">{opLabel} — add a reason (optional)</p>

      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setValue(chip)}
            className={cn(
              'rounded-full px-2 py-0.5 text-xs border transition-colors',
              value === chip
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-muted text-muted-foreground border-transparent hover:border-border'
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Or type your own reason…"
        className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 border-b border-border focus:outline-none focus:border-accent pb-0.5"
      />

      <div className="flex items-center justify-end gap-2 pt-0.5">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel (Esc)
        </button>
        <Button size="sm" className="h-6 px-2.5 text-xs" onClick={handleSubmit}>
          Confirm (↵)
        </Button>
      </div>
    </div>
  )
}
