'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-[rgba(15,23,42,0.45)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = 'SheetOverlay'

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: 'top' | 'bottom' | 'left' | 'right'
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 bg-surface shadow-[var(--shadow-overlay)] transition-transform duration-300 ease-in-out flex flex-col',
        side === 'right' && 'inset-y-0 right-0 w-80 data-[state=open]:slide-in-from-right',
        side === 'left' && 'inset-y-0 left-0 w-80 data-[state=open]:slide-in-from-left',
        side === 'bottom' && 'inset-x-0 bottom-0 h-96 data-[state=open]:slide-in-from-bottom',
        side === 'top' && 'inset-x-0 top-0 h-96 data-[state=open]:slide-in-from-top',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <DialogPrimitive.Title className="text-sm font-semibold" />
        <SheetClose className="rounded p-1 opacity-70 hover:opacity-100 hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetClose>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
    </DialogPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = 'SheetContent'

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5', className)} {...props} />
)
SheetHeader.displayName = 'SheetHeader'

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-base font-semibold', className)}
    {...props}
  />
))
SheetTitle.displayName = 'SheetTitle'

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle }
