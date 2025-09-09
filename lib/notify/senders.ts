"use server";

// Simple provider-agnostic sender stubs reading from env. Replace with real integrations.

export async function sendEmail(to: string, subject: string, body: string) {
  const smtpUrl = process.env.EMAIL_SMTP_URL || "";
  // In real-world, use nodemailer with smtpUrl
  console.log("[EMAIL]", {
    to,
    subject,
    body: body.slice(0, 80),
    smtpUrlConfigured: !!smtpUrl,
  });
  return { success: true };
}

export async function sendSMS(to: string, body: string) {
  const smsKey = process.env.SMS_API_KEY || "";
  console.log("[SMS]", {
    to,
    body: body.slice(0, 80),
    smsConfigured: !!smsKey,
  });
  return { success: true };
}

export async function sendWhatsApp(to: string, body: string) {
  const waKey = process.env.WHATSAPP_API_KEY || "";
  console.log("[WHATSAPP]", {
    to,
    body: body.slice(0, 80),
    waConfigured: !!waKey,
  });
  return { success: true };
}

export async function sendPush(userId: string, title: string, body: string) {
  // For in-app push, persist to a notifications store or websocket.
  console.log("[PUSH]", { userId, title, body: body.slice(0, 80) });
  return { success: true };
}
