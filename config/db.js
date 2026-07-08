const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'library_db'
});

const db = {
    query: (sql, params) => pool.query(sql, params),

    connect: async () => {
        const client = await pool.connect();
        return {
            query: (sql, params) => client.query(sql, params),
            release: () => client.release()
        };
    }
};

pool.query('SELECT NOW()')
    .then(() => {
        console.log(`✅ Connected to PostgreSQL Database ("${process.env.DB_DATABASE || 'library_db'}")`);
    })
    .catch((err) => {
        console.error('❌ PostgreSQL connection failed:', err.message);
    });

module.exports = db;
