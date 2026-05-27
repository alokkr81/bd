// Force restart
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { logLoginAttempt } from '../services/loginLogger.js';
import { sendAlertEmail } from '../services/mailService.js';
import { extractClientIP } from '../utils/ipUtils.js';
import { fetchGeoData } from '../services/geoService.js';
import { parseUserAgent } from '../utils/uaParser.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// SECURE PASSWORD — loaded from environment variable (bcrypt hash)
// NEVER hardcode passwords in source code.
// ─────────────────────────────────────────────────────────────────────────────
const HASHED_PASSWORD = process.env.HASHED_PASSWORD;

if (!HASHED_PASSWORD) {
  console.error(
    '[AUTH] ❌ HASHED_PASSWORD not set in environment variables.\n' +
    '[AUTH]    Generate one: node -e "require(\'bcryptjs\').hash(\'YOUR_PASSWORD\', 12).then(h => console.log(h))"'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const {
    password,
    user_id = 'neha',
    screen = 'unknown',
    language = 'unknown',
    platform = 'unknown',
    cores = 'unknown',
    memory = 'unknown',
    deviceType: frontendDeviceType = 'unknown',
    timezone: frontendTimezone = 'unknown',
  } = req.body;

  try {
    // 1. EXTRACT REAL IP ADDRESS (Proxy-aware)
    const ip_address = extractClientIP(req);

    // 2. FETCH ACCURATE LOCATION DATA
    const geo = await fetchGeoData(ip_address);

    // 3. COMBINE BACKEND UA PARSING + FRONTEND FINGERPRINTING
    const userAgent = req.headers['user-agent'] || 'unknown';
    const deviceParsed = parseUserAgent(userAgent);
    
    const browserStr = deviceParsed.browser !== 'unknown' ? `${deviceParsed.browser} ${deviceParsed.browserVersion}` : 'unknown';
    const osStr = deviceParsed.os !== 'unknown' ? `${deviceParsed.os} ${deviceParsed.osVersion}` : 'unknown';
    const finalDeviceType = (frontendDeviceType !== 'unknown') ? frontendDeviceType : deviceParsed.deviceType;
    const finalTimezone = (geo.timezone && geo.timezone !== 'unknown') ? geo.timezone : frontendTimezone;

    // Premium device string merging everything
    const device_info = `${browserStr} on ${osStr} | ${finalDeviceType} | Res: ${screen} | Lang: ${language} | Plat: ${platform} | Cores: ${cores} | RAM: ${memory}GB | UA: ${userAgent.slice(0, 100)}`;

    const logData = {
      user_id,
      ip_address,
      city: geo.city,
      region: geo.region,
      country: geo.country,
      latitude: geo.latitude,
      longitude: geo.longitude,
      timezone: finalTimezone,
      device_info,
    };

    // 4. VERIFY PASSWORD
    let isValid = false;
    if (HASHED_PASSWORD && password) {
      isValid = await bcrypt.compare(password, HASHED_PASSWORD);
    }

    if (!isValid) {
      logData.status = 'FAILED';
      await logLoginAttempt(logData);
      // Run email asynchronously to prevent blocking response
      sendAlertEmail({ ...logData, created_at: new Date().toISOString(), status: 'FAILED' }).catch(() => {});
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    logData.status = 'SUCCESS';
    await logLoginAttempt(logData);
    sendAlertEmail({ ...logData, created_at: new Date().toISOString(), status: 'SUCCESS' }).catch(() => {});

    return res.status(200).json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error('[AUTH] ❌ Login route error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
