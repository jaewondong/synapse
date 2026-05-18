import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { classifyUpdate, sendNotification } from "@/lib/email/send";
import { resolveRecipients } from "@/lib/email/recipients";
import type { AppointmentRow, EmailContext, NotificationKind } from "@/lib/email/types";

// Run on the Node.js runtime, not Edge — React Email render uses Node APIs.
export const runtime = "nodejs";

const appointmentRowSchema = z.object({
  id: z.string().uuid(),
  patient_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  scheduled_ma_id: z.string().uuid().nullable(),
  starts_at: z.string(),
  ends_at: z.string(),
  visit_type: z.string(),
  status: z.string(),
  room: z.string().nullable(),
  notes: z.string().nullable(),
  created_by_agent: z.string().nullable(),
  agent_reasoning: z.string().nullable(),
  agent_confidence: z.number().nullable(),
  reschedule_reason: z.string().nullable(),
  cancellation_reason: z.string().nullable(),
  previous_starts_at: z.string().nullable(),
  previous_ends_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const payloadSchema = z.object({
  type: z.enum(["INSERT", "UPDATE", "DELETE"]),
  table: z.literal("appointments"),
  schema: z.string(),
  record: appointmentRowSchema.nullable().optional(),
  old_record: appointmentRowSchema.nullable().optional(),
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false } },
);

export async function POST(req: NextRequest) {
  // ---- Auth: shared secret on the header ----
  const expected = process.env.SUPABASE_WEBHOOK_SECRET;
  const provided = req.headers.get("x-webhook-secret");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ---- Parse ----
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[webhook] payload validation failed", parsed.error);
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const { type, record, old_record } = parsed.data;

  // ---- Decide whether to notify and what kind ----
  let kind: NotificationKind | null = null;
  let appointment: AppointmentRow | undefined;

  if (type === "INSERT" && record) {
    kind = "appointment_created";
    appointment = record as AppointmentRow;
  } else if (type === "UPDATE" && record && old_record) {
    kind = classifyUpdate(old_record, record);
    appointment = record as AppointmentRow;
  } else if (type === "DELETE") {
    // Don't email on raw deletes — they shouldn't happen in prod. Log only.
    console.warn("[webhook] DELETE on appointments — not sending email", old_record?.id);
    return NextResponse.json({ ok: true, action: "skipped_delete" });
  }

  if (!kind || !appointment) {
    return NextResponse.json({ ok: true, action: "no_notification_needed" });
  }

  // ---- Hydrate patient + provider ----
  const [{ data: patient, error: pErr }, { data: provider, error: prErr }] =
    await Promise.all([
      supabase
        .from("patients")
        .select("id, mrn, first_name, last_name")
        .eq("id", appointment.patient_id)
        .single(),
      supabase
        .from("providers")
        .select("id, first_name, last_name, email, specialty")
        .eq("id", appointment.provider_id)
        .single(),
    ]);

  if (pErr || !patient) {
    console.error("[webhook] could not load patient", pErr);
    return NextResponse.json({ error: "patient not found" }, { status: 404 });
  }
  if (prErr || !provider) {
    console.error("[webhook] could not load provider", prErr);
    return NextResponse.json({ error: "provider not found" }, { status: 404 });
  }

  const recipients = await resolveRecipients({
    kind,
    provider,
    scheduledMaId: appointment.scheduled_ma_id,
  });

  const ctx: EmailContext = {
    kind,
    appointment,
    patient,
    provider,
    recipients,
  };

  const result = await sendNotification(ctx);

  if (!result.ok) {
    // 200 with status so Supabase doesn't keep retrying a known-bad payload.
    // The notification_events row records the failure for follow-up.
    return NextResponse.json({ ok: false, error: result.error });
  }

  return NextResponse.json({
    ok: true,
    kind,
    recipients,
    messageId: result.messageId,
  });
}
