const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AdminRequest = require('../models/adminRequestModel');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

function buildLoginResponse(user, adminRequest) {
    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    const response = {
        message: `Welcome back, ${user.username}!`,
        token,
        user: { id: user.id, username: user.username, role: user.role },
        redirectTo: user.role === 'admin' ? '/books/admin-dashboard.html' : '/books/index.html'
    };

    if (adminRequest) {
        response.adminRequest = {
            status: adminRequest.status,
            message: adminRequest.status === 'pending'
                ? 'Your librarian (admin) access request is still awaiting approval.'
                : adminRequest.status === 'rejected'
                    ? 'Your previous librarian access request was declined. Contact an administrator if you need access.'
                    : null
        };
    }

    return response;
}

exports.register = async (req, res) => {
    try {
        const { username, email, password, role, message } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists. Try signing in instead.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const wantsAdmin = role === 'admin';
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'user'
        });

        if (wantsAdmin) {
            await AdminRequest.create({
                user_id: user.id,
                message: message || 'Requested librarian access during registration.'
            });

            return res.status(201).json({
                message: 'Account created successfully. Your librarian access request has been sent to an administrator for approval. You can sign in as a library member while you wait.',
                role: 'user',
                adminRequestPending: true
            });
        }

        return res.status(201).json({
            message: 'Registration successful! You can now sign in as a library member.',
            role: 'user'
        });
    } catch (err) {
        console.error('Register error:', err.message);
        return res.status(500).json({ error: 'We could not complete registration right now. Please try again shortly.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Incorrect email or password. Please check your credentials and try again.' });
        }

        const adminRequest = await AdminRequest.findLatestByUserId(user.id);
        const response = buildLoginResponse(user, adminRequest);

        if (user.role === 'user' && adminRequest?.status === 'pending') {
            response.message = `Welcome back, ${user.username}! Your librarian access request is pending admin approval.`;
        }

        return res.json(response);
    } catch (err) {
        console.error('Login error:', err.message);
        return res.status(500).json({ error: 'Sign-in failed due to a server error. Please try again.' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    return res.json({ message: 'You have been signed out successfully.' });
};

exports.me = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'You are not signed in.' });
        }

        const adminRequest = await AdminRequest.findLatestByUserId(req.user.id);
        return res.json({
            user: req.user,
            adminRequest: adminRequest ? { status: adminRequest.status, created_at: adminRequest.created_at } : null
        });
    } catch (err) {
        return res.status(500).json({ error: 'Could not load your profile.' });
    }
};

exports.requestAdminAccess = async (req, res) => {
    try {
        const { message } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User account not found.' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ error: 'You already have administrator access.' });
        }

        const pending = await AdminRequest.findPendingByUserId(user.id);
        if (pending) {
            return res.status(409).json({ error: 'You already have a pending librarian access request.' });
        }

        await AdminRequest.create({
            user_id: user.id,
            message: message || 'Requested librarian access from account settings.'
        });

        return res.status(201).json({
            message: 'Your librarian access request has been submitted. An administrator will review it soon.'
        });
    } catch (err) {
        console.error('Request admin error:', err.message);
        return res.status(500).json({ error: 'Could not submit your request. Please try again.' });
    }
};

exports.listAdminRequests = async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query, 10);
        const { rows, total } = await AdminRequest.getAllPending({ limit, offset });
        const pagination = buildPaginationMeta(total, page, limit);

        return res.json({ requests: rows, pagination });
    } catch (err) {
        console.error('List admin requests error:', err.message);
        return res.status(500).json({ error: 'Could not load admin access requests.' });
    }
};

exports.approveAdminRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const request = await AdminRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ error: 'Admin access request not found.' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: `This request has already been ${request.status}.` });
        }

        if (request.user_id === req.user.id) {
            return res.status(400).json({ error: 'You cannot approve your own admin access request.' });
        }

        await AdminRequest.approve(requestId, req.user.id);

        return res.json({
            message: `Approved librarian access for ${request.username}. They can now use admin features after signing in again.`
        });
    } catch (err) {
        console.error('Approve admin request error:', err.message);
        return res.status(400).json({ error: err.message || 'Could not approve this request.' });
    }
};

exports.rejectAdminRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const request = await AdminRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ error: 'Admin access request not found.' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: `This request has already been ${request.status}.` });
        }

        const updated = await AdminRequest.reject(requestId, req.user.id);
        if (!updated) {
            return res.status(400).json({ error: 'This request is no longer pending.' });
        }

        return res.json({
            message: `Declined librarian access for ${request.username}. They will remain a standard library member.`
        });
    } catch (err) {
        console.error('Reject admin request error:', err.message);
        return res.status(500).json({ error: 'Could not decline this request.' });
    }
};
