'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppointmentFromApi } from '@/lib/hooks/use-appointments'
import type { SlotObject } from '@/lib/hooks/use-scheduling-agent'

const START_HOUR = 7
const END_HOUR = 19
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60
const PIXELS_PER_MINUTE = 1.5

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const VISIT_TYPE_COLORS: Record<string, string> = {
  new_patient_eval: 'bg-purple-100 border-purple-300 text-purple-800',
  follow_up: 'bg-blue-100 border-blue-300 text-blue-800',
  procedure: 'bg-amber-100 border-amber-300 text-amber-800',
  infusion: 'bg-green-100 border-green-300 text-green-800',
  telehealth: 'bg-cyan-100 border-cyan-300 text-cyan-800',
  other: 'bg-gray-100 border-gray-300 text-gray-800',
}

function formatHour(hour: number) {
  if (hour === 12) return '12 pm'
  if (hour < 12) return `${hour} am`
  return `${hour - 12} pm`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes()
  const suffix = h >= 12 ? 'pm' : 'am'
  const displayH = h % 12 || 12
  return m === 0 ? `${displayH}${suffix}` : `${displayH}:${String(m).padStart(2, '0')}${suffix}`
}

function toPixels(iso: string): number {
  const d = new Date(iso)
  return ((d.getHours() - START_HOUR) * 60 + d.getMinutes()) * PIXELS_PER_MINUTE
}

function durationPixels(startIso: string, endIso: string): number {
  const start = new Date(startIso)
  const end = new Date(endIso)
  return ((end.getTime() - start.getTime()) / 60_000) * PIXELS_PER_MINUTE
}

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

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

interface WeekCalendarProps {
  weekStart: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  appointments: AppointmentFromApi[]
  isLoading?: boolean
  proposedSlot?: SlotObject | null
  bookedSlot?: SlotObject | null
}

export function WeekCalendar({
  weekStart,
  onPrev,
  onNext,
  onToday,
  appointments,
  isLoading,
  proposedSlot,
  bookedSlot,
}: WeekCalendarProps) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const gridHeight = TOTAL_MINUTES * PIXELS_PER_MINUTE

  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6)
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(weekStart)} – ${fmt(end)}, ${end.getFullYear()}`
  }, [weekStart])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onToday}
            className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors font-medium"
          >
            Today
          </button>
          <button
            onClick={onPrev}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onNext}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">{weekLabel}</span>
        </div>
        {isLoading && (
          <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>
        )}
      </div>

      {/* Day header row */}
      <div className="flex shrink-0 border-b border-border">
        <div className="w-14 shrink-0" />
        {days.map((day, idx) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={idx} className="flex-1 py-2 text-center border-l border-border first:border-l-0">
              <div className="text-[10px] font-medium uppercase text-muted-foreground">
                {DAY_LABELS[idx]}
              </div>
              <div
                className={cn(
                  'mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold',
                  isToday ? 'bg-accent text-white' : 'text-foreground',
                )}
              >
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="flex flex-1 overflow-y-auto">
        {/* Hour gutter */}
        <div className="w-14 shrink-0 relative" style={{ height: gridHeight }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute right-2 text-[10px] text-muted-foreground"
              style={{ top: (h - START_HOUR) * 60 * PIXELS_PER_MINUTE - 7 }}
            >
              {h > START_HOUR ? formatHour(h) : ''}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, dayIdx) => {
          const dayAppts = appointments.filter((a) => {
            const d = new Date(a.starts_at)
            return isSameDay(d, day)
          })

          return (
            <div
              key={dayIdx}
              className="flex-1 relative border-l border-border"
              style={{ height: gridHeight }}
            >
              {/* Hour lines */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-border/50"
                  style={{ top: (h - START_HOUR) * 60 * PIXELS_PER_MINUTE }}
                />
              ))}

              {/* Appointments */}
              {dayAppts.map((appt) => {
                const top = toPixels(appt.starts_at)
                const height = Math.max(durationPixels(appt.starts_at, appt.ends_at), 20)
                const colorClass =
                  VISIT_TYPE_COLORS[appt.visit_type] ?? VISIT_TYPE_COLORS.other
                const patientName = appt.patient
                  ? `${appt.patient.first_name} ${appt.patient.last_name}`
                  : 'Unknown'

                return (
                  <div
                    key={appt.id}
                    className={cn(
                      'absolute left-1 right-1 rounded border px-1.5 py-0.5 overflow-hidden cursor-pointer hover:brightness-95 transition-all',
                      colorClass,
                    )}
                    style={{ top, height }}
                    title={`${patientName} · ${appt.visit_type} · ${formatTime(appt.starts_at)}`}
                  >
                    <p className="text-[11px] font-semibold leading-tight truncate">{patientName}</p>
                    {height > 28 && (
                      <p className="text-[10px] leading-tight truncate opacity-75">
                        {formatTime(appt.starts_at)} · {appt.visit_type.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                )
              })}

              {/* Proposed slot preview — dashed green outline */}
              {proposedSlot && isSameDay(new Date(proposedSlot.datetime), day) && (() => {
                const top = toPixels(proposedSlot.datetime)
                const height = Math.max(proposedSlot.duration_min * PIXELS_PER_MINUTE, 20)
                return (
                  <div
                    key="proposed"
                    className="absolute left-1 right-1 rounded border-2 border-dashed border-green-400 bg-green-50/70 px-1.5 py-0.5 overflow-hidden pointer-events-none"
                    style={{ top, height }}
                  >
                    <p className="text-[10px] font-semibold text-green-700 leading-tight">
                      Proposed · {formatTime(proposedSlot.datetime)}
                    </p>
                  </div>
                )
              })()}

              {/* Booked slot — optimistic filled block */}
              {bookedSlot && isSameDay(new Date(bookedSlot.datetime), day) && (() => {
                const top = toPixels(bookedSlot.datetime)
                const height = Math.max(bookedSlot.duration_min * PIXELS_PER_MINUTE, 20)
                return (
                  <div
                    key="booked"
                    className="absolute left-1 right-1 rounded border border-green-300 bg-green-100 text-green-800 px-1.5 py-0.5 overflow-hidden"
                    style={{ top, height }}
                    title={`${bookedSlot.visit_type} · ${bookedSlot.provider_name} · ${formatTime(bookedSlot.datetime)}`}
                  >
                    <p className="text-[11px] font-semibold leading-tight truncate">
                      {bookedSlot.visit_type}
                    </p>
                    {height > 28 && (
                      <p className="text-[10px] leading-tight truncate opacity-75">
                        {formatTime(bookedSlot.datetime)} · {bookedSlot.provider_name}
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
