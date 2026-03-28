require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

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

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false, // Allows images to load from cross-origin
}));
app.use(compression()); // Compress all responses
app.use(morgan('dev')); // Professional logging

// Rate Limiting (Professional Security & Performance)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/auth/users', limiter); // Apply rate limiting to auth routes
app.use('/issue', limiter); // Protect issue creation and issue-related endpoints

app.use(cors({
    origin: ['http://localhost:5173', 'https://civic-issue-reporting-rho.vercel.app'], // frontend URL
    credentials: true, // Allow cookies and sessions
}));

// CSRF Protection: Validate Origin for state-changing requests
app.use((req, res, next) => {
if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    const allowedOrigins = [
        'http://localhost:5173',
        'https://civic-issue-reporting-rho.vercel.app'
    ];

    const isValid =
        (origin && allowedOrigins.includes(origin)) ||
        (referer && allowedOrigins.some(o => referer.startsWith(o)));

    if (!isValid) {
        return res.status(403).json({
            success: false,
            message: 'CSRF protection: Invalid origin'
        });
    }
}
    next();
});

app.use(cookieParser());
// Use a safe default JSON body size to reduce DoS risk; file uploads should be handled via multipart/form-data (multer)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
    secret: process.env.SESSION_SECRET, // use a strong secret key in production
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions',
    }),
    proxy: true, // Required for secure cookies behind proxies (Render)
    rolling: false, // Session expires after maxAge from creation
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

    // Initialize Socket.io
    require('./Config/socket').init(server);

    // Activy Log Cleanup Schedule (Runs every 12 hours)

    setInterval(cleanupLogs, 12 * 60 * 60 * 1000);
    // Run once on startup
    cleanupLogs();
})