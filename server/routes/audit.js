const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken, requireRole(['QA Rep', 'Admin']));

// GET /api/audit-logs
router.get('/', async (req, res) => {
    try {
        const { entity_type, entity_id } = req.query;
        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const params = [];

        if (entity_type) {
            query += ' AND entity_type = ?';
            params.push(entity_type);
        }
        if (entity_id) {
            query += ' AND entity_id = ?';
            params.push(entity_id);
        }

        query += ' ORDER BY changed_at DESC LIMIT 100';

        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

module.exports = router;
