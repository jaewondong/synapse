// Seeded payer list for fuzzy validation of extracted payer names (§2.6.4).
// A payer that doesn't match anything here isn't dropped — it's demoted with a
// validation note so the reviewer's attention lands on it.

export const KNOWN_PAYERS = [
  'Aetna',
  'Anthem Blue Cross',
  'Blue Cross Blue Shield',
  'Blue Shield of California',
  'Cigna',
  'UnitedHealthcare',
  'Humana',
  'Kaiser Permanente',
  'Medicare',
  'Medicaid',
  'Medi-Cal',
  'TRICARE',
  'Oscar Health',
  'Molina Healthcare',
  'Centene',
  'Health Net',
  'WellCare',
  'CareFirst',
  'Highmark',
  'EmblemHealth',
  'Ambetter',
] as const

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// True when the extracted payer plausibly matches a known payer:
// containment either direction after normalization, or shared leading token.
export function matchesKnownPayer(payerName: string): string | null {
  const n = normalize(payerName)
  if (!n) return null
  for (const known of KNOWN_PAYERS) {
    const k = normalize(known)
    if (n.includes(k) || k.includes(n)) return known
  }
  // Token-level overlap (e.g. "BCBS of Texas" vs "Blue Cross Blue Shield")
  const tokens = payerName.toLowerCase().split(/\s+/).filter((t) => t.length > 3)
  for (const known of KNOWN_PAYERS) {
    const knownTokens = known.toLowerCase().split(/\s+/)
    const overlap = tokens.filter((t) => knownTokens.includes(t))
    if (overlap.length >= 2) return known
  }
  if (/^bcbs/i.test(payerName.trim())) return 'Blue Cross Blue Shield'
  return null
}
