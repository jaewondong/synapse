'use client'

import { useRef, useEffect, useState, type FormEvent } from 'react'
import {
  SendHorizonal,
  Bot,
  User,
  Loader2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage, SlotObject, ToolCallUI } from '@/lib/hooks/use-scheduling-agent'

const TOOL_LABELS: Record<string, string> = {
  list_appointments: 'Listed appointments',
  search_patients: 'Searched patients',
  get_providers: 'Fetched providers',
  create_appointment: 'Created appointment',
  reschedule_appointment: 'Rescheduled appointment',
  cancel_appointment: 'Cancelled appointment',
}

function formatSlotDateTime(iso: string): string {
  const d = new Date(iso)
  const datePart = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const h = d.getHours()
  const m = d.getMinutes()
  const suffix = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 || 12
  const timePart = m === 0
    ? `${displayH}:00 ${suffix}`
    : `${displayH}:${String(m).padStart(2, '0')} ${suffix}`
  return `${datePart} · ${timePart}`
}

function renderBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  )
}

function ToolCallBadge({ call }: { call: ToolCallUI }) {
  const [open, setOpen] = useState(false)
  const label = TOOL_LABELS[call.name] ?? call.name
  const isDone = call.result !== undefined

  return (
    <div className="mt-1.5 rounded-md border border-border bg-muted/50 text-xs overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 hover:bg-muted/70 transition-colors text-left"
      >
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            isDone ? 'bg-confidence-high' : 'bg-confidence-medium animate-pulse',
          )}
        />
        <span className="font-medium text-muted-foreground flex-1">{label}</span>
        {open ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-2.5 pb-2 space-y-1 border-t border-border/60">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground/60 mt-1.5">Input</p>
          <pre className="text-[10px] overflow-x-auto text-muted-foreground">
            {JSON.stringify(call.input, null, 2)}
          </pre>
          {call.result !== undefined && (
            <>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground/60 mt-1.5">Result</p>
              <pre className="text-[10px] overflow-x-auto text-muted-foreground max-h-32 overflow-y-auto">
                {JSON.stringify(call.result, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function SlotCard({ slot }: { slot: SlotObject }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 space-y-2">
      <div>
        <p className="text-sm font-semibold">{formatSlotDateTime(slot.datetime)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {slot.visit_type} · {slot.provider_name} · {slot.duration_min} min · {slot.modality}
        </p>
        <p className="text-xs text-muted-foreground">{slot.location}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium border',
            slot.no_show_risk === 'Low'
              ? 'bg-signal-high-bg text-signal-high border-signal-high/30'
              : slot.no_show_risk === 'Medium'
              ? 'bg-signal-med-bg text-signal-med border-signal-med/30'
              : 'bg-signal-low-bg text-signal-low border-signal-low/30',
          )}
        >
          No-show risk: {slot.no_show_risk}
        </span>
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium border',
            slot.eligibility_status === 'OK'
              ? 'bg-chart-info-bg text-chart-info-text border-chart-info-text/20'
              : 'bg-chart-warning-bg text-chart-warning-text border-chart-warning-border',
          )}
        >
          Eligibility {slot.eligibility_status}
        </span>
      </div>
    </div>
  )
}

function SlotProposalCard({
  msg,
  onApprove,
  onAlternatives,
}: {
  msg: ChatMessage
  onApprove: (slot: SlotObject) => void
  onAlternatives: (messageId: string) => void
}) {
  const [showWhy, setShowWhy] = useState(false)
  const [approved, setApproved] = useState(false)

  if (!msg.slot) return null

  const handleApprove = () => {
    setApproved(true)
    onApprove(msg.slot!)
  }

  return (
    <div className="flex-1 min-w-0 max-w-[90%] space-y-2">
      {msg.rationale && (
        <p className="text-sm text-foreground">{renderBold(msg.rationale)}</p>
      )}

      <SlotCard slot={msg.slot} />

      {/* Actions */}
      {!approved ? (
        <div className="flex items-center gap-2">
          <button
            onClick={handleApprove}
            className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:brightness-110 transition-all"
          >
            Approve & book
          </button>
          <button
            onClick={() => onAlternatives(msg.id)}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
          >
            Show alternatives
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-confidence-high font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Booking confirmed
        </div>
      )}

      {/* Audit strip */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-confidence-high shrink-0" />
        <span>Scheduling Agent · {msg.confidence}% confidence ·</span>
        <button
          onClick={() => setShowWhy((v) => !v)}
          className="text-accent hover:underline"
        >
          why this slot?
        </button>
      </div>
      {showWhy && msg.explanation && (
        <div className="rounded-md bg-muted/50 border border-border px-2.5 py-2 text-[11px] text-muted-foreground">
          {msg.explanation}
        </div>
      )}
    </div>
  )
}

function SlotAlternativesCard({
  msg,
  onSelect,
}: {
  msg: ChatMessage
  onSelect: (slot: SlotObject) => void
}) {
  if (!msg.slots) return null

  return (
    <div className="flex-1 min-w-0 max-w-[90%] space-y-2">
      {msg.intro && (
        <p className="text-sm text-muted-foreground">{msg.intro}</p>
      )}
      {msg.slots.map((slot) => (
        <div key={slot.selectId} className="rounded-xl border border-border bg-background p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{formatSlotDateTime(slot.datetime)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {slot.visit_type} · {slot.provider_name} · {slot.modality}
              </p>
            </div>
            <button
              onClick={() => onSelect(slot)}
              className="shrink-0 px-2.5 py-1 rounded-lg border border-border text-xs font-medium hover:bg-accent hover:text-white hover:border-accent transition-all"
            >
              Select
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function MessageBubble({
  msg,
  onApproveSlot,
  onShowAlternatives,
  onSelectAlternative,
}: {
  msg: ChatMessage
  onApproveSlot?: (slot: SlotObject) => void
  onShowAlternatives?: (messageId: string) => void
  onSelectAlternative?: (slot: SlotObject) => void
}) {
  const isUser = msg.role === 'user'

  if (msg.type === 'slot_proposal' && msg.slot) {
    return (
      <div className="flex gap-2.5 flex-row">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5 bg-agent-tint border border-border text-accent">
          <Bot className="h-3 w-3" />
        </div>
        <SlotProposalCard
          msg={msg}
          onApprove={onApproveSlot ?? (() => {})}
          onAlternatives={onShowAlternatives ?? (() => {})}
        />
      </div>
    )
  }

  if (msg.type === 'slot_alternatives' && msg.slots) {
    return (
      <div className="flex gap-2.5 flex-row">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5 bg-agent-tint border border-border text-accent">
          <Bot className="h-3 w-3" />
        </div>
        <SlotAlternativesCard msg={msg} onSelect={onSelectAlternative ?? (() => {})} />
      </div>
    )
  }

  return (
    <div className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5',
          isUser ? 'bg-accent text-white' : 'bg-agent-tint border border-border text-accent',
        )}
      >
        {isUser ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
      </div>

      <div className={cn('flex-1 space-y-1', isUser && 'items-end flex flex-col')}>
        <div
          className={cn(
            'max-w-[90%] rounded-xl px-3 py-2 text-sm',
            isUser
              ? 'bg-accent text-white rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm',
            msg.isError && 'bg-signal-low-bg text-signal-low border border-signal-low/30',
          )}
        >
          {msg.content || (msg.isStreaming && !msg.toolCalls?.length ? '' : null)}
          {msg.isStreaming && !msg.content && !msg.toolCalls?.length && (
            <span className="inline-flex gap-0.5">
              <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
              <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
              <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
            </span>
          )}
        </div>

        {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="w-full max-w-[90%]">
            {msg.toolCalls.map((call, idx) => (
              <ToolCallBadge key={idx} call={call} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  'What appointments are scheduled this week?',
  'Schedule a follow-up for Maria Lopez with Dr. Chen next Monday at 9am',
  'Show me all providers',
]

interface AgentChatProps {
  messages: ChatMessage[]
  isLoading: boolean
  onSend: (content: string) => void
  onClear: () => void
  onApproveSlot?: (slot: SlotObject) => void
  onShowAlternatives?: (messageId: string) => void
  onSelectAlternative?: (slot: SlotObject) => void
}

export function AgentChat({
  messages,
  isLoading,
  onSend,
  onClear,
  onApproveSlot,
  onShowAlternatives,
  onSelectAlternative,
}: AgentChatProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <div className="flex flex-col h-full border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-agent-tint border border-border">
            <Bot className="h-3 w-3 text-accent" />
          </div>
          <span className="text-sm font-semibold">Scheduling Agent</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Clear conversation"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-agent-tint border border-border">
              <Bot className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium">Scheduling Agent</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ask me to schedule, reschedule, or cancel appointments.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="rounded-lg border border-border px-3 py-2 text-xs text-left hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onApproveSlot={onApproveSlot}
              onShowAlternatives={onShowAlternatives}
              onSelectAlternative={onSelectAlternative}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={autoResize}
            onKeyDown={handleKeyDown}
            placeholder="Ask the scheduling agent…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground min-h-[1.5rem] max-h-[7.5rem]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white disabled:opacity-40 transition-opacity"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <SendHorizonal className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground/60 text-center">
          Enter to send · Shift+Enter for newline
        </p>
      </form>
    </div>
  )
}
