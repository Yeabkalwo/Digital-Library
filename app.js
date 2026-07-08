const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const authorRoutes = require('./routes/authorRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const { loadUserContext } = require('./middleware/authMiddleware');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(loadUserContext);

app.get('/', (req, res) => res.redirect('/books/index.html'));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/borrow', borrowRoutes);

app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use(express.static(path.join(__dirname, 'views')));

app.use((req, res) => {
    res.status(404).json({ error: 'The requested system resource path could not be located.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Library System running on http://localhost:${PORT}`));
