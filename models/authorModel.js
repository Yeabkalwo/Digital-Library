const pool = require('../config/db');

class Author {
    static async getAll() {
        const res = await pool.query('SELECT * FROM authors ORDER BY name ASC');
        return res.rows;
    }

    static async getPaginated({ page = 1, limit = 6, offset = 0 } = {}) {
        const countRes = await pool.query('SELECT COUNT(*) AS total FROM authors');
        const total = Number(countRes.rows[0].total);
        const safeLimit = Number(limit);
        const safeOffset = Number(offset);

        const res = await pool.query(
            `SELECT * FROM authors ORDER BY name ASC LIMIT ${safeLimit} OFFSET ${safeOffset}`
        );

        return { rows: res.rows, total };
    }

    static async findById(id) {
        const res = await pool.query('SELECT * FROM authors WHERE id = $1', [id]);
        return res.rows[0];
    }

    static async create({ name, biography, birth_year, nationality }) {
        const res = await pool.query(
            'INSERT INTO authors (name, biography, birth_year, nationality) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, biography, birth_year, nationality]
        );
        return res.rows[0];
    }

    static async update(id, { name, biography, birth_year, nationality }) {
        const res = await pool.query(
            'UPDATE authors SET name = $1, biography = $2, birth_year = $3, nationality = $4 WHERE id = $5 RETURNING *',
            [name, biography, birth_year, nationality, id]
        );
        return res.rows[0];
    }

    static async delete(id) {
        await pool.query('DELETE FROM authors WHERE id = $1', [id]);
    }
}

module.exports = Author;
