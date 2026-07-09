const pool = require('../config/db');

class Book {
    static _buildFilters(search, status) {
        let whereClause = 'WHERE 1=1';
        const queryValues = [];
        let paramIndex = 1;

        if (search && search.trim() !== '') {
            // One placeholder per LIKE — MySQL needs a bound value for each "?"
            whereClause += ` AND (b.title LIKE $${paramIndex} OR b.description LIKE $${paramIndex + 1} OR b.isbn LIKE $${paramIndex + 2} OR a.name LIKE $${paramIndex + 3})`;
            const term = `%${search.trim()}%`;
            queryValues.push(term, term, term, term);
            paramIndex += 4;
        }

        if (status && status.trim() !== '') {
            whereClause += ` AND b.status = $${paramIndex}`;
            queryValues.push(status.trim());
            paramIndex++;
        }

        return { whereClause, queryValues, paramIndex };
    }

    static async getPaginated({ search, status, page = 1, limit = 6, offset = 0 } = {}) {
        const baseFrom = `
            FROM books b
            JOIN authors a ON b.author_id = a.id
        `;
        const { whereClause, queryValues, paramIndex } = this._buildFilters(search, status);

        const countRes = await pool.query(
            `SELECT COUNT(*) AS total ${baseFrom} ${whereClause}`,
            queryValues
        );
        const total = Number(countRes.rows[0].total);
        const safeLimit = Number(limit);
        const safeOffset = Number(offset);

        const dataRes = await pool.query(
            `SELECT b.*, a.name AS author_name
             ${baseFrom}
             ${whereClause}
             ORDER BY b.title ASC
             LIMIT ${safeLimit} OFFSET ${safeOffset}`,
            queryValues
        );

        return { rows: dataRes.rows, total };
    }

    static async getAll({ search, status } = {}) {
        const { rows } = await this.getPaginated({ search, status, page: 1, limit: 10000, offset: 0 });
        return rows;
    }

    static async findById(id) {
        const res = await pool.query(
            `SELECT b.*, a.name AS author_name
             FROM books b
             JOIN authors a ON b.author_id = a.id
             WHERE b.id = $1`,
            [id]
        );
        return res.rows[0];
    }

    static async create({ title, isbn, author_id, publication_year, description, status = 'available' }) {
        const res = await pool.query(
            `INSERT INTO books (title, isbn, author_id, publication_year, description, status)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, isbn, author_id, publication_year, description, status]
        );
        return res.rows[0];
    }

    static async update(id, { title, isbn, author_id, publication_year, description, status }) {
        const res = await pool.query(
            `UPDATE books
             SET title = $1, isbn = $2, author_id = $3, publication_year = $4, description = $5, status = $6
             WHERE id = $7 RETURNING *`,
            [title, isbn, author_id, publication_year, description, status, id]
        );
        return res.rows[0];
    }

    static async updateStatus(id, status) {
        const res = await pool.query(
            `UPDATE books SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return res.rows[0];
    }

    static async delete(id) {
        await pool.query('DELETE FROM books WHERE id = $1', [id]);
    }
}

module.exports = Book;

