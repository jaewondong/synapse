'use client'

import * as React from 'react'
import { Command } from 'cmdk'
import { Search, Calendar, Users, FileText, Inbox, Bot, BarChart2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const commands = [
  { label: 'Go to Today', icon: Calendar, shortcut: 'G T', href: '/' },
  { label: 'Go to Inbox', icon: Inbox, shortcut: 'G I', href: '/inbox' },
  { label: 'Go to Schedule', icon: Calendar, shortcut: 'G S', href: '/schedule' },
  { label: 'Go to Patients', icon: Users, shortcut: 'G P', href: '/lookup' },
  { label: 'Go to Documents', icon: FileText, shortcut: '', href: '/documents' },
  { label: 'Go to Agents', icon: Bot, shortcut: '', href: '/agents' },
  { label: 'Go to Reports', icon: BarChart2, shortcut: '', href: '/reports' },
  { label: 'Go to Settings', icon: Settings, shortcut: '', href: '/settings' },
]

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div
        className="absolute inset-0 bg-[rgba(15,23,42,0.40)] backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />
      {/* Signature glass surface (§7.1) — the most premium moment in the app */}
      <div className="glass glass--text relative w-full max-w-lg rounded-[var(--radius-xl)] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        <Command className="[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-border">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Search patients, commands…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
              esc
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
              {commands.map((cmd) => (
                <Command.Item
                  key={cmd.href}
                  value={cmd.label}
                  onSelect={() => {
                    onOpenChange(false)
                    window.location.href = cmd.href
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm cursor-pointer',
                    'data-[selected=true]:bg-agent-tint data-[selected=true]:text-foreground',
                    'aria-selected:bg-agent-tint'
                  )}
                >
                  <cmd.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{cmd.label}</span>
                  {cmd.shortcut && (
                    <span className="text-xs text-muted-foreground">{cmd.shortcut}</span>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
