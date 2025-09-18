const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

console.log('Testing database connection...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20) + '...');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testConnection() {
    const client = await pool.connect();
    try {
        // Test basic connection
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log('✅ Database connected successfully!');
        console.log('Current time:', result.rows[0].current_time);
        console.log('PostgreSQL version:', result.rows[0].postgres_version.split(' ')[0]);
        
        // Test user table (basic functionality)
        try {
            const userCount = await client.query('SELECT COUNT(*) FROM users');
            console.log('✅ Users table accessible. Count:', userCount.rows[0].count);
        } catch (e) {
            console.log('❌ Users table issue:', e.message);
        }
        
        // Test appointments table
        try {
            const appointmentCount = await client.query('SELECT COUNT(*) FROM appointments');
            console.log('✅ Appointments table accessible. Count:', appointmentCount.rows[0].count);
        } catch (e) {
            console.log('❌ Appointments table issue:', e.message);
        }
        
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

testConnection();
