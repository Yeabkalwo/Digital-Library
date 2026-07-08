const db = require('../config/db');

exports.create = async ({ user_id, message = null }) => {
    const result = await db.query(
        `INSERT INTO admin_requests (user_id, message, status)
         VALUES ($1, $2, 'pending') RETURNING *`,
        [user_id, message]
    );
    return result.rows[0];
};

exports.findPendingByUserId = async (userId) => {
    const result = await db.query(
        `SELECT * FROM admin_requests WHERE user_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
        [userId]
    );
    return result.rows[0];
};

exports.findLatestByUserId = async (userId) => {
    const result = await db.query(
        `SELECT * FROM admin_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
    );
    return result.rows[0];
};

exports.getAllPending = async ({ limit = 10, offset = 0 } = {}) => {
    const countRes = await db.query(
        `SELECT COUNT(*) AS total FROM admin_requests WHERE status = 'pending'`
    );
    const total = Number(countRes.rows[0].total);
    const safeLimit = Number(limit);
    const safeOffset = Number(offset);

    const result = await db.query(
        `SELECT ar.*, u.username, u.email, u.role AS current_role, u.created_at AS user_created_at
         FROM admin_requests ar
         JOIN users u ON ar.user_id = u.id
         WHERE ar.status = 'pending'
         ORDER BY ar.created_at ASC
         LIMIT ${safeLimit} OFFSET ${safeOffset}`
    );
    return { rows: result.rows, total };
};

exports.getAll = async () => {
    const result = await db.query(
        `SELECT ar.*, u.username, u.email,
                reviewer.username AS reviewer_username
         FROM admin_requests ar
         JOIN users u ON ar.user_id = u.id
         LEFT JOIN users reviewer ON ar.reviewed_by = reviewer.id
         ORDER BY ar.created_at DESC`
    );
    return result.rows;
};

exports.findById = async (id) => {
    const result = await db.query(
        `SELECT ar.*, u.username, u.email, u.role AS current_role
         FROM admin_requests ar
         JOIN users u ON ar.user_id = u.id
         WHERE ar.id = $1`,
        [id]
    );
    return result.rows[0];
};

exports.approve = async (requestId, reviewerId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const requestRes = await client.query(
            `SELECT * FROM admin_requests WHERE id = $1 AND status = 'pending' FOR UPDATE`,
            [requestId]
        );
        const request = requestRes.rows[0];
        if (!request) {
            throw new Error('This admin access request is no longer pending or does not exist.');
        }

        await client.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [request.user_id]);
        await client.query(
            `UPDATE admin_requests
             SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
             WHERE id = $2`,
            [reviewerId, requestId]
        );

        await client.query('COMMIT');
        return request;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

exports.reject = async (requestId, reviewerId) => {
    const result = await db.query(
        `UPDATE admin_requests
         SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW()
         WHERE id = $2 AND status = 'pending' RETURNING *`,
        [reviewerId, requestId]
    );
    return result.rows[0];
};
