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
        pass: process.env.MAIL_PASS,
    },
    pool: true, // Use a connection pool to keep the connection alive
    logger: true,
    debug: true,
    connectionTimeout: 15000, // 15 seconds
    greetingTimeout: 15000,
});

transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP ERROR:", error);
    } else {
        console.log("SMTP READY");
    }
});

module.exports = transporter;
