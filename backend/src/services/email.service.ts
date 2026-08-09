import nodemailer from "nodemailer";
import { env, isSmtpConfigured } from "../config/env";

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    })
  : null;

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!transporter) {
    console.log(`[email:stub] to=${to} subject="${subject}" body="${text}"`);
    return;
  }
  await transporter.sendMail({ from: env.smtp.from, to, subject, text });
}
