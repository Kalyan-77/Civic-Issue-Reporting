// Routes/userRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../Controllers/UserController');
const { isAuthenticated, isSuperAdmin, isDeptAdmin, isAdmin } = require('../Middleware/authMiddleware');
const upload = require('../Middleware/uploadMiddleware'); // Your multer config

// ==================== PUBLIC ROUTES ====================
router.post('/register', authController.register);          // legacy (now disabled)
router.post('/send-otp', authController.sendRegistrationOtp);    // Step 1: validate & send OTP
router.post('/verify-otp', authController.verifyOtpAndRegister); // Step 2: verify OTP & create account
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);      // Step 1: send reset OTP
router.post('/verify-reset-otp', authController.verifyResetOtp);    // Step 2: verify OTP → get token
router.post('/reset-password', authController.resetPassword);        // Step 3: set new password
router.get('/session', authController.getSessionUser);

// ==================== ADMIN CREATION (Super Admin Only) ====================
router.post('/create-super-admin', authController.createSuperAdmin);
router.post('/create-dept-admin', isSuperAdmin, authController.createDeptAdmin);

// ==================== ADMIN MANAGEMENT (Specific paths must come before :id) ====================
// Department Admins
router.get('/dept-admins', isAuthenticated, authController.getAllDeptAdmins);
router.get('/dept-admins/stats', isSuperAdmin, authController.getDepartmentStats);
router.get('/dept-admins/department/:department', isSuperAdmin, authController.getAdminsByDepartment);
router.get('/dept-admin/:id', isSuperAdmin, authController.getDeptAdminById);

// Super Admins
router.get('/super-admins', isAuthenticated, authController.getAllSuperAdmins);

// ==================== USER MANAGEMENT ====================
router.get('/users', isAdmin, authController.getAllUsers); // Keep /users for list to avoid breaking existing list calls
// Update individual user operations to be root-relative to /auth/users/
router.get('/:id', isAuthenticated, authController.getUserById);
router.put('/:id', isAuthenticated, upload.single('profilePicture'), authController.updateUser);
router.put('/:id/change-password', isAuthenticated, authController.changePassword);
router.delete('/:id', isSuperAdmin, authController.deleteUser); // Fixed: was /users/:id

// ✅ NEW: Block/Unblock Routes
router.put('/:id/block', isAdmin, authController.blockUser);
router.put('/:id/unblock', isAdmin, authController.unblockUser);

module.exports = router;