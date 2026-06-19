import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-accent/10 text-accent border border-accent/20',
        secondary: 'bg-muted text-muted-foreground border border-border',
        filled: 'bg-accent text-accent-foreground',
        success: 'bg-signal-high-bg text-signal-high border border-signal-high/30',
        warning: 'bg-signal-med-bg text-signal-med border border-signal-med/30',
        destructive: 'bg-signal-low-bg text-signal-low border border-signal-low/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
