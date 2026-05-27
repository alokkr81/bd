import 'dotenv/config';
import nodemailer from 'nodemailer';
import { formatTime } from '../utils/formatTime.js';

// Configure Nodemailer transporter using SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection
transporter.verify()
  .then(() => console.log('[MAILER] SMTP transporter initialized'))
  .catch((err) => console.error('[MAILER] SMTP verification failed:', err.message));

export async function sendAlertEmail(data) {
  const {
    user_id,
    ip_address,
    city,
    region,
    country,
    latitude,
    longitude,
    timezone,
    device_info,
    created_at,
  } = data;

  const isOk = data.status === 'SUCCESS';
  const tz = (timezone && timezone !== 'unknown') ? timezone : 'Asia/Kolkata';
  const timeStr = formatTime(created_at || new Date(), tz, { preset: 'full' });
  const loc = [city, region, country].filter(v => v && v !== 'unknown').join(', ') || 'Unknown location';
  const mapsLink = (latitude != null && longitude != null) ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;
  const mapsRow = mapsLink ? `<tr><td style="padding:10px 16px;color:#6b7280;">📍 Map</td><td style="padding:10px 16px;"><a href="${mapsLink}" target="_blank" style="color:#2563eb;">View on Google Maps ↗</a></td></tr>` : '';
  
  const headerBg = isOk ? 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)' : 'linear-gradient(135deg,#dc2626 0%,#991b1b 100%)';
  const badge = isOk 
    ? '<span style="background:#16a34a;color:#fff;padding:3px 10px;border-radius:12px;font-size:0.8rem;font-weight:600;">✅ SUCCESS</span>' 
    : '<span style="background:rgba(255,255,255,0.2);color:#fff;padding:3px 10px;border-radius:12px;font-size:0.8rem;font-weight:600;">❌ FAILED</span>';

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:540px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:${headerBg};padding:22px 28px;text-align:center;">
        <h2 style="color:#fff;margin:0 0 8px;font-size:1.25rem;">${isOk ? '🔓 Login Activity' : '⚠️ Failed Login'}</h2>
        ${badge}
      </div>
      <div style="padding:0;background:#fff;">
        <table style="width:100%;border-collapse:collapse;font-size:0.92rem;">
          <tr style="background:#f9fafb;">
            <td style="padding:10px 16px;color:#6b7280;width:35%;">🌐 IP</td>
            <td style="padding:10px 16px;font-family:monospace;">${ip_address || 'unknown'}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;color:#6b7280;">📍 Location</td>
            <td style="padding:10px 16px;">${loc}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:10px 16px;color:#6b7280;">🕐 Timezone</td>
            <td style="padding:10px 16px;">${timezone || 'unknown'}</td>
          </tr>
          <tr>
            <td style="padding:10px 16px;color:#6b7280;">💻 Device</td>
            <td style="padding:10px 16px;word-break:break-word;font-size:0.85rem;line-height:1.4;">${(device_info || 'unknown').slice(0,250)}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:10px 16px;color:#6b7280;">⏰ Time</td>
            <td style="padding:10px 16px;font-weight:600;">${timeStr}</td>
          </tr>
          ${mapsRow}
        </table>
      </div>
      <div style="padding:12px 24px;background:#f8fafc;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0;color:#94a3b8;font-size:0.75rem;">ARJHBD Security • System Alert</p>
      </div>
    </div>
  `;

  try {
    console.log('[MAILER] Sending email...');
    const info = await transporter.sendMail({
      from: `"🔐 Security Alert" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL_TO || process.env.SMTP_USER,
      subject: isOk ? '🔓 Login Activity — ARJHBD' : '⚠️ Failed Login — ARJHBD',
      html,
    });
    console.log(`[MAILER] Email sent successfully (Message ID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error('[MAILER] Email failed:', error);
    // Don't throw so main flow isn't broken
    return false;
  }
}
