import { create } from 'zustand'

interface InboxStore {
  // Shared dismissed IDs — syncs Today preview + Inbox list
  dismissedIds: Set<string>
  dismissAction: (id: string) => void
  restoreAction: (id: string) => void

  // Inbox-only: multi-select
  selectedIds: Set<string>
  toggleSelect: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void

  // Inbox-only: keyboard-focused card
  focusedId: string | null
  setFocused: (id: string | null) => void

  // Approval velocity tracking (anti-rubber-stamp)
  recentApprovalTimestamps: number[]
  recordIndividualApproval: () => boolean // returns true if velocity exceeded
}

export const useInboxStore = create<InboxStore>((set, get) => ({
  dismissedIds: new Set(),
  dismissAction: (id) =>
    set((s) => ({ dismissedIds: new Set(s.dismissedIds).add(id) })),
  restoreAction: (id) =>
    set((s) => {
      const next = new Set(s.dismissedIds)
      next.delete(id)
      return { dismissedIds: next }
    }),

  selectedIds: new Set(),
  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedIds: next }
    }),
  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  clearSelection: () => set({ selectedIds: new Set(), focusedId: null }),

  focusedId: null,
  setFocused: (id) => set({ focusedId: id }),

  recentApprovalTimestamps: [],
  recordIndividualApproval: () => {
    const now = Date.now()
    const prev = get().recentApprovalTimestamps
    const updated = [...prev, now].slice(-10)
    set({ recentApprovalTimestamps: updated })

    if (updated.length < 4) return false
    const intervals = updated
      .slice(1)
      .map((t, i) => t - updated[i])
      .sort((a, b) => a - b)
    const median = intervals[Math.floor(intervals.length / 2)]
    return median < 800
  },
}))
