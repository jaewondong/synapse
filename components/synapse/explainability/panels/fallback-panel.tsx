import type { PanelProps } from '../panel-registry'

// Rendered for any payload kind with no registered panel — never a crash,
// never a blank drawer.
export function FallbackPanel({ payload }: PanelProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm leading-relaxed break-words">{payload.title}</p>
      <p className="text-xs text-muted-foreground">
        This explanation type isn&apos;t supported yet.
      </p>
    </div>
  )
}
