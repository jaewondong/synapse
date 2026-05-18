'use client'

import { useState, useMemo, useCallback } from 'react'
import { WeekCalendar } from './week-calendar'
import { AgentChat } from './agent-chat'
import { useAppointments } from '@/lib/hooks/use-appointments'
import { useSchedulingAgent } from '@/lib/hooks/use-scheduling-agent'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function ScheduleShell() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart])

  const { data: appointments = [], isLoading } = useAppointments(weekStart, weekEnd)
  const { messages, isLoading: agentLoading, sendMessage, clearMessages } = useSchedulingAgent()

  const onPrev = useCallback(() => setWeekStart((d) => addDays(d, -7)), [])
  const onNext = useCallback(() => setWeekStart((d) => addDays(d, 7)), [])
  const onToday = useCallback(() => setWeekStart(getWeekStart(new Date())), [])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Calendar — takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <WeekCalendar
          weekStart={weekStart}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
          appointments={appointments}
          isLoading={isLoading}
        />
      </div>

      {/* Agent chat panel — fixed width */}
      <div className="w-96 shrink-0 overflow-hidden">
        <AgentChat
          messages={messages}
          isLoading={agentLoading}
          onSend={sendMessage}
          onClear={clearMessages}
        />
      </div>
    </div>
  )
}
