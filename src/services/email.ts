import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../logger/index.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendDailySummary(summaryText: string): Promise<void> {
  const dateStr = new Date().toLocaleDateString();
  const mailOptions = {
    from: `"GitTrack Reporter" <${env.SMTP_USER}>`,
    to: env.MANAGER_EMAIL,
    subject: `Daily Work Summary - ${dateStr}`,
    text: summaryText,
    html: `
      <h2>Daily Work Summary</h2>
      <p>Date: ${dateStr}</p>
      <hr />
      <div style="white-space: pre-wrap; font-family: sans-serif;">
        ${summaryText.replace(/\n/g, '<br>')}
      </div>
      <hr />
      <p><small>Sent automatically by GitTrack</small></p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Daily summary email sent: ${info.messageId}`);
  } catch (error) {
    logger.error('Error sending daily summary email:', error as any);
    throw error;
  }
}
