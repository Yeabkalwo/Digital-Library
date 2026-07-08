#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function ensureDatabase() {
    const dbName = process.env.DB_DATABASE || 'library_db';
    const admin = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: 'postgres' // connect to default DB first
    });

    await admin.connect();
    const exists = await admin.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [dbName]
    );
    if (exists.rowCount === 0) {
        await admin.query(`CREATE DATABASE ${dbName}`);
        console.log(`✅ Created database "${dbName}"`);
    }
    await admin.end();
}

async function setup() {
    await ensureDatabase();

    const client = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'library_db'
    });

    await client.connect();

    const schema = fs.readFileSync(
        path.join(__dirname, '..', 'database/schema.sql'),
        'utf8'
    );
    await client.query(schema);

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await client.query(
        `INSERT INTO users (username, email, password, role)
         VALUES ($1, $2, $3, 'admin')
         ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username`,
        ['Super Admin', 'admin@library.com', hashedPassword]
    );

    await client.end();
    console.log('✅ PostgreSQL schema applied to library_db');
    console.log('✅ Super admin seeded: admin@library.com / admin123');
}

setup().catch((err) => {
    console.error('❌ Database setup failed:', err.message);
    process.exit(1);
});
