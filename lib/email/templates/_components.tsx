import * as React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export const styles = {
  body: {
    backgroundColor: "#f5f5f4",
    fontFamily:
      "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    margin: 0,
    padding: "24px 0",
  } as React.CSSProperties,
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #e7e5e4",
    borderRadius: "4px",
    margin: "0 auto",
    maxWidth: "560px",
    padding: "32px",
  } as React.CSSProperties,
  brandRow: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "24px",
  } as React.CSSProperties,
  brand: {
    color: "#1c1917",
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    margin: 0,
    textTransform: "uppercase" as const,
  },
  agentBadge: {
    backgroundColor: "#f5f5f4",
    border: "1px solid #e7e5e4",
    borderRadius: "2px",
    color: "#57534e",
    fontSize: "11px",
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace",
    padding: "3px 8px",
  } as React.CSSProperties,
  kindLabel: {
    color: "#57534e",
    fontSize: "12px",
    letterSpacing: "0.04em",
    margin: "0 0 8px 0",
    textTransform: "uppercase" as const,
  },
  headline: {
    color: "#0c0a09",
    fontSize: "22px",
    fontWeight: 600,
    lineHeight: 1.25,
    margin: "0 0 24px 0",
  } as React.CSSProperties,
  hr: {
    border: "none",
    borderTop: "1px solid #e7e5e4",
    margin: "24px 0",
  } as React.CSSProperties,
  detailGrid: {
    margin: 0,
    width: "100%",
  } as React.CSSProperties,
  detailRow: {
    paddingBottom: "8px",
  } as React.CSSProperties,
  detailLabel: {
    color: "#78716c",
    fontSize: "12px",
    margin: 0,
    width: "120px",
  } as React.CSSProperties,
  detailValue: {
    color: "#1c1917",
    fontSize: "14px",
    margin: 0,
  } as React.CSSProperties,
  reasonBlock: {
    backgroundColor: "#fafaf9",
    borderLeft: "3px solid #a8a29e",
    margin: "16px 0",
    padding: "12px 16px",
  } as React.CSSProperties,
  reasonLabel: {
    color: "#57534e",
    fontSize: "11px",
    letterSpacing: "0.06em",
    margin: "0 0 4px 0",
    textTransform: "uppercase" as const,
  },
  reasonText: {
    color: "#1c1917",
    fontSize: "14px",
    lineHeight: 1.5,
    margin: 0,
  } as React.CSSProperties,
  footer: {
    color: "#a8a29e",
    fontSize: "11px",
    lineHeight: 1.5,
    margin: "24px 0 0 0",
  } as React.CSSProperties,
  diff: {
    color: "#1c1917",
    fontSize: "14px",
    margin: 0,
  } as React.CSSProperties,
  diffOld: {
    color: "#a8a29e",
    textDecoration: "line-through",
  } as React.CSSProperties,
  diffArrow: {
    color: "#78716c",
    margin: "0 8px",
  } as React.CSSProperties,
};

export function Shell({
  preview,
  children,
  agentIdentity,
}: {
  preview: string;
  children: React.ReactNode;
  agentIdentity: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.brandRow}>
            <Text style={styles.brand}>Synapse</Text>
            <span style={styles.agentBadge}>◇ {agentIdentity}</span>
          </Section>
          {children}
          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            This message was sent by an AI agent on behalf of the Synapse
            scheduling system. Every action it took is logged in the agent
            audit trail. Reply to this email to reach the practice
            scheduling team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td style={{ ...styles.detailRow, ...styles.detailLabel }}>{label}</td>
      <td style={{ ...styles.detailRow, ...styles.detailValue }}>{value}</td>
    </tr>
  );
}

export function formatWhen(iso: string, timeZone = "America/Los_Angeles") {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(d);
}

export function visitTypeLabel(t: string) {
  return (
    {
      new_patient_eval: "New patient evaluation",
      follow_up: "Follow-up",
      procedure: "Procedure",
      infusion: "Infusion",
      telehealth: "Telehealth",
      other: "Other",
    } as Record<string, string>
  )[t] ?? t;
}
