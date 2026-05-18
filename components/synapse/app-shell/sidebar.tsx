'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  Inbox,
  Calendar,
  Users,
  FileText,
  CreditCard,
  Bot,
  BarChart2,
  ScrollText,
  ShieldCheck,
  Settings,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

interface SidebarProps {
  collapsed: boolean
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  shortcut?: string
}

const mainNav: NavItem[] = [
  { label: 'Today', href: '/', icon: CalendarDays, shortcut: 'G T' },
  { label: 'Inbox', href: '/inbox', icon: Inbox, shortcut: 'G I' },
  { label: 'Schedule', href: '/schedule', icon: Calendar, shortcut: 'G S' },
  { label: 'Patients', href: '/patients', icon: Users, shortcut: 'G P' },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Billing', href: '/billing', icon: CreditCard },
]

const agentNav: NavItem[] = [
  { label: 'Agents', href: '/agents', icon: Bot, shortcut: 'G G' },
  { label: 'Audit log', href: '/audit', icon: ScrollText, shortcut: 'G A' },
  { label: 'Reports', href: '/reports', icon: BarChart2 },
]

const adminNav: NavItem[] = [
  { label: 'Admin', href: '/admin', icon: ShieldCheck },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Help', href: '/help', icon: HelpCircle },
]

function NavItemRow({
  item,
  collapsed,
  active,
}: {
  item: NavItem
  collapsed: boolean
  active: boolean
}) {
  const Icon = item.icon

  const inner = (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
        active
          ? 'bg-agent-tint text-accent font-medium border-l-2 border-accent -ml-px pl-[9px]'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.shortcut && (
            <span className="hidden group-hover:flex text-xs text-muted-foreground/60 font-mono">
              {item.shortcut}
            </span>
          )}
        </>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent side="right">
          <span>{item.label}</span>
          {item.shortcut && <span className="ml-2 opacity-60">{item.shortcut}</span>}
        </TooltipContent>
      </Tooltip>
    )
  }

  return inner
}

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-1 border-t border-border" />
  return (
    <p className="mt-4 mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
      {label}
    </p>
  )
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card h-full transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          <SectionLabel label="Main" collapsed={collapsed} />
          {mainNav.map((item) => (
            <NavItemRow
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={pathname === item.href}
            />
          ))}

          <SectionLabel label="Agents & Insights" collapsed={collapsed} />
          {agentNav.map((item) => (
            <NavItemRow
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={pathname === item.href}
            />
          ))}
        </nav>

        {/* Bottom-pinned admin section */}
        <div className="border-t border-border py-3 px-2 space-y-0.5">
          {adminNav.map((item) => (
            <NavItemRow
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={pathname === item.href}
            />
          ))}
        </div>
      </aside>
    </TooltipProvider>
  )
}
