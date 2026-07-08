const pool = require('../config/db');

class BorrowRecord {
    static async create({ user_id, book_id }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const bookRes = await client.query('SELECT status FROM books WHERE id = $1 FOR UPDATE', [book_id]);
            if (!bookRes.rows[0] || bookRes.rows[0].status !== 'available') {
                throw new Error('This catalog title is currently out of stock or reserved.');
            }

            const recordRes = await client.query(
                `INSERT INTO borrow_records (user_id, book_id, status)
                 VALUES ($1, $2, 'borrowed') RETURNING *`,
                [user_id, book_id]
            );

            await client.query("UPDATE books SET status = 'borrowed' WHERE id = $1", [book_id]);

            await client.query('COMMIT');
            return recordRes.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async returnBook(recordId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const recordRes = await client.query(
                'SELECT book_id FROM borrow_records WHERE id = $1 AND status = \'borrowed\' FOR UPDATE',
                [recordId]
            );
            if (!recordRes.rows[0]) {
                throw new Error('Active transactional borrow instance signature missing.');
            }
            const bookId = recordRes.rows[0].book_id;

            await client.query('UPDATE borrow_records SET status = \'returned\', return_date = NOW() WHERE id = $1', [recordId]);
            await client.query('UPDATE books SET status = \'available\' WHERE id = $1', [bookId]);

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async getHistoryByUser(userId, { limit = 10, offset = 0 } = {}) {
        const countRes = await pool.query(
            'SELECT COUNT(*) AS total FROM borrow_records WHERE user_id = $1',
            [userId]
        );
        const total = Number(countRes.rows[0].total);
        const safeLimit = Number(limit);
        const safeOffset = Number(offset);

        const res = await pool.query(
            `SELECT br.*, b.title AS book_title, b.isbn AS book_isbn
             FROM borrow_records br
             JOIN books b ON br.book_id = b.id
             WHERE br.user_id = $1
             ORDER BY br.borrow_date DESC
             LIMIT ${safeLimit} OFFSET ${safeOffset}`,
            [userId]
        );

        return { rows: res.rows, total };
    }

    static async getAllRecords({ limit = 10, offset = 0 } = {}) {
        const countRes = await pool.query('SELECT COUNT(*) AS total FROM borrow_records');
        const total = Number(countRes.rows[0].total);
        const safeLimit = Number(limit);
        const safeOffset = Number(offset);

        const res = await pool.query(
            `SELECT br.*, b.title AS book_title, u.username AS user_username
             FROM borrow_records br
             JOIN books b ON br.book_id = b.id
             JOIN users u ON br.user_id = u.id
             ORDER BY br.borrow_date DESC
             LIMIT ${safeLimit} OFFSET ${safeOffset}`
        );

        return { rows: res.rows, total };
    }
}

module.exports = BorrowRecord;
