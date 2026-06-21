'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { AgentEvent } from '@/lib/agents/scheduling-agent'

export type ToolCallUI = {
  name: string
  input: Record<string, unknown>
  result?: unknown
}

export type SlotObject = {
  datetime: string
  provider_name: string
  visit_type: string
  duration_min: number
  location: string
  modality: 'In-person' | 'Telehealth'
  no_show_risk: 'Low' | 'Medium' | 'High'
  eligibility_status: 'OK' | 'Needs re-verification' | 'Pre-auth required'
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  type?: 'text' | 'slot_proposal' | 'slot_alternatives'
  toolCalls?: ToolCallUI[]
  isStreaming?: boolean
  isError?: boolean
  // slot_proposal fields
  rationale?: string
  slot?: SlotObject
  confidence?: number
  explanation?: string
  slotActions?: Array<{ label: string; kind: 'primary' | 'secondary' }>
  // slot_alternatives fields
  intro?: string
  slots?: Array<SlotObject & { selectId: string }>
}

const WRITE_TOOLS = new Set(['create_appointment', 'reschedule_appointment', 'cancel_appointment'])

export function useSchedulingAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()
  const abortRef = useRef<AbortController | null>(null)

  // Abort any in-flight stream when the consumer unmounts (no leaked reader).
  useEffect(() => () => abortRef.current?.abort(), [])

  const seedConversation = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: crypto.randomUUID() }])
  }, [])

  const sendMessage = async (content: string) => {
    if (isLoading) return

    const userId = crypto.randomUUID()
    const assistantId = crypto.randomUUID()

    setMessages((prev) => [
      ...prev,
      { id: userId, role: 'user', content },
      { id: assistantId, role: 'assistant', content: '', toolCalls: [], isStreaming: true },
    ])
    setIsLoading(true)

    // Build Anthropic-format history from display messages (text only)
    const history = messages
      .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content))
      .map((m) => ({ role: m.role, content: m.content }))
    history.push({ role: 'user', content })

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/scheduling-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = line.slice(6).trim()
          if (!json) continue

          let event: AgentEvent
          try {
            event = JSON.parse(json) as AgentEvent
          } catch {
            continue
          }

          if (event.type === 'text') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + event.delta } : m,
              ),
            )
          } else if (event.type === 'tool_call') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, toolCalls: [...(m.toolCalls ?? []), { name: event.name, input: event.input }] }
                  : m,
              ),
            )
          } else if (event.type === 'tool_result') {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantId) return m
                const toolCalls = [...(m.toolCalls ?? [])]
                const lastIdx = toolCalls.length - 1
                if (lastIdx >= 0) toolCalls[lastIdx] = { ...toolCalls[lastIdx], result: event.result }
                return { ...m, toolCalls }
              }),
            )
            if (WRITE_TOOLS.has(event.name)) {
              queryClient.invalidateQueries({ queryKey: ['appointments'] })
            }
          } else if (event.type === 'done') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, isStreaming: false } : m,
              ),
            )
          } else if (event.type === 'error') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: event.message, isStreaming: false, isError: true }
                  : m,
              ),
            )
          }
        }
      }
    } catch (err) {
      // Aborted streams (unmount / clear) are intentional — don't surface as an error.
      if (err instanceof DOMException && err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: message, isStreaming: false, isError: true }
            : m,
        ),
      )
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setIsLoading(false)
    }
  }

  const clearMessages = () => {
    abortRef.current?.abort()
    setMessages([])
  }

  return { messages, isLoading, sendMessage, clearMessages, seedConversation }
}
