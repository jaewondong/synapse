'use client'

import * as React from 'react'
import { Search, Bell, Eye, EyeOff, Menu, User, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CommandPalette } from './command-palette'

interface TopBarProps {
  onSidebarToggle: () => void
}

export function TopBar({ onSidebarToggle }: TopBarProps) {
  const [cmdOpen, setCmdOpen] = React.useState(false)
  const [phiHidden, setPhiHidden] = React.useState(false)

  React.useEffect(() => {
    const stored = localStorage.getItem('synapse-phi-hidden')
    if (stored === 'true') setPhiHidden(true)
  }, [])

  const togglePhi = () => {
    const next = !phiHidden
    setPhiHidden(next)
    localStorage.setItem('synapse-phi-hidden', String(next))
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--glass-border)] bg-[var(--glass-bg-strong)] [-webkit-backdrop-filter:var(--glass-blur)] [backdrop-filter:var(--glass-blur)] shadow-[var(--shadow-sm)] px-4">
        <button
          onClick={onSidebarToggle}
          className="rounded p-1.5 hover:bg-muted transition-colors text-muted-foreground"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>

        <span className="font-semibold text-base tracking-tight select-none mr-2">Synapse</span>

        {/* Command palette trigger */}
        <button
          onClick={() => setCmdOpen(true)}
          className="flex flex-1 max-w-md items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 h-8 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search patients, commands…</span>
          <kbd className="hidden sm:flex items-center gap-0.5 text-xs bg-card border border-border rounded px-1.5 py-0.5">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1">
          {/* PHI toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePhi}
            title={phiHidden ? 'Show PHI' : 'Redact PHI'}
            className={cn(phiHidden && 'text-signal-med')}
          >
            {phiHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>

          {/* Notification bell */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-signal-low" />
          </Button>

          {/* Avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
                DC
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Dr. Chen</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="h-3.5 w-3.5" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-3.5 w-3.5" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-signal-low focus:text-signal-low">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  )
}
