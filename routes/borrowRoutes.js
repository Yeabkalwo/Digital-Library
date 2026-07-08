const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');


router.post('/borrow', isAuthenticated, borrowController.borrowBook);
router.get('/history', isAuthenticated, borrowController.viewUserHistory);
router.post('/return/:id', isAuthenticated, borrowController.returnBook);


router.get('/all-records', isAuthenticated, isAdmin, borrowController.viewAllRecords);

module.exports = router;