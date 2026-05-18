import type { AgentSummary } from './types'

interface TodayGreetingProps {
  agentSummary: AgentSummary
}

export function TodayGreeting({ agentSummary }: TodayGreetingProps) {
  const now = new Date('2026-05-18T08:00:00')
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const formatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{greeting}, Dr. Chen</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatted}
        <span className="mx-2 text-muted-foreground/40">·</span>
        <span className="text-accent">⚡</span>{' '}
        <span>
          {agentSummary.escalations > 0 && (
            <>
              <span className="font-medium text-amber-600">
                {agentSummary.escalations} escalation{agentSummary.escalations !== 1 ? 's' : ''}
              </span>
              <span className="mx-1.5 text-muted-foreground/40">·</span>
            </>
          )}
          {agentSummary.needsReview} items need review
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          {agentSummary.autoCompletedOvernight} auto-completed overnight
        </span>
      </p>
    </div>
  )
}
