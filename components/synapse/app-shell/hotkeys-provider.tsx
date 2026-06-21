'use client'

import * as React from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Keyboard } from 'lucide-react'

const shortcuts = [
  { keys: '⌘K', description: 'Open command palette' },
  { keys: '⌘/', description: 'Focus search' },
  { keys: '⌘P', description: 'Patient lookup' },
  { keys: 'G T', description: 'Go to Today' },
  { keys: 'G I', description: 'Go to Inbox' },
  { keys: 'G S', description: 'Go to Schedule' },
  { keys: 'G P', description: 'Go to Patients' },
  { keys: '?', description: 'Show keyboard shortcuts' },
  { keys: 'J / K', description: 'Navigate review queue' },
  { keys: 'A', description: 'Approve focused item' },
  { keys: 'R', description: 'Reject focused item' },
  { keys: 'E', description: 'Edit focused item' },
  { keys: 'Space', description: 'Toggle select' },
  { keys: 'Shift+A', description: 'Bulk approve selected' },
]

export function HotkeysProvider({ children }: { children: React.ReactNode }) {
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false)
  const gKeyTime = React.useRef<number>(0)

  useHotkeys('?', () => setShortcutsOpen(true), { preventDefault: true })

  useHotkeys(
    'mod+/',
    () => {
      const searchInput = document.querySelector<HTMLButtonElement>('[data-search-trigger]')
      searchInput?.click()
    },
    { preventDefault: true }
  )

  useHotkeys('g', () => {
    gKeyTime.current = Date.now()
  })

  useHotkeys('t', () => {
    if (Date.now() - gKeyTime.current < 600) {
      window.location.href = '/'
      gKeyTime.current = 0
    }
  })

  useHotkeys('i', () => {
    if (Date.now() - gKeyTime.current < 600) {
      window.location.href = '/inbox'
      gKeyTime.current = 0
    }
  })

  useHotkeys('s', () => {
    if (Date.now() - gKeyTime.current < 600) {
      window.location.href = '/schedule'
      gKeyTime.current = 0
    }
  })

  useHotkeys('p', () => {
    if (Date.now() - gKeyTime.current < 600) {
      window.location.href = '/lookup'
      gKeyTime.current = 0
    }
  })

  useHotkeys(
    'mod+p',
    () => {
      window.location.href = '/lookup'
    },
    { preventDefault: true }
  )

  return (
    <>
      {children}
      <Sheet open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Keyboard shortcuts
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-1">
            {shortcuts.map((s) => (
              <div key={s.keys} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{s.description}</span>
                <kbd className="text-xs bg-muted border border-border rounded px-2 py-0.5 font-mono">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
