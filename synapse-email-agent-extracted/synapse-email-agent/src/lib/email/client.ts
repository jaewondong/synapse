import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  // Don't throw at import time in dev — let the route handler surface a clean error.
  console.warn("[email] RESEND_API_KEY is not set");
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? "");

export const FROM_ADDRESS =
  process.env.EMAIL_FROM_ADDRESS ?? "Synapse Scheduling <scheduling@synapse.health>";
