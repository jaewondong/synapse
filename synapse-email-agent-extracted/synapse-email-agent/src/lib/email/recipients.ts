import { createClient } from "@supabase/supabase-js";
import type { NotificationKind, ProviderLite } from "./types";

// Service-role client. ONLY use server-side.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false } },
);

/**
 * Resolve who gets emailed for a given appointment change.
 *
 * For the pilot, the routing is intentionally simple:
 *   - The provider on the appointment always gets emailed.
 *   - The MA who scheduled it (if any) gets emailed.
 *   - codyypham@berkeley.edu is always included (pilot owner / dev).
 *
 * Tighten this later: per-role preferences, opt-out, digest-vs-immediate, etc.
 */
export async function resolveRecipients(args: {
  kind: NotificationKind;
  provider: ProviderLite;
  scheduledMaId: string | null;
}): Promise<string[]> {
  const recipients = new Set<string>();

  // Always: pilot owner
  recipients.add("codyypham@berkeley.edu");

  // Always: provider on the appointment
  if (args.provider.email) recipients.add(args.provider.email);

  // If an MA scheduled it, include them
  if (args.scheduledMaId) {
    const { data, error } = await supabase
      .from("staff")
      .select("email, active")
      .eq("id", args.scheduledMaId)
      .single();
    if (!error && data?.active && data.email) {
      recipients.add(data.email);
    }
  }

  return Array.from(recipients);
}
