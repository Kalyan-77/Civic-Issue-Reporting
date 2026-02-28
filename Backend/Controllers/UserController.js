// Controllers/UserController.js
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Users = require('../Models/UserModel');
const Issue = require('../Models/IssueModel');
const Settings = require('../Models/SettingsModel');
const { logActivity } = require('./ActivityController');
const transporter = require('../Config/mailer');

// ==================== OTP STORE (in-memory, 10-min TTL) ====================
// Map keyed by email => { otp, expiresAt, data }
const otpStore = new Map();         // registration OTPs
const resetOtpStore = new Map();    // password-reset OTPs

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Generate a 6-digit numeric OTP */
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/** Generate a short-lived opaque reset token */
const generateResetToken = () => crypto.randomBytes(32).toString('hex');

/** Send the OTP verification email */
const sendOtpEmail = async (email, name, otp) => {
    const mailOptions = {
        from: `"Civic Issue System" <${process.env.MAIL_USER}>`,
        to: email,
        subject: '🔐 Your Email Verification OTP — Civic Issue System',
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Email Verification</title>
          <style>
            body { margin:0; padding:0; background:#f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .wrapper { max-width:580px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.10); }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%); padding:40px 32px; text-align:center; }
            .header h1 { color:#fff; margin:0; font-size:24px; font-weight:700; }
            .header p  { color:rgba(255,255,255,0.85); margin:6px 0 0; font-size:14px; }
            .body  { padding:36px 32px; text-align:center; }
            .greeting { font-size:18px; font-weight:600; color:#1a1a2e; margin-bottom:8px; }
            .intro  { font-size:14px; color:#555; line-height:1.6; margin-bottom:28px; }
            .otp-box { display:inline-block; background:#f5f3ff; border:2px dashed #7c3aed; border-radius:14px; padding:20px 40px; margin-bottom:24px; }
            .otp-code { font-size:42px; font-weight:800; letter-spacing:12px; color:#4f46e5; font-family:'Courier New',monospace; }
            .expiry  { font-size:13px; color:#888; margin-bottom:24px; }
            .warning { background:#fff8e1; border-left:4px solid #f9a825; border-radius:0 8px 8px 0; padding:12px 16px; font-size:13px; color:#5d4037; text-align:left; margin-bottom:8px; line-height:1.5; }
            .footer  { text-align:center; padding:20px 32px; background:#f7f9ff; border-top:1px solid #e3e8f0; }
            .footer p { font-size:12px; color:#999; margin:4px 0; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>🏛️ Civic Issue System</h1>
              <p>Email Verification</p>
            </div>
            <div class="body">
              <p class="greeting">Hello, ${name}!</p>
              <p class="intro">
                You're almost there! Use the OTP below to verify your email address and complete your registration.
              </p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <p class="expiry">⏱️ This OTP expires in <strong>10 minutes</strong>.</p>
              <div class="warning">
                ⚠️ <strong>Security Notice:</strong> Do not share this OTP with anyone.
                If you did not request this, please ignore this email.
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from the Civic Issue System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
        `
    };
    await transporter.sendMail(mailOptions);
};

// ==================== PASSWORD GENERATOR ====================

/**
 * Generates a secure random password: at least one uppercase, one lowercase,
 * one digit, one special char — length 12.
 */
const generateSecurePassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '@#$%&!';
    const all = upper + lower + digits + special;

    // Guarantee at least one of each type
    let password =
        upper[Math.floor(Math.random() * upper.length)] +
        lower[Math.floor(Math.random() * lower.length)] +
        digits[Math.floor(Math.random() * digits.length)] +
        special[Math.floor(Math.random() * special.length)];

    // Fill remaining 8 characters randomly
    for (let i = 0; i < 8; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle so required chars are not always at the front
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

// ==================== EMAIL HELPERS ====================

/**
 * Sends a welcome email to a newly created Department Admin
 * with their login credentials.
 */
const sendDeptAdminWelcomeEmail = async ({ name, email, password, department }) => {
    const mailOptions = {
        from: `"Civic Issue System" <${process.env.MAIL_USER}>`,
        to: email,
        subject: '🎉 Welcome to Civic Issue System — Your Admin Account is Ready',
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Welcome to Civic Issue System</title>
          <style>
            body { margin:0; padding:0; background:#f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .wrapper { max-width:600px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.10); }
            .header { background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); padding:40px 32px; text-align:center; }
            .header h1 { color:#fff; margin:0; font-size:26px; font-weight:700; letter-spacing:-0.5px; }
            .header p { color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px; }
            .body { padding:36px 32px; }
            .greeting { font-size:18px; font-weight:600; color:#1a1a2e; margin-bottom:12px; }
            .intro { font-size:15px; color:#444; line-height:1.6; margin-bottom:28px; }
            .credentials-box { background:#f7f9ff; border:1px solid #d0dcff; border-radius:12px; padding:24px 28px; margin-bottom:28px; }
            .credentials-box h3 { margin:0 0 16px; font-size:14px; text-transform:uppercase; letter-spacing:1px; color:#1a73e8; }
            .credential-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:12px; border-bottom:1px dashed #dce4f5; }
            .credential-row:last-child { margin-bottom:0; padding-bottom:0; border-bottom:none; }
            .cred-label { font-size:13px; color:#666; font-weight:500; }
            .cred-value { font-size:14px; color:#1a1a2e; font-weight:700; font-family: 'Courier New', monospace; background:#e8efff; padding:4px 10px; border-radius:6px; word-break:break-all; }
            .badge { display:inline-block; background:#e3f2fd; color:#1565c0; font-size:12px; font-weight:600; padding:4px 12px; border-radius:20px; margin-bottom:24px; }
            .cta-btn { display:block; width:fit-content; margin:0 auto 28px; background:linear-gradient(135deg,#1a73e8,#0d47a1); color:#fff !important; text-decoration:none; padding:14px 36px; border-radius:50px; font-size:15px; font-weight:600; text-align:center; }
            .warning { background:#fff8e1; border-left:4px solid #f9a825; border-radius:0 8px 8px 0; padding:14px 16px; font-size:13px; color:#5d4037; margin-bottom:24px; line-height:1.5; }
            .footer { text-align:center; padding:24px 32px; background:#f7f9ff; border-top:1px solid #e3e8f0; }
            .footer p { font-size:12px; color:#999; margin:4px 0; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>🏛️ Civic Issue System</h1>
              <p>Empowering communities through efficient administration</p>
            </div>
            <div class="body">
              <p class="greeting">Hello, ${name}!</p>
              <p class="intro">
                Welcome aboard! A <strong>Department Admin</strong> account has been created for you by the Super Administrator.
                You can now log in to the Civic Issue System portal and begin managing issues for your department.
              </p>

              <span class="badge">🏢 Department: ${department}</span>

              <div class="credentials-box">
                <h3>🔐 Your Login Credentials</h3>
                <div class="credential-row">
                  <span class="cred-label">Email Address</span>
                  <span class="cred-value">${email}</span>
                </div>
                <div class="credential-row">
                  <span class="cred-label">Temporary Password</span>
                  <span class="cred-value">${password}</span>
                </div>
              </div>

              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/login" class="cta-btn">🚀 Login to Your Account</a>

              <div class="warning">
                ⚠️ <strong>Security Notice:</strong> Please change your password immediately after your first login.
                Do not share your credentials with anyone.
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from the Civic Issue System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
        `
    };

    await transporter.sendMail(mailOptions);
};

// ==================== ADMIN CREATION ====================

// Create Super Admin
exports.createSuperAdmin = async (req, res) => {
    try {
        const { name, email, password, mobile, location, state, area } = req.body;

        // Validation
        if (!name || !email || !password || !mobile) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Email validation
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        // Mobile validation
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ message: 'Mobile number must be 10 digits' });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const existingUser = await Users.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        // Check if mobile already exists
        const existingMobile = await Users.findOne({ mobile: mobile.trim() });
        if (existingMobile) {
            return res.status(409).json({ message: 'Mobile number is already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const superAdmin = await Users.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            mobile: mobile.trim(),
            location: {
                address: location ? location.trim() : '',
                state: state ? state.trim() : '',
                area: area ? area.trim() : ''
            },
            role: 'super_admin'
        });

        const adminResponse = {
            _id: superAdmin._id,
            name: superAdmin.name,
            email: superAdmin.email,
            mobile: superAdmin.mobile,
            location: superAdmin.location,
            // state: superAdmin.location?.state, // Removed duplicate
            // area: superAdmin.location?.area,   // Removed duplicate
            role: superAdmin.role,
            profilePicture: superAdmin.profilePicture,
            createdAt: superAdmin.createdAt,
            updatedAt: superAdmin.updatedAt
        };

        res.status(201).json({
            message: 'Super Admin created successfully',
            admin: adminResponse
        });

    } catch (err) {
        console.error('Error creating super admin:', err);
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};

// Create Department Admin
exports.createDeptAdmin = async (req, res) => {
    try {
        const { name, email, mobile, department, location, state, area } = req.body;

        // Auto-generate a secure password (never sent by frontend)
        const password = generateSecurePassword();

        // Validation
        if (!name || !email || !mobile || !department || !location) {
            return res.status(400).json({
                message: 'All fields are required',
                missing: {
                    name: !name,
                    email: !email,
                    mobile: !mobile,
                    department: !department,
                    location: !location
                }
            });
        }

        // Email validation
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        // Mobile validation
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ message: 'Mobile number must be 10 digits' });
        }

        // Department validation
        const validDepartments = ['Potholes', 'Garbage', 'Streetlight', 'Water Leakage', 'Other'];
        if (!validDepartments.includes(department)) {
            return res.status(400).json({
                message: 'Invalid department. Must be one of: Potholes, Garbage, Streetlight, Water Leakage, Other'
            });
        }

        // Check if user already exists
        const existingUser = await Users.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(409).json({ message: 'Admin with this email already exists' });
        }

        // Check if mobile already exists
        const existingMobile = await Users.findOne({ mobile: mobile.trim() });
        if (existingMobile) {
            return res.status(409).json({ message: 'Mobile number is already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const deptAdmin = await Users.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            mobile: mobile.trim(),
            department: department,
            location: {
                address: location ? location.trim() : '',
                state: state ? state.trim() : '',
                area: area ? area.trim() : ''
            },
            role: 'dept_admin'
        });

        const adminResponse = {
            _id: deptAdmin._id,
            name: deptAdmin.name,
            email: deptAdmin.email,
            mobile: deptAdmin.mobile,
            department: deptAdmin.department,
            location: deptAdmin.location,
            // state: deptAdmin.location?.state,
            // area: deptAdmin.location?.area,
            role: deptAdmin.role,
            profilePicture: deptAdmin.profilePicture,
            createdAt: deptAdmin.createdAt,
            updatedAt: deptAdmin.updatedAt
        };

        // Send welcome email with credentials (non-blocking)
        try {
            await sendDeptAdminWelcomeEmail({
                name: deptAdmin.name,
                email: deptAdmin.email,
                password: password, // plain-text password before hashing
                department: deptAdmin.department
            });
            console.log(`Welcome email sent to ${deptAdmin.email}`);
        } catch (mailErr) {
            // Don't fail the request if email sending fails
            console.error('Failed to send welcome email:', mailErr.message);
        }

        res.status(201).json({
            message: 'Department Admin created successfully. Credentials sent to their email.',
            admin: adminResponse
        });

    } catch (err) {
        console.error('Error creating department admin:', err);
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};

// ==================== USER REGISTRATION & AUTH ====================

/**
 * Step 1: Validate form data, check for duplicates, generate OTP, send email.
 * Does NOT create the user yet.
 */
exports.sendRegistrationOtp = async (req, res) => {
    const { name, email, password, mobile, location, state, area } = req.body;

    try {
        // Required fields
        if (!name || !email || !password || !mobile) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Email validation
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        // Mobile validation
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ message: 'Mobile number must be 10 digits' });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Duplicate checks
        const existingUser = await Users.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const existingMobile = await Users.findOne({ mobile: mobile.trim() });
        if (existingMobile) {
            return res.status(409).json({ message: 'Mobile number is already registered' });
        }

        // Generate OTP and store pending registration
        const otp = generateOtp();
        const expiresAt = Date.now() + OTP_TTL_MS;

        otpStore.set(email.toLowerCase().trim(), {
            otp,
            expiresAt,
            data: { name, email: email.toLowerCase().trim(), password, mobile, location, state, area }
        });

        // Send OTP email
        await sendOtpEmail(email.toLowerCase().trim(), name.trim(), otp);
        //console.log(`OTP sent to ${email} (expires in 10 min)`);

        res.status(200).json({ message: 'OTP sent to your email. Please verify to complete registration.' });

    } catch (err) {
        console.error('Error sending registration OTP:', err);
        res.status(500).json({ message: 'Failed to send OTP. Please try again.', error: err.message });
    }
};

/**
 * Step 2: Verify OTP → create user account.
 */
exports.verifyOtpAndRegister = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const record = otpStore.get(email.toLowerCase().trim());

        if (!record) {
            return res.status(400).json({ message: 'No pending registration found. Please request a new OTP.' });
        }

        if (Date.now() > record.expiresAt) {
            otpStore.delete(email.toLowerCase().trim());
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        if (record.otp !== otp.trim()) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        // OTP is valid — create the user
        const { name, password, mobile, location, state, area } = record.data;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await Users.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            mobile: mobile.trim(),
            location: {
                address: location ? location.trim() : '',
                state: state ? state.trim() : '',
                area: area ? area.trim() : ''
            },
            role: 'citizen'
        });

        // Clean up OTP store
        otpStore.delete(email.toLowerCase().trim());

        // Log Register Activity
        logActivity(user._id, 'REGISTER', { email: user.email }, req.ip);

        res.status(201).json({
            message: 'Email verified! Account created successfully.',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                location: user.location,
                role: user.role,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt
            }
        });

    } catch (err) {
        console.error('Error verifying OTP and registering:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Legacy direct register (kept for backward compat if needed)
exports.register = async (req, res) => {
    return res.status(410).json({ message: 'Direct registration is disabled. Please use the OTP flow.' });
};

// Login (Unified for all roles)
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await Users.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Email or Password' });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                message: `Your account has been blocked. Reason: ${user.blockReason || 'Violation of terms'}`
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Email or Password' });
        }

        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department || null
        };

        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department || null,
            department: user.department || null,
            location: user.location // Includes nested address, state, area
        };

        // Log Login Activity
        logActivity(user._id, 'LOGIN', { email: user.email }, req.ip);

        res.status(200).json({
            message: 'Login Successful',
            user: userResponse
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};

// Logout
exports.logout = (req, res) => {
    if (req.session && req.session.user) {
        logActivity(req.session.user.id, 'LOGOUT', {}, req.ip);
    }
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
    });
};

// ==================== FORGOT PASSWORD (3-step OTP flow) ====================

/**
 * Step 1 — Send a 6-digit OTP to the user's email.
 * Does NOT expose whether the email exists (prevents enumeration).
 */
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await Users.findOne({ email: email.toLowerCase().trim() });
        // Always return 200 to prevent email enumeration
        if (!user) {
            return res.status(200).json({ message: 'If this email exists, an OTP has been sent.' });
        }

        const otp = generateOtp();
        const expiresAt = Date.now() + OTP_TTL_MS;

        resetOtpStore.set(email.toLowerCase().trim(), { otp, expiresAt });

        // Send OTP email
        const mailOptions = {
            from: `"Civic Issue System" <${process.env.MAIL_USER}>`,
            to: email.toLowerCase().trim(),
            subject: '🔑 Password Reset OTP — Civic Issue System',
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <style>
                body { margin:0; padding:0; background:#f0f4f8; font-family:'Segoe UI',sans-serif; }
                .wrapper { max-width:560px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.10); }
                .header { background:linear-gradient(135deg,#dc2626,#b91c1c); padding:36px 32px; text-align:center; }
                .header h1 { color:#fff; margin:0; font-size:22px; font-weight:700; }
                .header p  { color:rgba(255,255,255,.85); margin:6px 0 0; font-size:13px; }
                .body { padding:36px 32px; text-align:center; }
                .greeting { font-size:17px; font-weight:600; color:#1a1a2e; margin-bottom:8px; }
                .intro { font-size:14px; color:#555; line-height:1.6; margin-bottom:24px; }
                .otp-box { display:inline-block; background:#fef2f2; border:2px dashed #dc2626; border-radius:14px; padding:18px 40px; margin-bottom:20px; }
                .otp-code { font-size:40px; font-weight:800; letter-spacing:12px; color:#dc2626; font-family:'Courier New',monospace; }
                .expiry { font-size:13px; color:#888; margin-bottom:20px; }
                .warning { background:#fff8e1; border-left:4px solid #f9a825; border-radius:0 8px 8px 0; padding:12px 16px; font-size:13px; color:#5d4037; text-align:left; line-height:1.5; }
                .footer { text-align:center; padding:20px 32px; background:#f7f9ff; border-top:1px solid #e3e8f0; }
                .footer p { font-size:12px; color:#999; margin:4px 0; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <div class="header">
                  <h1>🏛️ Civic Issue System</h1>
                  <p>Password Reset Request</p>
                </div>
                <div class="body">
                  <p class="greeting">Hello, ${user.name}!</p>
                  <p class="intro">We received a request to reset your password. Use the OTP below to verify your identity.</p>
                  <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                  </div>
                  <p class="expiry">⏱️ This OTP expires in <strong>10 minutes</strong>.</p>
                  <div class="warning">
                    ⚠️ <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email.
                    Do not share this OTP with anyone.
                  </div>
                </div>
                <div class="footer">
                  <p>This is an automated message from the Civic Issue System.</p>
                  <p>Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`Password reset OTP sent to ${email}`);

        res.status(200).json({ message: 'If this email exists, an OTP has been sent.' });
    } catch (err) {
        console.error('Error sending reset OTP:', err);
        res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
};

/**
 * Step 2 — Verify the OTP and return a short-lived reset token.
 */
exports.verifyResetOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

        const record = resetOtpStore.get(email.toLowerCase().trim());
        if (!record) return res.status(400).json({ message: 'No reset request found. Please request a new OTP.' });

        if (Date.now() > record.expiresAt) {
            resetOtpStore.delete(email.toLowerCase().trim());
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        if (record.otp !== otp.trim()) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        // OTP correct — issue a reset token (5 min TTL)
        const resetToken = generateResetToken();
        resetOtpStore.set(email.toLowerCase().trim(), {
            ...record,
            otp: null,           // invalidate OTP (one-time use)
            resetToken,
            tokenExpiresAt: Date.now() + 5 * 60 * 1000
        });

        res.status(200).json({ message: 'OTP verified.', resetToken });
    } catch (err) {
        console.error('Error verifying reset OTP:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

/**
 * Step 3 — Set a new password using the verified reset token.
 */
exports.resetPassword = async (req, res) => {
    const { email, resetToken, newPassword } = req.body;
    try {
        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ message: 'Email, reset token, and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const record = resetOtpStore.get(email.toLowerCase().trim());
        if (!record || !record.resetToken) {
            return res.status(400).json({ message: 'Invalid or expired reset session. Please start over.' });
        }
        if (Date.now() > record.tokenExpiresAt) {
            resetOtpStore.delete(email.toLowerCase().trim());
            return res.status(400).json({ message: 'Reset session expired. Please start over.' });
        }
        if (record.resetToken !== resetToken) {
            return res.status(400).json({ message: 'Invalid reset token.' });
        }

        const user = await Users.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        resetOtpStore.delete(email.toLowerCase().trim());
        console.log(`Password reset successfully for ${email}`);

        res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ==================== CHANGE PASSWORD (authenticated user) ====================
/**
 * Allows a logged-in user to change their own password.
 * Requires: currentPassword (to verify identity) + newPassword.
 */
exports.changePassword = async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    try {
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }
        // Only allow users to change their own password
        if (req.session?.user?.id !== id && req.session?.user?._id !== id) {
            return res.status(403).json({ message: 'Forbidden: you can only change your own password' });
        }

        const user = await Users.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ==================== USER MANAGEMENT ====================

// Update User
exports.updateUser = async (req, res) => {
    const { id } = req.params;

    try {
        const {
            name, email, password, location, mobile, department, state, area,
            activityLogRetention
        } = req.body;

        const updatedData = {};

        if (name) updatedData.name = name.trim();

        // Handle Settings Update (Only Activity Log Retention)
        if (activityLogRetention) {
            await Settings.findOneAndUpdate(
                { user: id },
                { $set: { activityLogRetention } },
                { upsert: true }
            );
        }

        if (email) {
            // Check if email is already taken by another user
            const existingEmail = await Users.findOne({ email: email.toLowerCase().trim(), _id: { $ne: id } });
            if (existingEmail) {
                return res.status(409).json({ success: false, message: 'Email is already in use' });
            }
            updatedData.email = email.toLowerCase().trim();
        }
        if (location !== undefined || state !== undefined || area !== undefined) {
            updatedData.location = {
                address: location !== undefined ? location.trim() : (req.user?.location?.address || ''),
                state: state !== undefined ? state.trim() : (req.user?.location?.state || ''),
                area: area !== undefined ? area.trim() : (req.user?.location?.area || '')
            };

            // Handle partial updates - need to fetch existing if not provided? 
            // Ideally we do findById first, then merge.
            // Since we do findByIdAndUpdate later, we might overwrite existing subfields if we are not careful.
            // Best practice: Fetch user first, then update.

            // However, for this specific request, let's assume all 3 or at least main ones are sent
            // Or better, use dot notation for mongo update if possible, but mongoose handles object replacement.
            // Let's refactor to fetch-first pattern for safety with nested objects.
        }
        if (mobile) {
            // Check if mobile is already taken by another user
            const existingMobile = await Users.findOne({ mobile: mobile.trim(), _id: { $ne: id } });
            if (existingMobile) {
                return res.status(409).json({ success: false, message: 'Mobile number is already in use' });
            }
            updatedData.mobile = mobile.trim();
        }
        if (department) updatedData.department = department;

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
            }
            updatedData.password = await bcrypt.hash(password, 10);
        }

        if (req.file) {
            updatedData.profilePicture = req.file.path;
        }

        // Fetch existing user to merge nested location updates safely
        const existingUser = await Users.findById(id);
        if (!existingUser) return res.status(404).json({ success: false, message: 'User not found' });

        if (location !== undefined || state !== undefined || area !== undefined) {
            updatedData.location = {
                address: location !== undefined ? location.trim() : (existingUser.location?.address || ''),
                state: state !== undefined ? state.trim() : (existingUser.location?.state || ''),
                area: area !== undefined ? area.trim() : (existingUser.location?.area || '')
            };
        }

        const user = await Users.findByIdAndUpdate(id, updatedData, { new: true }).select('-password');
        const settings = await Settings.findOne({ user: id });

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user: {
                ...user.toObject(),
                settings: settings ? settings.toObject() : {}
            }
        });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// Delete User
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await Users.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deletion of super_admin accounts
        if (user.role === 'super_admin') {
            return res.status(403).json({ message: 'Cannot delete Super Admin accounts' });
        }

        await Users.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};

// ==================== FETCH USERS ====================

// Get All Users (Citizens only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await Users.find({ role: 'citizen' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Users fetched successfully',
            users
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({
            message: 'Server Error',
            error: err.message
        });
    }
};

// Get User by ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await Users.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Count issues reported by this user
        const issuesReported = await Issue.countDocuments({ createdBy: user._id });

        res.status(200).json({
            success: true,
            message: 'User fetched successfully',
            user: {
                ...user.toObject(),
                issuesReported
            }
        });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

exports.blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Block reason is required'
            });
        }

        const user = await Users.findByIdAndUpdate(
            id,
            {
                isBlocked: true,
                blockReason: reason.trim()
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Log Block Activity
        if (req.session?.user) {
            logActivity(req.session.user.id || req.session.user._id, 'BLOCK_USER', { targetUserId: id, reason }, req.ip);
        }

        res.status(200).json({
            success: true,
            message: 'User blocked successfully',
            user
        });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({
            success: false,
            message: 'Error blocking user',
            error: error.message
        });
    }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await Users.findByIdAndUpdate(
            id,
            {
                isBlocked: false,
                blockReason: ''
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Log Unblock Activity
        if (req.session?.user) {
            logActivity(req.session.user.id || req.session.user._id, 'UNBLOCK_USER', { targetUserId: id }, req.ip);
        }

        res.status(200).json({
            success: true,
            message: 'User unblocked successfully',
            user
        });
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({
            success: false,
            message: 'Error unblocking user',
            error: error.message
        });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await Users.find().select('-password');

        // Get issue counts for each user


        const usersWithIssueCounts = await Promise.all(
            users.map(async (user) => {
                // count issues by `createdBy` (Issue schema uses `createdBy` reference)
                const issueCount = await Issue.countDocuments({ createdBy: user._id });
                return {
                    ...user.toObject(),
                    issuesReported: issueCount
                };
            })
        );

        res.status(200).json({
            success: true,
            users: usersWithIssueCounts
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};




// Get All Department Admins
exports.getAllDeptAdmins = async (req, res) => {
    try {
        const deptAdmins = await Users.find({ role: 'dept_admin' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Department Admins fetched successfully',
            admins: deptAdmins
        });
    } catch (err) {
        console.error('Error fetching department admins:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// Get Department Admin by ID
exports.getDeptAdminById = async (req, res) => {
    const { id } = req.params;

    try {
        const admin = await Users.findOne({ _id: id, role: 'dept_admin' }).select('-password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Department Admin not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Department Admin fetched successfully',
            admin
        });
    } catch (err) {
        console.error('Error fetching department admin:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// Get All Super Admins
exports.getAllSuperAdmins = async (req, res) => {
    try {
        const superAdmins = await Users.find({ role: 'super_admin' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Super Admins fetched successfully',
            admins: superAdmins
        });
    } catch (err) {
        console.error('Error fetching super admins:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// Get Admins by Department
exports.getAdminsByDepartment = async (req, res) => {
    const { department } = req.params;

    try {
        // Validate department
        const validDepartments = ['Potholes', 'Garbage', 'Streetlight', 'Water Leakage', 'Other'];
        if (!validDepartments.includes(department)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department'
            });
        }

        const admins = await Users.find({
            role: 'dept_admin',
            department: department
        })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: `Admins for ${department} department fetched successfully`,
            admins
        });
    } catch (err) {
        console.error('Error fetching admins by department:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// Get Department Statistics
exports.getDepartmentStats = async (req, res) => {
    try {
        const stats = await Users.aggregate([
            { $match: { role: 'dept_admin' } },
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            message: 'Department statistics fetched successfully',
            stats
        });
    } catch (err) {
        console.error('Error fetching department stats:', err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

// Get Session User
// Get Session User
exports.getSessionUser = async (req, res) => {
    if (req.session && req.session.user) {
        try {
            // Fetch fresh user data from DB
            const user = await Users.findById(req.session.user.id).select('-password');

            if (!user) {
                return res.json({ loggedIn: false });
            }

            // Fetch or create user settings
            let settings = await Settings.findOne({ user: user._id });
            if (!settings) {
                settings = await Settings.create({ user: user._id });
            }

            if (user.isBlocked) {
                req.session.destroy();
                return res.json({ loggedIn: false, message: 'Account Blocked' });
            }

            // Calculate stats based on role
            let stats = {
                issuesResolved: 0,
                issuesAssigned: 0,
                pendingIssues: 0,
                actionsTaken: 0,
                avgResponseTime: 'N/A'
            };

            try {
                if (user.role === 'super_admin') {
                    stats.issuesResolved = await Issue.countDocuments({ status: 'Resolved' });
                    stats.issuesAssigned = await Issue.countDocuments({});
                    stats.pendingIssues = await Issue.countDocuments({ status: { $ne: 'Resolved' } });
                    stats.actionsTaken = stats.issuesAssigned; // Total reports
                } else if (user.role === 'dept_admin') {
                    const dept = user.department;
                    // Handle potential singular/plural mismatch (e.g. Potholes -> Pothole)
                    const categoryFilter = { $in: [dept, dept.replace(/s$/, ''), dept + 's'] };

                    stats.issuesResolved = await Issue.countDocuments({ category: categoryFilter, status: 'Resolved' });
                    stats.issuesAssigned = await Issue.countDocuments({ category: categoryFilter });
                    stats.pendingIssues = await Issue.countDocuments({ category: categoryFilter, status: { $ne: 'Resolved' } });
                    stats.actionsTaken = stats.issuesAssigned;
                } else {
                    stats.issuesResolved = await Issue.countDocuments({ createdBy: user._id, status: 'Resolved' });
                    stats.issuesAssigned = await Issue.countDocuments({ createdBy: user._id });
                    stats.pendingIssues = await Issue.countDocuments({ createdBy: user._id, status: { $ne: 'Resolved' } });
                    stats.actionsTaken = stats.issuesAssigned;
                }
            } catch (statsError) {
                console.error('Error calculating stats:', statsError);
                // Continue without stats if calculation fails
            }

            return res.json({
                loggedIn: true,
                user: {
                    ...user.toObject(),
                    settings: settings.toObject(),
                    stats: stats
                }
            });

        } catch (error) {
            console.error('Session user fetch error:', error);
            // Fallback to session data if DB fetch fails, but preferably return false
            return res.json({ loggedIn: false });
        }
    } else {
        return res.json({ loggedIn: false });
    }
};