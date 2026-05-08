import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../logger/index.js';

import path from 'path';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendDailySummary(summaryText: string, reportDate: Date = new Date()): Promise<void> {
  const dateStr = reportDate.toLocaleDateString('en-GB');
  
  const mailOptions = {
    from: `"GitTrack Reporter" <${env.SMTP_USER}>`,
    to: env.MANAGER_EMAIL,
    subject: `Daily Work Summary`,
    text: summaryText,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #333;">Daily Work Summary</h2>
        <p style="color: #666;">Date: ${dateStr}</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <div style="white-space: pre-wrap; color: #444; line-height: 1.6;">
          ${summaryText.replace(/\n/g, '<br>')}
        </div>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p><small style="color: #999;">Sent automatically by GitTrack • Power-User Edition</small></p>
      </div>
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

export async function sendNoWorkEmail(reportDate: Date = new Date()): Promise<void> {
  const dateStr = reportDate.toLocaleDateString('en-GB');
  const gifPath = path.resolve(process.cwd(), 'public/giphy.webp');

  const mailOptions = {
    from: `"GitTrack Reporter" <${env.SMTP_USER}>`,
    to: env.MANAGER_EMAIL,
    subject: `Breaking News: Developer Found Touching Grass 🌿`,
    text: `No commits were recorded for ${dateStr}. Either the internet is down, or I am actually having a life. See you tomorrow!`,
    html: `
      <div style="font-family: 'Comic Sans MS', cursive, sans-serif; max-width: 600px; margin: auto; text-align: center; border: 2px dashed #ff4757; padding: 20px; border-radius: 15px;">
        <h2 style="color: #ff4757;">⚠️ 404: Work Not Found ⚠️</h2>
        <p style="font-size: 18px; color: #2f3542;">
          Breaking news for <b>${dateStr}</b>: <br>
          Our developer was found away from the keyboard! 
        </p>
        <div style="margin: 20px 0;">
          <img src="cid:noworkgif" alt="No work today" style="max-width: 100%; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
        </div>
        <p style="color: #747d8c; font-style: italic;">
          "The code is fine, it's just resting."
        </p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p><small style="color: #999;">Sent by GitTrack • The honest reporter</small></p>
      </div>
    `,
    attachments: [
      {
        filename: 'nowork.webp',
        path: gifPath,
        cid: 'noworkgif'
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Funny 'no work' email sent: ${info.messageId}`);
  } catch (error) {
    logger.error('Error sending funny email:', error as any);
  }
}
