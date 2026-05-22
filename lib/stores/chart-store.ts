import { create } from 'zustand'

interface ChartHistoryEntry {
  mrn: string
  name: string
  dob: string
  openedAt: number
}

interface ChartState {
  recentCharts: ChartHistoryEntry[]
  wrongPatientWarning: { name: string; dob: string } | null
  recordChartOpen: (mrn: string, name: string, dob: string) => { showWarning: boolean }
  dismissWarning: () => void
}

export const useChartStore = create<ChartState>((set, get) => ({
  recentCharts: [],
  wrongPatientWarning: null,

  recordChartOpen: (mrn, name, dob) => {
    const now = Date.now()
    const { recentCharts } = get()

    // Keep last 3 chart opens
    const updated = [{ mrn, name, dob, openedAt: now }, ...recentCharts].slice(0, 3)

    // Detect A→B→A pattern within 10 seconds
    let showWarning = false
    if (
      updated.length === 3 &&
      updated[0].mrn !== updated[1].mrn &&
      updated[0].mrn === updated[2].mrn &&
      now - updated[2].openedAt < 10_000
    ) {
      // User went A→B→A; warn about the original A (updated[2])
      showWarning = true
      set({ recentCharts: updated, wrongPatientWarning: { name: updated[2].name, dob: updated[2].dob } })
    } else {
      set({ recentCharts: updated, wrongPatientWarning: null })
    }

    return { showWarning }
  },

  dismissWarning: () => set({ wrongPatientWarning: null }),
}))
