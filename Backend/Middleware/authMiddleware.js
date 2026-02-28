// Middleware/authMiddleware.js
const Users = require('../Models/UserModel');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ message: 'Unauthorized. Please login.' });
};

// Middleware to check if user is a citizen
const isCitizen = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'citizen') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Citizens only.' });
};

// Middleware to check if user is a department admin
const isDeptAdmin = async (req, res, next) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please login.' });
        }

        if (req.session.user.role === 'dept_admin' || req.session.user.role === 'super_admin') {
            // Optionally attach full user object
            const user = await Users.findById(req.session.user.id).select('-password');
            req.user = user;
            return next();
        }

        return res.status(403).json({ message: 'Access denied. Department Admin access required.' });
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ 
            message: 'Server error during authentication',
            error: err.message 
        });
    }
};

// Middleware to check if user is a super admin
const isSuperAdmin = async (req, res, next) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: 'Unauthorized. Please login.' });
        }

        if (req.session.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Forbidden. Super Admin access required.' });
        }

        // Optionally attach full user object
        const user = await Users.findById(req.session.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        req.user = user;
        next();

    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ 
            message: 'Server error during authentication',
            error: err.message 
        });
    }
};

// Middleware to check if user is any type of admin
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && 
        (req.session.user.role === 'dept_admin' || req.session.user.role === 'super_admin')) {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Admins only.' });
};

// Middleware to check multiple roles
const hasRole = (...roles) => {
    return (req, res, next) => {
        if (req.session && req.session.user && roles.includes(req.session.user.role)) {
            return next();
        }
        return res.status(403).json({ 
            message: `Access denied. Required roles: ${roles.join(', ')}` 
        });
    };
};

module.exports = {
    isAuthenticated,
    isCitizen,
    isDeptAdmin,
    isSuperAdmin,
    isAdmin,
    hasRole
};