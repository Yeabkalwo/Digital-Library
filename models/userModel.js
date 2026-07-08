const db = require('../config/db');


exports.findByEmail = async (email) => {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
};


exports.findById = async (id) => {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
};


exports.create = async ({ username, email, password, role = 'user' }) => {
    const result = await db.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
        [username, email, password, role]
    );
    return result.rows[0];
};


exports.updateRole = async (id, newRole) => {
    const result = await db.query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role',
        [newRole, id]
    );
    return result.rows[0];
};