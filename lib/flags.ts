// Minimal server-readable feature flags.
// Replace with a real flag service (LaunchDarkly, etc.) when available.
export const flags = {
  messaging: {
    // HARD GATE: real outbound PHI delivery requires signed BAAs.
    // Do NOT set true until Resend BAA + SMS BAA + Supabase HIPAA plan confirmed.
    real_delivery: process.env.MESSAGING_REAL_DELIVERY === 'true', // defaults false
  },
} as const
