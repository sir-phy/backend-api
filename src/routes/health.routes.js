const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

router.get('/db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 AS result');

        res.status(200).json({
            success: true,
            database: 'connected',
            result: rows[0].result
        });
    } catch (error) {
        console.error('Database health check failed:', error.message);
        res.status(503).json({
            success: false,
            database: 'disconnected',
            message: 'Database connection failed. Check the MySQL settings and server logs.'
        });
    }
});

module.exports = router;