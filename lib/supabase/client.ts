import { createClient } from '@supabase/supabase-js'

// Browser-safe client using the publishable anon key.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
