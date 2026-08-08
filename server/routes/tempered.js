const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/tempered-tests - list with filters
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, sgcc_number, glass_type, pass_fail, operator_name } = req.query;
        
        let query = `
            SELECT t.*, u.username as created_by_username, c.username as confirmed_by_username
            FROM tempered_tests t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN users c ON t.confirmed_by_user_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            query += ' AND t.test_date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND t.test_date <= ?';
            params.push(endDate);
        }
        if (sgcc_number) {
            query += ' AND t.sgcc_number LIKE ?';
            params.push(`%${sgcc_number}%`);
        }
        if (glass_type) {
            query += ' AND t.glass_type = ?';
            params.push(glass_type);
        }
        if (pass_fail) {
            query += ' AND t.confirmed_pass_fail = ?';
            params.push(pass_fail);
        }
        if (operator_name) {
            query += ' AND t.operator_name LIKE ?';
            params.push(`%${operator_name}%`);
        }

        query += ' ORDER BY t.test_date DESC, t.test_time DESC';

        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching tempered tests:', err);
        res.status(500).json({ error: 'Failed to fetch tempered test logs' });
    }
});

// GET /api/tempered-tests/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM tempered_tests WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/tempered-tests - Create new record
router.post('/', async (req, res) => {
    try {
        const {
            test_date,
            test_time,
            sgcc_number,
            glass_type,
            thickness,
            sample_size,
            specimen_weight_lbs,
            max_allowable_particle_weight,
            actual_10pc_particle_weight,
            suggested_pass_fail,
            confirmed_pass_fail,
            operator_name,
            photo_path,
            notes
        } = req.body;

        if (!test_date || !test_time || !sgcc_number || !glass_type || !thickness || !sample_size || actual_10pc_particle_weight === undefined) {
            return res.status(400).json({ error: 'Missing required test fields' });
        }

        if (!confirmed_pass_fail) {
            return res.status(400).json({ error: 'Pass/Fail confirmation is mandatory' });
        }

        const [result] = await pool.execute(
            `INSERT INTO tempered_tests (
                test_date, test_time, sgcc_number, glass_type, thickness, sample_size,
                specimen_weight_lbs, max_allowable_particle_weight, actual_10pc_particle_weight,
                suggested_pass_fail, confirmed_pass_fail, confirmed_by_user_id,
                operator_name, photo_path, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                test_date, test_time, sgcc_number, glass_type, thickness, sample_size,
                specimen_weight_lbs || null, max_allowable_particle_weight, actual_10pc_particle_weight,
                suggested_pass_fail || 'Fail', confirmed_pass_fail, req.user.id,
                operator_name || req.user.username, photo_path || null, notes || null, req.user.id
            ]
        );

        // Audit Log for insert
        await pool.execute(
            `INSERT INTO audit_logs (entity_type, entity_id, action, new_values, changed_by_user_id, changed_by_username)
             VALUES ('tempered', ?, 'INSERT', ?, ?, ?)`,
            [result.insertId, JSON.stringify(req.body), req.user.id, req.user.username]
        );

        res.status(201).json({ id: result.insertId, message: 'Tempered break test record created' });
    } catch (err) {
        console.error('Error creating tempered test:', err);
        res.status(500).json({ error: 'Failed to create tempered break test record' });
    }
});

// PUT /api/tempered-tests/:id - Edit record with audit trail
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [oldRows] = await pool.execute('SELECT * FROM tempered_tests WHERE id = ?', [id]);
        if (oldRows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        const oldData = oldRows[0];
        const newData = req.body;

        await pool.execute(
            `UPDATE tempered_tests SET
                test_date = ?, test_time = ?, sgcc_number = ?, glass_type = ?, thickness = ?,
                sample_size = ?, specimen_weight_lbs = ?, max_allowable_particle_weight = ?,
                actual_10pc_particle_weight = ?, suggested_pass_fail = ?, confirmed_pass_fail = ?,
                operator_name = ?, photo_path = ?, notes = ?
            WHERE id = ?`,
            [
                newData.test_date || oldData.test_date,
                newData.test_time || oldData.test_time,
                newData.sgcc_number || oldData.sgcc_number,
                newData.glass_type || oldData.glass_type,
                newData.thickness || oldData.thickness,
                newData.sample_size || oldData.sample_size,
                newData.specimen_weight_lbs !== undefined ? newData.specimen_weight_lbs : oldData.specimen_weight_lbs,
                newData.max_allowable_particle_weight || oldData.max_allowable_particle_weight,
                newData.actual_10pc_particle_weight !== undefined ? newData.actual_10pc_particle_weight : oldData.actual_10pc_particle_weight,
                newData.suggested_pass_fail || oldData.suggested_pass_fail,
                newData.confirmed_pass_fail || oldData.confirmed_pass_fail,
                newData.operator_name || oldData.operator_name,
                newData.photo_path !== undefined ? newData.photo_path : oldData.photo_path,
                newData.notes !== undefined ? newData.notes : oldData.notes,
                id
            ]
        );

        // Audit Log for update
        await pool.execute(
            `INSERT INTO audit_logs (entity_type, entity_id, action, old_values, new_values, changed_by_user_id, changed_by_username)
             VALUES ('tempered', ?, 'UPDATE', ?, ?, ?, ?)`,
            [id, JSON.stringify(oldData), JSON.stringify(newData), req.user.id, req.user.username]
        );

        res.json({ message: 'Record updated successfully' });
    } catch (err) {
        console.error('Error updating tempered record:', err);
        res.status(500).json({ error: 'Failed to update record' });
    }
});

// DELETE /api/tempered-tests/:id - Admin only delete with audit trail
router.delete('/:id', async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Only Admin users can delete test logs' });
        }
        const id = req.params.id;
        const [oldRows] = await pool.execute('SELECT * FROM tempered_tests WHERE id = ?', [id]);
        if (oldRows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        const oldData = oldRows[0];

        await pool.execute('DELETE FROM tempered_tests WHERE id = ?', [id]);

        // Audit Log for deletion
        await pool.execute(
            `INSERT INTO audit_logs (entity_type, entity_id, action, old_values, changed_by_user_id, changed_by_username)
             VALUES ('tempered', ?, 'DELETE', ?, ?, ?)`,
            [id, JSON.stringify(oldData), req.user.id, req.user.username]
        );

        res.json({ message: 'Record deleted successfully' });
    } catch (err) {
        console.error('Error deleting tempered record:', err);
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

module.exports = router;
