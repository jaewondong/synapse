// Bucket name is driven by env — never hardcode.
// Demo/dev: standard bucket. Production PHI: HIPAA-eligible bucket (requires BAA).
// Set STORAGE_IS_PHI_ELIGIBLE=true only after a Supabase BAA is in place.
export const DOCUMENTS_BUCKET = process.env.SUPABASE_DOCUMENTS_BUCKET ?? 'patient-documents'
export const IS_PHI_ELIGIBLE = process.env.STORAGE_IS_PHI_ELIGIBLE === 'true'
