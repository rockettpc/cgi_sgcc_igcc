const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All endpoints require Admin role
router.use(authenticateToken, requireRole(['Admin']));

// GET /api/users
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, username, role, language_pref, theme_pref, created_at FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/users
router.post('/', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Username, password, and role are required' });
        }
        if (!['Operator', 'QA Rep', 'Admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role specified' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [username, password_hash, role]
        );

        res.status(201).json({ id: result.insertId, username, role });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { role, password } = req.body;

        if (role) {
            if (!['Operator', 'QA Rep', 'Admin'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }
            await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        }

        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, userId]);
        }

        res.json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;
