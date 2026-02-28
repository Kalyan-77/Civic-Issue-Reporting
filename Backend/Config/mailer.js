// Config/mailer.js
const nodemailer = require('nodemailer');

/**
 * Creates and returns a configured Nodemailer transporter.
 * Uses Gmail SMTP. For other providers, update the 'service' field
 * or use host/port/secure settings.
 */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Often better for cloud providers than 465
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    logger: true,
    debug: true,
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 20000
});

transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP ERROR:", error);
    } else {
        console.log("SMTP READY");
    }
});

module.exports = transporter;
