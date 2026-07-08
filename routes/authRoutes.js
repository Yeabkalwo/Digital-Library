const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.get('/me', isAuthenticated, authController.me);
router.post('/request-admin', isAuthenticated, authController.requestAdminAccess);

router.get('/admin-requests', isAuthenticated, isAdmin, authController.listAdminRequests);
router.post('/admin-requests/:id/approve', isAuthenticated, isAdmin, authController.approveAdminRequest);
router.post('/admin-requests/:id/reject', isAuthenticated, isAdmin, authController.rejectAdminRequest);

module.exports = router;
