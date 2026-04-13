// Config/mailer.js
const nodemailer = require('nodemailer');

const mailPort = Number(process.env.MAIL_PORT) || 465;
const mailHost = process.env.MAIL_HOST || 'smtp.gmail.com';
const mailUser = process.env.MAIL_USER || process.env.MAIL_MY;
const mailSecure =
  typeof process.env.MAIL_SECURE === 'string'
    ? ['true', '1', 'yes'].includes(process.env.MAIL_SECURE.toLowerCase())
    : mailPort === 465;

/**
 * Creates and returns a configured Nodemailer transporter.
 * Uses Gmail SMTP. For other providers, update the 'service' field
 * or use host/port/secure settings.
 */
const transporter = nodemailer.createTransport({
  host: mailHost,
  port: mailPort,
  secure: mailSecure,
  requireTLS: !mailSecure && mailPort === 587,
  auth: {
    user: mailUser,
    pass: process.env.MAIL_PASS
  }
});

if (!mailUser || !process.env.MAIL_PASS) {
  console.warn('SMTP CONFIG WARNING: MAIL_USER (or MAIL_MY) and MAIL_PASS must be set.');
}

transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP ERROR:", error);
    } else {
        console.log("SMTP READY");
    }
});

module.exports = transporter;
