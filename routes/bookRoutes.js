const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');


router.get('/', bookController.listBooks);


router.get('/admin-dashboard', isAuthenticated, isAdmin, bookController.adminDashboard);
router.get('/create', isAuthenticated, isAdmin, bookController.getCreateBook);
router.post('/create', isAuthenticated, isAdmin, bookController.postCreateBook);
router.get('/edit/:id', isAuthenticated, isAdmin, bookController.getEditBook);
router.post('/edit/:id', isAuthenticated, isAdmin, bookController.postEditBook);
router.post('/delete/:id', isAuthenticated, isAdmin, bookController.deleteBook);

module.exports = router;