const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/config-lists - available to all authenticated users
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM configurable_lists WHERE is_active = TRUE ORDER BY category, sort_order, value');
        
        // Group by category
        const categorized = rows.reduce((acc, curr) => {
            if (!acc[curr.category]) acc[curr.category] = [];
            acc[curr.category].push(curr);
            return acc;
        }, {});

        res.json(categorized);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch options list' });
    }
});

// Admin-only endpoints below
router.use(authenticateToken, requireRole(['Admin']));

// POST /api/config-lists
router.post('/', async (req, res) => {
    try {
        const { category, value, sort_order } = req.body;
        if (!category || !value) {
            return res.status(400).json({ error: 'Category and value are required' });
        }
        const [result] = await pool.execute(
            'INSERT INTO configurable_lists (category, value, sort_order) VALUES (?, ?, ?)',
            [category, value, sort_order || 0]
        );
        res.status(201).json({ id: result.insertId, category, value, sort_order: sort_order || 0 });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add item to option list' });
    }
});

// DELETE /api/config-lists/:id
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.execute('UPDATE configurable_lists SET is_active = FALSE WHERE id = ?', [id]);
        res.json({ message: 'Option item deactivated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove option item' });
    }
});

module.exports = router;
