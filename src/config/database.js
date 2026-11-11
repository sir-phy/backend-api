require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT || 3306),
	user: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'mobile_sales_orders',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
});

async function checkDatabaseConnection() {
	await pool.query('SELECT 1');
	console.log('MySQL database connection successful.');
}

module.exports = { pool, checkDatabaseConnection };
