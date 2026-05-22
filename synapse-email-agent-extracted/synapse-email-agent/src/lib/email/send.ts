import { render } from "@react-email/render";
import { createClient } from "@supabase/supabase-js";
import { FROM_ADDRESS, resend } from "./client";
import type { EmailContext, NotificationKind } from "./types";
import {
  AppointmentCreated,
  AppointmentCreatedTemplateId,
  appointmentCreatedSubject,
} from "./templates/AppointmentCreated";
import {
  AppointmentRescheduled,
  AppointmentRescheduledTemplateId,
  appointmentRescheduledSubject,
} from "./templates/AppointmentRescheduled";
import {
  AppointmentCancelled,
  AppointmentCancelledTemplateId,
  appointmentCancelledSubject,
} from "./templates/AppointmentCancelled";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false } },
);

type RenderResult = {
  subject: string;
  html: string;
  text: string;
  templateId: string;
};

async function renderForKind(ctx: EmailContext): Promise<RenderResult> {
  switch (ctx.kind) {
    case "appointment_created": {
      const el = AppointmentCreated({ ctx });
      return {
        subject: appointmentCreatedSubject(ctx),
        html: await render(el),
        text: await render(el, { plainText: true }),
        templateId: AppointmentCreatedTemplateId,
      };
    }
    case "appointment_rescheduled": {
      const el = AppointmentRescheduled({ ctx });
      return {
        subject: appointmentRescheduledSubject(ctx),
        html: await render(el),
        text: await render(el, { plainText: true }),
        templateId: AppointmentRescheduledTemplateId,
      };
    }
    case "appointment_cancelled": {
      const el = AppointmentCancelled({ ctx });
      return {
        subject: appointmentCancelledSubject(ctx),
        html: await render(el),
        text: await render(el, { plainText: true }),
        templateId: AppointmentCancelledTemplateId,
      };
    }
  }
}

/**
 * Render the right template, send via Resend, and log the result.
 *
 * Logs are written even on failure so the audit trail is complete.
 */
export async function sendNotification(ctx: EmailContext): Promise<{
  ok: boolean;
  messageId?: string;
  error?: string;
}> {
  const { subject, html, text, templateId } = await renderForKind(ctx);

  // 1) Insert a 'queued' row first so we have a paper trail even if send blows up.
  const { data: logRow, error: logInsertError } = await supabase
    .from("notification_events")
    .insert({
      kind: ctx.kind,
      appointment_id: ctx.appointment.id,
      patient_id: ctx.patient.id,
      agent_identity: ctx.appointment.created_by_agent ?? "scheduling_agent_v1",
      template_id: templateId,
      recipient_emails: ctx.recipients,
      status: "queued",
      payload: {
        subject,
        appointment_snapshot: ctx.appointment,
        patient_snapshot: { id: ctx.patient.id, mrn: ctx.patient.mrn },
        provider_snapshot: {
          id: ctx.provider.id,
          last_name: ctx.provider.last_name,
        },
      },
    })
    .select("id")
    .single();

  if (logInsertError) {
    console.error("[email] failed to insert notification_events row", logInsertError);
    // Continue anyway; we'd rather send and have an unlinked send than not send.
  }

  // 2) Send.
  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: ctx.recipients,
      subject,
      html,
      text,
      headers: {
        "X-Synapse-Agent": ctx.appointment.created_by_agent ?? "scheduling_agent_v1",
        "X-Synapse-Template": templateId,
        "X-Synapse-Appointment-Id": ctx.appointment.id,
      },
    });

    if (result.error) {
      await updateLog(logRow?.id, {
        status: "failed",
        error: result.error.message,
      });
      return { ok: false, error: result.error.message };
    }

    await updateLog(logRow?.id, {
      status: "sent",
      provider_message_id: result.data?.id ?? null,
      sent_at: new Date().toISOString(),
    });

    return { ok: true, messageId: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateLog(logRow?.id, { status: "failed", error: message });
    return { ok: false, error: message };
  }
}

async function updateLog(
  id: string | undefined,
  patch: Record<string, unknown>,
) {
  if (!id) return;
  const { error } = await supabase.from("notification_events").update(patch).eq("id", id);
  if (error) console.error("[email] failed to update notification_events", error);
}

/** Decide whether an UPDATE event warrants a notification. */
export function classifyUpdate(
  oldRow: { starts_at: string; ends_at: string; status: string },
  newRow: { starts_at: string; ends_at: string; status: string },
): NotificationKind | null {
  if (newRow.status === "cancelled" && oldRow.status !== "cancelled") {
    return "appointment_cancelled";
  }
  if (oldRow.starts_at !== newRow.starts_at || oldRow.ends_at !== newRow.ends_at) {
    return "appointment_rescheduled";
  }
  return null;
}
