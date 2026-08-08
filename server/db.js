const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'sgcc_user',
    password: process.env.DB_PASSWORD || 'sgcc_pass',
    database: process.env.DB_NAME || 'sgcc_break_test',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

async function initDatabase() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MariaDB database successfully.');
        
        // Execute schema init script if tables don't exist
        const schemaPath = path.join(__dirname, '../db/init.sql');
        if (fs.existsSync(schemaPath)) {
            const sql = fs.readFileSync(schemaPath, 'utf8');
            await connection.query(sql);
            console.log('Database tables verified/initialized.');
        }
        connection.release();
    } catch (err) {
        console.error('MariaDB Connection Warning/Error:', err.message);
        console.log('Retrying DB connection in 5 seconds...');
        setTimeout(initDatabase, 5000);
    }
}

module.exports = {
    pool,
    query: (sql, params) => pool.execute(sql, params),
    initDatabase
};
