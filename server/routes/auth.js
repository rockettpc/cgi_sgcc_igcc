const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                language_pref: user.language_pref,
                theme_pref: user.theme_pref
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server authentication error' });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, username, role, language_pref, theme_pref FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT /api/auth/preferences
router.put('/preferences', authenticateToken, async (req, res) => {
    try {
        const { language_pref, theme_pref } = req.body;
        if (language_pref) {
            await pool.execute('UPDATE users SET language_pref = ? WHERE id = ?', [language_pref, req.user.id]);
        }
        if (theme_pref) {
            await pool.execute('UPDATE users SET theme_pref = ? WHERE id = ?', [theme_pref, req.user.id]);
        }
        res.json({ message: 'Preferences updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

module.exports = router;
