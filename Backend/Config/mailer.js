// Config/mailer.js
const nodemailer = require('nodemailer');

/**
 * Creates and returns a configured Nodemailer transporter.
 * Uses Gmail SMTP. For other providers, update the 'service' field
 * or use host/port/secure settings.
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS, // Use a Gmail App Password (not your account password)
    },
});

module.exports = transporter;
