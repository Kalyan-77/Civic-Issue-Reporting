// Config/mailer.js
const nodemailer = require('nodemailer');

/**
 * Creates and returns a configured Nodemailer transporter.
 * Uses Gmail SMTP. For other providers, update the 'service' field
 * or use host/port/secure settings.
 */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL/TLS
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    family: 4, // Force IPv4
    pool: true,
    connectionTimeout: 20000,
});

transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP ERROR:", error);
    } else {
        console.log("SMTP READY");
    }
});

module.exports = transporter;
