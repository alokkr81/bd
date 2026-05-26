// server/routes/passwordReset.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { setToken, verifyToken, deleteToken } from '../utils/resetTokenStore.js';
import { sendAlertEmail } from '../services/mailService.js';

const router = Router();

// Request a password reset – send email (or log) with token link
router.post('/reset-request', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  // Store token with email, expires in 15 minutes
  setToken(email, token, 15 * 60 * 1000);

  const resetLink = `${process.env.APP_ORIGIN || 'http://localhost:5173'}/?token=${token}`;

  // For dev, we just log the link; in production you would email it.
  console.warn('[RESET] Password reset link generated:', resetLink);
  // Optionally send email using mail service (adapt payload as needed)
  try {
    await sendAlertEmail({
      user_id: email,
      ip_address: req.ip,
      city: '',
      region: '',
      country: '',
      latitude: '',
      longitude: '',
      timezone: '',
      device_info: req.headers['user-agent'] || '',
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[RESET] Email send error:', e);
  }

  return res.json({ success: true, message: 'Reset link generated', resetLink });
});

// Reset the password using the token
router.post('/reset', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and newPassword required' });
  }
  const email = verifyToken(token);
  if (!email) {
    return res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
  // Hash new password
  const hashed = await bcrypt.hash(newPassword, 12);
  // Update .env file – replace HASHED_PASSWORD line
  const envPath = 'e:/ARJHBD/ARJHBD/jujunew/.env';
  const fs = await import('fs');
  const envContent = await fs.promises.readFile(envPath, 'utf8');
  const newEnv = envContent.replace(/HASHED_PASSWORD=.*/, `HASHED_PASSWORD=${hashed}`);
  await fs.promises.writeFile(envPath, newEnv, 'utf8');
  // Clean token
  deleteToken(token);
  console.warn('[RESET] Password updated for', email);
  return res.json({ success: true, message: 'Password has been reset' });
});

export default router;
