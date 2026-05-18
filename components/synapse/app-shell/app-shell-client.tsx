'use client'

import * as React from 'react'
import { TopBar } from './top-bar'
import { Sidebar } from './sidebar'
import { HotkeysProvider } from './hotkeys-provider'

export function AppShellClient({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  return (
    <HotkeysProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        <TopBar onSidebarToggle={() => setSidebarCollapsed((c) => !c)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar collapsed={sidebarCollapsed} />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </HotkeysProvider>
  )
}
