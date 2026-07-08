const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, authorController.listAuthors);
router.post('/create', isAuthenticated, isAdmin, authorController.postCreateAuthor);
router.get('/edit/:id', isAuthenticated, isAdmin, authorController.getEditAuthor);
router.post('/edit/:id', isAuthenticated, isAdmin, authorController.postEditAuthor);
router.post('/delete/:id', isAuthenticated, isAdmin, authorController.deleteAuthor);

module.exports = router;
