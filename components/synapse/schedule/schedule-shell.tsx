'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { WeekCalendar } from './week-calendar'
import { AgentChat } from './agent-chat'
import { PatientContextChip } from './patient-context-chip'
import { useAppointments } from '@/lib/hooks/use-appointments'
import { useSchedulingAgent } from '@/lib/hooks/use-scheduling-agent'
import type { SlotObject } from '@/lib/hooks/use-scheduling-agent'

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

function formatBookingConfirmation(slot: SlotObject): string {
  const d = new Date(slot.datetime)
  const datePart = d.toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit' })
  const h = d.getHours()
  const m = d.getMinutes()
  const suffix = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 || 12
  const timePart = m === 0
    ? `${displayH}:00 ${suffix}`
    : `${displayH}:${String(m).padStart(2, '0')} ${suffix}`
  return `Booked · ${datePart} ${timePart} with ${slot.provider_name}`
}

export interface PatientCtx {
  mrn: string
  name: string
  initials: string
  sex: string
  age: number
  allergyCount: number
  isDeceased: boolean
}

interface ScheduleShellProps {
  patient?: PatientCtx
  intent?: string
  returnTo?: string
  notFoundMrn?: string
}

export function ScheduleShell({ patient: initialPatient, intent = 'book', returnTo, notFoundMrn }: ScheduleShellProps) {
  const router = useRouter()
  const [patient, setPatient] = useState(initialPatient ?? null)
  const [proposedSlot, setProposedSlot] = useState<SlotObject | null>(null)
  const [bookedSlot, setBookedSlot] = useState<SlotObject | null>(null)
  const seedSentRef = useRef(false)

  const defaultReturnTo = patient ? `/chart/${patient.mrn}` : '/lookup'
  const chartReturnTo = returnTo ?? defaultReturnTo

  // Initialize week 2 weeks out when scheduling for a patient, otherwise current week
  const [weekStart, setWeekStart] = useState(() =>
    initialPatient && !initialPatient.isDeceased
      ? getWeekStart(addDays(new Date(), 14))
      : getWeekStart(new Date()),
  )
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart])

  const { data: appointments = [], isLoading } = useAppointments(weekStart, weekEnd)
  const { messages, isLoading: agentLoading, sendMessage, clearMessages, seedConversation } =
    useSchedulingAgent()

  const onPrev = useCallback(() => setWeekStart((d) => addDays(d, -7)), [])
  const onNext = useCallback(() => setWeekStart((d) => addDays(d, 7)), [])
  const onToday = useCallback(() => setWeekStart(getWeekStart(new Date())), [])

  // "Patient not found" toast on mount
  useEffect(() => {
    if (notFoundMrn) {
      toast.error(`Patient ${notFoundMrn} not found — context cleared.`)
    }
  }, [notFoundMrn])

  // Seed the conversation once when patient context is present
  useEffect(() => {
    if (!patient || seedSentRef.current) return
    seedSentRef.current = true

    if (patient.isDeceased) {
      seedConversation({
        role: 'assistant',
        content: `I can't schedule an appointment for ${patient.name} — this patient is marked as deceased in the system. The calendar is still available for viewing.`,
        type: 'text',
      })
      return
    }

    // Build proposed slot: 14 days out, 10:30 AM
    const slotDate = addDays(new Date(), 14)
    slotDate.setHours(10, 30, 0, 0)

    const slot: SlotObject = {
      datetime: slotDate.toISOString(),
      provider_name: 'Dr. R. Chen',
      visit_type: 'Neuro follow-up',
      duration_min: 30,
      location: 'UCSF Neurology Clinic, Room 204',
      modality: 'In-person',
      no_show_risk: 'Low',
      eligibility_status: 'OK',
    }

    seedConversation({
      role: 'assistant',
      content: '',
      type: 'slot_proposal',
      rationale: `I've drafted a booking for **${patient.name}** based on Dr. Chen's follow-up protocol after the 5/2 visit.`,
      slot,
      confidence: 95,
      explanation:
        "Slot selected based on Dr. Chen's follow-up protocol for neurology patients. Next available morning slot at least 14 days out, matching this patient's historical appointment time preference. 100% prior appointment adherence → Low no-show risk.",
      slotActions: [
        { label: 'Approve & book', kind: 'primary' },
        { label: 'Show alternatives', kind: 'secondary' },
      ],
    })

    setProposedSlot(slot)
  }, [patient, seedConversation])

  const handleApproveSlot = useCallback(
    (slot: SlotObject) => {
      setProposedSlot(null)
      setBookedSlot(slot)
      toast(formatBookingConfirmation(slot), {
        duration: 8000,
        action: {
          label: 'Return to chart',
          onClick: () => router.push(chartReturnTo),
        },
      })
    },
    [router, chartReturnTo],
  )

  const handleShowAlternatives = useCallback(
    (_messageId: string) => {
      const base = addDays(new Date(), 14)

      const makeSlot = (daysOffset: number, hour: number, minute: number, overrides: Partial<SlotObject> = {}): SlotObject & { selectId: string } => {
        const d = addDays(base, daysOffset)
        d.setHours(hour, minute, 0, 0)
        return {
          selectId: crypto.randomUUID(),
          datetime: d.toISOString(),
          provider_name: 'Dr. R. Chen',
          visit_type: 'Neuro follow-up',
          duration_min: 30,
          location: 'UCSF Neurology Clinic, Room 204',
          modality: 'In-person',
          no_show_risk: 'Low',
          eligibility_status: 'OK',
          ...overrides,
        }
      }

      seedConversation({
        role: 'assistant',
        content: '',
        type: 'slot_alternatives',
        intro: 'Three other options:',
        slots: [
          makeSlot(0, 14, 0),
          makeSlot(1, 10, 0, { modality: 'Telehealth' }),
          makeSlot(2, 9, 0, { provider_name: 'Dr. S. Patel', duration_min: 45, location: 'UCSF Neurology Clinic, Room 108', no_show_risk: 'Medium' }),
        ],
      })
    },
    [seedConversation],
  )

  const handleSelectAlternative = useCallback(
    (slot: SlotObject) => {
      setProposedSlot(slot)
      // Scroll calendar to the week containing this slot
      setWeekStart(getWeekStart(new Date(slot.datetime)))
      seedConversation({
        role: 'assistant',
        content: '',
        type: 'slot_proposal',
        rationale: `Updated proposal: **${slot.modality}** with **${slot.provider_name}**.`,
        slot,
        confidence: 88,
        explanation: 'Selected from alternatives based on your preference.',
        slotActions: [
          { label: 'Approve & book', kind: 'primary' },
          { label: 'Show alternatives', kind: 'secondary' },
        ],
      })
    },
    [seedConversation],
  )

  const handleClearPatient = useCallback(() => {
    setPatient(null)
    setProposedSlot(null)
    setBookedSlot(null)
    clearMessages()
    seedSentRef.current = false
    setWeekStart(getWeekStart(new Date()))
    window.history.replaceState(null, '', '/schedule')
  }, [clearMessages])

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Patient context chip — spans full width above calendar/agent split */}
      {patient && (
        <PatientContextChip
          mrn={patient.mrn}
          name={patient.name}
          initials={patient.initials}
          sex={patient.sex}
          age={patient.age}
          allergyCount={patient.allergyCount}
          returnTo={chartReturnTo}
          onClear={handleClearPatient}
        />
      )}

      {/* Main two-pane layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar — takes remaining space */}
        <div className="flex-1 overflow-hidden">
          <WeekCalendar
            weekStart={weekStart}
            onPrev={onPrev}
            onNext={onNext}
            onToday={onToday}
            appointments={appointments}
            isLoading={isLoading}
            proposedSlot={proposedSlot}
            bookedSlot={bookedSlot}
          />
        </div>

        {/* Agent chat panel — fixed width */}
        <div className="w-96 shrink-0 overflow-hidden">
          <AgentChat
            messages={messages}
            isLoading={agentLoading}
            onSend={sendMessage}
            onClear={clearMessages}
            onApproveSlot={handleApproveSlot}
            onShowAlternatives={handleShowAlternatives}
            onSelectAlternative={handleSelectAlternative}
          />
        </div>
      </div>
    </div>
  )
}
