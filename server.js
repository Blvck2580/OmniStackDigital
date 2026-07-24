const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ── Gmail SMTP transporter ── */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'omnistackdigital1@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendNotificationEmail({ name, email, service, message }) {
  await transporter.sendMail({
    from: '"OmniStack Digital" <omnistackdigital1@gmail.com>',
    to: 'omnistackdigital1@gmail.com',
    subject: `New contact form submission from ${name}`,
    text: [
      `Name:    ${name}`,
      `Email:   ${email}`,
      `Service: ${service || 'Not specified'}`,
      ``,
      `Message:`,
      message || '(none)',
    ].join('\n'),
    html: `
      <h2 style="color:#1a1a2e;">New contact form submission</h2>
      <table style="font-family:sans-serif;font-size:15px;border-collapse:collapse;">
        <tr><td style="padding:6px 16px 6px 0;color:#555;">Name</td><td><strong>${name}</strong></td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#555;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#555;">Service</td><td>${service || 'Not specified'}</td></tr>
      </table>
      <p style="font-family:sans-serif;font-size:15px;margin-top:16px;color:#555;">Message:</p>
      <p style="font-family:sans-serif;font-size:15px;white-space:pre-wrap;">${message || '(none)'}</p>
    `,
  });
}

/* ── Schema bootstrap ──
   Runs once per cold start. Errors are logged, not thrown, so a DB
   hiccup never prevents the whole serverless function from being
   exported/invoked. Individual routes still handle their own DB
   errors below. */
let dbReady = initDb().catch(err => {
  console.error('DB init failed:', err);
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id        SERIAL PRIMARY KEY,
      name      TEXT NOT NULL,
      email     TEXT NOT NULL,
      service   TEXT,
      message   TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('DB ready');
}

/* ── API: submit contact form ── */
app.post('/api/contact', async (req, res) => {
  const { name, email, service, message } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const cleanName    = name.trim();
  const cleanEmail   = email.trim();
  const cleanMessage = message?.trim() || null;

  try {
    const result = await pool.query(
      `INSERT INTO contact_submissions (name, email, service, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [cleanName, cleanEmail, service || null, cleanMessage]
    );

    // Send email notification (non-blocking — don't fail the response if email errors)
    sendNotificationEmail({ name: cleanName, email: cleanEmail, service, message: cleanMessage })
      .catch(err => console.error('Email send error:', err));

    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error('DB insert error:', err);
    res.status(500).json({ error: 'Failed to save submission.' });
  }
});

/* ── API: list submissions (admin) ── */
app.get('/api/submissions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, service, message,
              to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
       FROM contact_submissions
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('DB read error:', err);
    res.status(500).json({ error: 'Failed to fetch submissions.' });
  }
});

/* ── API: delete a submission ── */
app.delete('/api/submissions/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id.' });
  try {
    await pool.query('DELETE FROM contact_submissions WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete.' });
  }
});

/* ── Admin page ── */
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

/* ── Local dev only: run a real server when NOT on Vercel ── */
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

/* Vercel needs the Express app exported so it can invoke it directly
   per-request, instead of app.listen() binding to a port. */
module.exports = app;
