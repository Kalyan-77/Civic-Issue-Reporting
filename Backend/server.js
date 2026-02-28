require('dotenv').config();
const dns = require('dns');

// Force IPv4 over IPv6
if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
}

// prevent silent crashes
process.on('unhandledRejection', (r) => console.error('REJECTION:', r));
process.on('uncaughtException', (e) => console.error('EXCEPTION:', e));

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const connectDB = require('./Config/db');
const userRoutes = require('./Routes/UserRoutes');
const issueRoutes = require('./Routes/IssueRoutes');
const analyticsRoutes = require('./Routes/AnalyticsRoutes');
const contactRoutes = require('./Routes/ContactRoutes');
const notificationRoutes = require('./Routes/NotificationRoutes');
const activityRoutes = require('./Routes/ActivityRoutes');
const chatbotRoutes = require('./Routes/ChatbotRoutes');
const { cleanupLogs } = require('./Controllers/ActivityController');

const app = express();

// Enable trust proxy for production deployments (Render, Vercel, etc.)
app.set("trust proxy", 1);

//Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'https://civic-issue-reporting-rho.vercel.app'], // frontend URL
    credentials: true, // Allow cookies and sessions
    // methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
    secret: 'mySecretKey', // use a strong secret key in production
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for secure cookies behind proxies (Render)
    rolling: true, // Resets session expiration on every request
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // MUST be true for SameSite=None
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

//Database connection
connectDB();

// app.use('/',(req,res) =>{
//     res.send("Hello Server Started...")
// });

app.use('/auth/users', userRoutes);
app.use('/issue', issueRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/contact', contactRoutes);
app.use('/notifications', notificationRoutes);
app.use('/activity', activityRoutes);
app.use('/chatbot', chatbotRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);

    // Activy Log Cleanup Schedule (Runs every 12 hours)

    setInterval(cleanupLogs, 12 * 60 * 60 * 1000);
    // Run once on startup
    cleanupLogs();
})