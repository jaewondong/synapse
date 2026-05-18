'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { AgentEvent } from '@/lib/agents/scheduling-agent'

export type ToolCallUI = {
  name: string
  input: Record<string, unknown>
  result?: unknown
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCallUI[]
  isStreaming?: boolean
  isError?: boolean
}

const WRITE_TOOLS = new Set(['create_appointment', 'reschedule_appointment', 'cancel_appointment'])

export function useSchedulingAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

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

    try {
      const res = await fetch('/api/scheduling-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
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
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: message, isStreaming: false, isError: true }
            : m,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const clearMessages = () => setMessages([])

  return { messages, isLoading, sendMessage, clearMessages }
}
