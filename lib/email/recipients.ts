import { createClient } from "@supabase/supabase-js";
import type { NotificationKind, ProviderLite } from "./types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false } },
);

/**
 * Routing for pilot: provider on the appointment + scheduling MA + pilot owner.
 * Tighten later: per-role preferences, opt-out, digest-vs-immediate.
 */
export async function resolveRecipients(args: {
  kind: NotificationKind;
  provider: ProviderLite;
  scheduledMaId: string | null;
}): Promise<string[]> {
  const recipients = new Set<string>();

  recipients.add("codyypham@berkeley.edu");

  if (args.provider.email) recipients.add(args.provider.email);

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
