import { Suspense } from 'react'
import { TodayGreeting } from '@/components/synapse/today/today-greeting'
import { InterventionStrip } from '@/components/synapse/today/intervention-strip'
import { ReviewQueuePreview } from '@/components/synapse/today/review-queue-preview'
import { ScheduleCard } from '@/components/synapse/today/schedule-card'
import { QuickStats } from '@/components/synapse/today/quick-stats'
import { AgentActivity } from '@/components/synapse/today/agent-activity'
import { RecentPatients } from '@/components/synapse/today/recent-patients'
import {
  mockEscalations,
  mockAgentActions,
  mockAppointments,
  mockAgentActivity,
  mockRecentPatients,
  mockStats,
  mockAgentSummary,
} from '@/lib/mock/today'

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card animate-pulse ${className ?? ''}`}>
      <div className="p-5 space-y-3">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-3 w-full bg-muted/70 rounded" />
        <div className="h-3 w-3/4 bg-muted/70 rounded" />
      </div>
    </div>
  )
}

export default function TodayPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
      {/* Greeting */}
      <Suspense fallback={<div className="h-14 bg-muted/30 rounded animate-pulse" />}>
        <TodayGreeting agentSummary={mockAgentSummary} />
      </Suspense>

      {/* Intervention strip — only renders if escalations > 0 */}
      {mockEscalations.length > 0 && (
        <Suspense fallback={<CardSkeleton />}>
          <InterventionStrip escalation={mockEscalations[0]} />
        </Suspense>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<CardSkeleton className="min-h-64" />}>
            <ReviewQueuePreview
              actions={mockAgentActions}
              totalCount={mockAgentSummary.needsReview}
            />
          </Suspense>

          <Suspense fallback={<CardSkeleton className="min-h-64" />}>
            <ScheduleCard appointments={mockAppointments} />
          </Suspense>
        </div>

        {/* Side column (1/3) */}
        <div className="space-y-6">
          <Suspense fallback={<CardSkeleton className="h-72" />}>
            <QuickStats
              unsignedNotes={mockStats.unsignedNotes}
              unsignedNotesFromYesterday={mockStats.unsignedNotesFromYesterday}
              openTasks={mockStats.openTasks}
              openTasksOverdue={mockStats.openTasksOverdue}
              messagesAwaiting={mockStats.messagesAwaiting}
              messagesUrgent={mockStats.messagesUrgent}
            />
          </Suspense>

          <Suspense fallback={<CardSkeleton className="min-h-64" />}>
            <AgentActivity items={mockAgentActivity} />
          </Suspense>

          <Suspense fallback={<CardSkeleton className="min-h-32" />}>
            <RecentPatients patients={mockRecentPatients} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
