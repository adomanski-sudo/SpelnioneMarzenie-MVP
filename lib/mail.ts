import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT) || 465;

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: port,
  secure: port === 465, // true dla portu 465 (SSL), false dla innych portów (np. 587 TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: `"SpełnioneMarzenie.pl" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Wiadomość wysłana:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Błąd wysyłki e-maila:", error);
    return { success: false, error };
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://spelnionemarzenie.pl";

export function buildEmailTemplate({
  heading,
  message,
  buttonText = "Otwórz SpełnioneMarzenie.pl",
  buttonPath = "/",
}: {
  heading: string;
  message: string;
  buttonText?: string;
  buttonPath?: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background-color: #f2f5f9; border-radius: 16px; color: #1f2937;">
      <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 16px;">
          <span style="color: #2563eb;">Spełnione</span><span style="color: #1f2937;">Marzenie</span><span style="color: #2563eb;">.pl</span>
        </div>
        <h2 style="font-size: 16px; color: #111827; margin-top: 0;">${heading}</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
          ${message}
        </p>
        <a href="${APP_URL}${buttonPath}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: bold; font-size: 13px; padding: 10px 20px; border-radius: 10px; text-decoration: none;">
          ${buttonText}
        </a>
      </div>
    </div>
  `;
}