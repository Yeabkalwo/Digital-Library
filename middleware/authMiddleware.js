const jwt = require('jsonwebtoken');
require('dotenv').config();

function extractToken(req) {
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    return null;
}

function attachUser(req, res, token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    res.locals.currentUser = decoded;
    return decoded;
}

exports.isAuthenticated = (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ error: 'Please sign in to access this feature.' });
    }

    try {
        attachUser(req, res, token);
        return next();
    } catch (err) {
        res.clearCookie('token');
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Access denied! This module requires administrative authorization credentials.' });
};

exports.isUser = (req, res, next) => {
    if (req.user && req.user.role === 'user') {
        return next();
    }
    return res.status(403).json({ error: 'Access limited to standard library members.' });
};

exports.loadUserContext = (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
        res.locals.currentUser = null;
        return next();
    }
    try {
        attachUser(req, res, token);
    } catch (err) {
        res.clearCookie('token');
        res.locals.currentUser = null;
    }
    next();
};
