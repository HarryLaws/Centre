import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import session from 'express-session';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-change-me';
const STAFF_USERNAME = process.env.STAFF_USERNAME || 'staff';
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'password123';

const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

app.use(cors());
app.use(express.json());
app.use(
  session({
    name: 'staff_session',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000,
    },
  }),
);

const getAttemptKey = (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown';

const isLoginBlocked = (key) => {
  const current = loginAttempts.get(key);
  if (!current) return false;
  const isExpired = Date.now() - current.firstAttemptAt > LOGIN_WINDOW_MS;
  if (isExpired) {
    loginAttempts.delete(key);
    return false;
  }
  return current.count >= MAX_LOGIN_ATTEMPTS;
};

const recordFailedLogin = (key) => {
  const current = loginAttempts.get(key);
  if (!current || Date.now() - current.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttemptAt: Date.now() });
    return;
  }
  loginAttempts.set(key, { ...current, count: current.count + 1 });
};

const clearFailedLogin = (key) => {
  loginAttempts.delete(key);
};

app.post('/api/staff/login', (req, res) => {
  const { username, password } = req.body || {};
  const attemptKey = getAttemptKey(req);

  if (isLoginBlocked(attemptKey)) {
    return res.status(429).json({ error: 'Too many failed login attempts. Please try again later.' });
  }

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing staff credentials.' });
  }

  if (username === STAFF_USERNAME && password === STAFF_PASSWORD) {
    req.session.isStaff = true;
    req.session.staffUser = username;
    clearFailedLogin(attemptKey);
    return res.json({ success: true });
  }

  recordFailedLogin(attemptKey);
  return res.status(401).json({ error: 'Invalid staff credentials.' });
});

app.post('/api/staff/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('staff_session');
    res.json({ success: true });
  });
});

app.get('/api/staff/session', (req, res) => {
  res.json({ isStaff: Boolean(req.session?.isStaff) });
});

app.post('/api/booking', async (req, res) => {
  const { name, email, phone, eventType, eventDate, proposedStartTime, proposedEndTime, attendees, notes } = req.body;

  if (!name || !email || !eventType || !eventDate) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.BOOKING_RECIPIENT,
    subject: `Booking request from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nEvent type: ${eventType}\nPreferred date: ${eventDate}\nProposed start time: ${proposedStartTime || 'N/A'}\nProposed end time: ${proposedEndTime || 'N/A'}\nExpected attendees: ${attendees}\nNotes: ${notes}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Booking request sent successfully.' });
  } catch (error) {
    console.error('Booking email failed:', error);

    // Try to persist the booking locally so the staff can review it later.
    try {
      const backupPath = './booking_backups.json';
      let backups = [];
      try {
        const existing = await fs.readFile(backupPath, 'utf8');
        backups = JSON.parse(existing);
      } catch (_) {
        backups = [];
      }

      const backupItem = {
        id: `backup-${Date.now()}`,
        name,
        email,
        phone,
        eventType,
        eventDate,
        proposedStartTime,
        proposedEndTime,
        attendees,
        notes,
        createdAt: new Date().toISOString(),
      };

      backups.push(backupItem);
      await fs.writeFile(backupPath, JSON.stringify(backups, null, 2), 'utf8');
      console.log('Persisted booking to', backupPath);

      return res.status(200).json({ message: 'Booking saved locally; email failed to send.' });
    } catch (fsErr) {
      console.error('Failed to persist booking locally:', fsErr);
      return res.status(500).json({ error: 'Unable to send booking request email.' });
    }
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/backups', async (req, res) => {
  const backupPath = './booking_backups.json';
  try {
    const data = await fs.readFile(backupPath, 'utf8');
    const arr = JSON.parse(data || '[]');
    return res.json(arr);
  } catch (err) {
    // If file does not exist, return empty array
    if (err && err.code === 'ENOENT') {
      return res.json([]);
    }
    console.error('Failed to read backups:', err);
    return res.status(500).json({ error: 'Failed to read backups' });
  }
});

app.listen(port, () => {
  console.log(`Booking API server listening on http://localhost:${port}`);
});
