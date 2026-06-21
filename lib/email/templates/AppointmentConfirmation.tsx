import * as React from "react";
import { Section, Text } from "@react-email/components";
import type { EmailContext } from "../types";
import { DetailRow, Shell, formatWhen, styles, visitTypeLabel } from "./_components";

// §2.9 — patient-facing confirmation reply. Renders the operator-reviewed reply
// body (if edited) above the structured appointment details. Contains ONLY this
// patient's appointment information (§1.G-G) — no other patient's data, no
// billing/balance content.
export const AppointmentConfirmationTemplateId = "appointment_confirmation_v1";

export function AppointmentConfirmation({ ctx }: { ctx: EmailContext }) {
  const { appointment, patient, provider } = ctx;
  const preview = `Your appointment is confirmed for ${formatWhen(appointment.starts_at)}`;
  const agentIdentity = appointment.created_by_agent ?? "scheduling_agent_v1";

  return (
    <Shell preview={preview} agentIdentity={agentIdentity}>
      <Text style={styles.kindLabel}>Appointment confirmed</Text>
      <Text style={styles.headline}>
        {patient.first_name}, your visit is set
      </Text>

      {ctx.replyBody && (
        <Section style={styles.reasonBlock}>
          <Text style={styles.reasonText}>{ctx.replyBody}</Text>
        </Section>
      )}

      <Section>
        <table style={styles.detailGrid} cellPadding={0} cellSpacing={0}>
          <tbody>
            <DetailRow label="When" value={formatWhen(appointment.starts_at)} />
            <DetailRow
              label="Provider"
              value={`Dr. ${provider.last_name}${provider.specialty ? ` · ${provider.specialty}` : ""}`}
            />
            <DetailRow label="Visit type" value={visitTypeLabel(appointment.visit_type)} />
            {appointment.room && <DetailRow label="Room" value={appointment.room} />}
          </tbody>
        </table>
      </Section>
    </Shell>
  );
}

export function appointmentConfirmationSubject(ctx: EmailContext): string {
  const { appointment } = ctx;
  return `Your appointment is confirmed · ${formatWhen(appointment.starts_at)}`;
}
