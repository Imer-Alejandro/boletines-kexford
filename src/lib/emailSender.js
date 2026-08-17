const nodemailer = require('nodemailer');

let cachedTransport = null;

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error('Missing SMTP configuration');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

function getTransport() {
  if (!cachedTransport) {
    cachedTransport = createTransport();
  }
  return cachedTransport;
}

function resetTransport() {
  cachedTransport = null;
}

async function sendMail({ to, subject, html, text }) {
  const transporter = getTransport();

  try {
    return await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    resetTransport();
    throw error;
  }
}

module.exports = { sendMail, getTransport, resetTransport };
