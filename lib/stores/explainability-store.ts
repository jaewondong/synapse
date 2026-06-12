import { create } from 'zustand'
import {
  isExplainabilityRef,
  resolveExplainability,
  type ExplainabilityPayload,
  type ExplainabilityRef,
} from '@/lib/explainability'

interface ExplainabilityState {
  isOpen: boolean
  payload: ExplainabilityPayload | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  // Kept so retry / footer links work in both invocation forms.
  lastRef: ExplainabilityRef | null
  open: (input: ExplainabilityPayload | ExplainabilityRef) => void
  retry: () => void
  close: () => void
}

// Drawer close animation duration — content isn't blanked mid-slide.
const CLOSE_ANIMATION_MS = 300

export const useExplainabilityStore = create<ExplainabilityState>((set, get) => {
  async function resolve(ref: ExplainabilityRef) {
    set({ isOpen: true, status: 'loading', payload: null, lastRef: ref })
    try {
      const payload = await resolveExplainability(ref)
      // Bail if the drawer was closed (or re-opened for something else) mid-fetch.
      if (get().lastRef?.auditId !== ref.auditId || !get().isOpen) return
      set({ status: 'ready', payload })
    } catch {
      if (get().lastRef?.auditId !== ref.auditId || !get().isOpen) return
      set({ status: 'error', payload: null })
    }
  }

  return {
    isOpen: false,
    payload: null,
    status: 'idle',
    lastRef: null,

    open: (input) => {
      if (isExplainabilityRef(input)) {
        void resolve(input)
      } else {
        // Surface already has the data — open instantly in ready.
        set({ isOpen: true, status: 'ready', payload: input, lastRef: null })
      }
    },

    retry: () => {
      const ref = get().lastRef
      if (ref) void resolve(ref)
    },

    close: () => {
      set({ isOpen: false })
      setTimeout(() => {
        // Only reset if nothing re-opened during the animation.
        if (!get().isOpen) set({ status: 'idle', payload: null, lastRef: null })
      }, CLOSE_ANIMATION_MS)
    },
  }
})
