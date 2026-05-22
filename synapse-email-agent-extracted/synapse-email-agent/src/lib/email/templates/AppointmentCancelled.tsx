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

export const AppointmentCancelledTemplateId = "appointment_cancelled_v1";

export function AppointmentCancelled({ ctx }: { ctx: EmailContext }) {
  const { appointment, patient, provider } = ctx;
  const preview = `Cancelled: ${patient.first_name} ${patient.last_name[0]}. · ${formatWhen(appointment.starts_at)}`;
  const agentIdentity = appointment.created_by_agent ?? "scheduling_agent_v1";

  return (
    <Shell preview={preview} agentIdentity={agentIdentity}>
      <Text style={styles.kindLabel}>Appointment cancelled</Text>
      <Text style={styles.headline}>
        {patient.first_name} {patient.last_name[0]}. — cancelled
      </Text>

      <Section>
        <table style={styles.detailGrid} cellPadding={0} cellSpacing={0}>
          <tbody>
            <DetailRow label="Patient" value={`${patient.first_name} ${patient.last_name} · MRN ${patient.mrn}`} />
            <DetailRow label="Provider" value={`Dr. ${provider.last_name}${provider.specialty ? ` · ${provider.specialty}` : ""}`} />
            <DetailRow label="Was scheduled" value={formatWhen(appointment.starts_at)} />
            <DetailRow label="Visit type" value={visitTypeLabel(appointment.visit_type)} />
          </tbody>
        </table>
      </Section>

      <Section style={styles.reasonBlock}>
        <Text style={styles.reasonLabel}>Reason for cancellation</Text>
        <Text style={styles.reasonText}>
          {appointment.cancellation_reason?.trim() || "No reason provided."}
        </Text>
      </Section>

      <Text style={{ ...styles.detailValue, marginTop: "16px" }}>
        If this patient is on the waitlist for an earlier slot, the Scheduling
        Agent will offer this opening to the next-best candidate. No action
        required.
      </Text>
    </Shell>
  );
}

export function appointmentCancelledSubject(ctx: EmailContext): string {
  const { patient, appointment } = ctx;
  return `[Synapse] Cancelled · ${patient.last_name}, ${patient.first_name[0]}. · ${formatWhen(appointment.starts_at)}`;
}
