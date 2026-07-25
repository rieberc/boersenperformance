import "server-only";
import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY muss gesetzt sein.");
    }
    client = new Resend(apiKey);
  }
  return client;
}

export async function sendAlertEmail(to: string, payload: { subject: string; body: string }): Promise<void> {
  try {
    // The Resend SDK returns API-level failures as { error } rather than
    // throwing — check both, so a validation/permission error can't silently
    // masquerade as a successful send.
    const { data, error } = await getClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
      to,
      subject: payload.subject,
      text: payload.body,
    });
    if (error) {
      console.error("Failed to send alert email", error);
    } else {
      console.log("Sent alert email", data?.id);
    }
  } catch (err) {
    // Don't let a failed email block push delivery or the cron run itself —
    // log it so it's visible in the deployment's function logs.
    console.error("Failed to send alert email", err);
  }
}
