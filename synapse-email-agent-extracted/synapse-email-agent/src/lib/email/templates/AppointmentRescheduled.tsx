import * as React from "react";
import { Section, Text } from "@react-email/components";
import type { EmailContext } from "../types";
import {
  DetailRow,
  Shell,
  formatWhen,
  styles,
  visitTypeLabel,
} from "./_components";

export const AppointmentRescheduledTemplateId = "appointment_rescheduled_v1";

export function AppointmentRescheduled({ ctx }: { ctx: EmailContext }) {
  const { appointment, patient, provider } = ctx;
  const preview = `Rescheduled: ${patient.first_name} ${patient.last_name[0]}. → ${formatWhen(appointment.starts_at)}`;
  const agentIdentity = appointment.created_by_agent ?? "scheduling_agent_v1";

  const oldTime = appointment.previous_starts_at
    ? formatWhen(appointment.previous_starts_at)
    : null;
  const newTime = formatWhen(appointment.starts_at);

  return (
    <Shell preview={preview} agentIdentity={agentIdentity}>
      <Text style={styles.kindLabel}>Appointment rescheduled</Text>
      <Text style={styles.headline}>
        {patient.first_name} {patient.last_name[0]}. — moved
      </Text>

      <Section style={{ marginBottom: "16px" }}>
        {oldTime ? (
          <Text style={styles.diff}>
            <span style={styles.diffOld}>{oldTime}</span>
            <span style={styles.diffArrow}>→</span>
            <strong>{newTime}</strong>
          </Text>
        ) : (
          <Text style={styles.diff}>
            <strong>New time:</strong> {newTime}
          </Text>
        )}
      </Section>

      <Section>
        <table style={styles.detailGrid} cellPadding={0} cellSpacing={0}>
          <tbody>
            <DetailRow label="Patient" value={`${patient.first_name} ${patient.last_name} · MRN ${patient.mrn}`} />
            <DetailRow label="Provider" value={`Dr. ${provider.last_name}${provider.specialty ? ` · ${provider.specialty}` : ""}`} />
            <DetailRow label="Visit type" value={visitTypeLabel(appointment.visit_type)} />
            {appointment.room && <DetailRow label="Room" value={appointment.room} />}
          </tbody>
        </table>
      </Section>

      <Section style={styles.reasonBlock}>
        <Text style={styles.reasonLabel}>Reason for reschedule</Text>
        <Text style={styles.reasonText}>
          {appointment.reschedule_reason?.trim() ||
            "No reason provided. Reach out to the scheduler or the agent supervision surface for context."}
        </Text>
      </Section>

      {appointment.agent_reasoning && (
        <Section style={styles.reasonBlock}>
          <Text style={styles.reasonLabel}>Agent reasoning</Text>
          <Text style={styles.reasonText}>{appointment.agent_reasoning}</Text>
        </Section>
      )}
    </Shell>
  );
}

export function appointmentRescheduledSubject(ctx: EmailContext): string {
  const { patient, appointment } = ctx;
  return `[Synapse] Rescheduled · ${patient.last_name}, ${patient.first_name[0]}. · → ${formatWhen(appointment.starts_at)}`;
}
