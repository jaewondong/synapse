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

export const AppointmentCreatedTemplateId = "appointment_created_v1";

export function AppointmentCreated({ ctx }: { ctx: EmailContext }) {
  const { appointment, patient, provider } = ctx;
  const preview = `New appointment for ${patient.first_name} ${patient.last_name[0]}. on ${formatWhen(appointment.starts_at)}`;
  const agentIdentity = appointment.created_by_agent ?? "scheduling_agent_v1";

  return (
    <Shell preview={preview} agentIdentity={agentIdentity}>
      <Text style={styles.kindLabel}>Appointment scheduled</Text>
      <Text style={styles.headline}>
        {patient.first_name} {patient.last_name[0]}. — {visitTypeLabel(appointment.visit_type)}
      </Text>

      <Section>
        <table style={styles.detailGrid} cellPadding={0} cellSpacing={0}>
          <tbody>
            <DetailRow label="Patient" value={`${patient.first_name} ${patient.last_name} · MRN ${patient.mrn}`} />
            <DetailRow label="Provider" value={`Dr. ${provider.last_name}${provider.specialty ? ` · ${provider.specialty}` : ""}`} />
            <DetailRow label="When" value={formatWhen(appointment.starts_at)} />
            <DetailRow label="Visit type" value={visitTypeLabel(appointment.visit_type)} />
            {appointment.room && <DetailRow label="Room" value={appointment.room} />}
          </tbody>
        </table>
      </Section>

      {appointment.agent_reasoning && (
        <Section style={styles.reasonBlock}>
          <Text style={styles.reasonLabel}>Why the agent booked this</Text>
          <Text style={styles.reasonText}>{appointment.agent_reasoning}</Text>
        </Section>
      )}
    </Shell>
  );
}

export function appointmentCreatedSubject(ctx: EmailContext): string {
  const { patient, appointment } = ctx;
  return `[Synapse] New appointment · ${patient.last_name}, ${patient.first_name[0]}. · ${formatWhen(appointment.starts_at)}`;
}
