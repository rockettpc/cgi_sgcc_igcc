const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/roll-wave-tests - list with filters
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, sgcc_number, gauge_type, pass_fail, operator_name } = req.query;

        let query = `
            SELECT r.*, u.username as created_by_username, c.username as confirmed_by_username
            FROM roll_wave_tests r
            LEFT JOIN users u ON r.created_by = u.id
            LEFT JOIN users c ON r.confirmed_by_user_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            query += ' AND r.test_date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND r.test_date <= ?';
            params.push(endDate);
        }
        if (sgcc_number) {
            query += ' AND r.sgcc_number LIKE ?';
            params.push(`%${sgcc_number}%`);
        }
        if (gauge_type) {
            query += ' AND r.gauge_type = ?';
            params.push(gauge_type);
        }
        if (pass_fail) {
            query += ' AND r.confirmed_pass_fail = ?';
            params.push(pass_fail);
        }
        if (operator_name) {
            query += ' AND r.operator_name LIKE ?';
            params.push(`%${operator_name}%`);
        }

        query += ' ORDER BY r.test_date DESC, r.test_time DESC';

        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching roll wave tests:', err);
        res.status(500).json({ error: 'Failed to fetch roll wave test logs' });
    }
});

// GET /api/roll-wave-tests/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM roll_wave_tests WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/roll-wave-tests - Create new record
router.post('/', async (req, res) => {
    try {
        const {
            test_date,
            test_time,
            sgcc_number,
            operator_name,
            specimen_id,
            glass_thickness,
            gauge_type,
            unit,
            data_points,
            average_wavelength,
            min_depth,
            max_depth,
            avg_depth,
            max_distortion_mdpt,
            avg_distortion_mdpt,
            distortion_threshold_mdpt,
            suggested_pass_fail,
            confirmed_pass_fail,
            photo_path,
            notes
        } = req.body;

        if (!test_date || !test_time || !sgcc_number || !specimen_id || !glass_thickness || !gauge_type || data_points === undefined) {
            return res.status(400).json({ error: 'Missing required test fields' });
        }

        if (!confirmed_pass_fail) {
            return res.status(400).json({ error: 'Pass/Fail confirmation is mandatory' });
        }

        const dataPointsJson = typeof data_points === 'string' ? data_points : JSON.stringify(data_points);

        const [result] = await pool.execute(
            `INSERT INTO roll_wave_tests (
                test_date, test_time, sgcc_number, operator_name, specimen_id, glass_thickness,
                gauge_type, unit, data_points, average_wavelength, min_depth, max_depth, avg_depth,
                max_distortion_mdpt, avg_distortion_mdpt, distortion_threshold_mdpt,
                suggested_pass_fail, confirmed_pass_fail, confirmed_by_user_id,
                photo_path, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                test_date,
                test_time,
                sgcc_number,
                operator_name || req.user.username,
                specimen_id,
                glass_thickness,
                gauge_type,
                unit || 'inches',
                dataPointsJson,
                average_wavelength !== undefined && average_wavelength !== null ? average_wavelength : null,
                min_depth || 0,
                max_depth || 0,
                avg_depth || 0,
                max_distortion_mdpt || 0,
                avg_distortion_mdpt || 0,
                distortion_threshold_mdpt !== undefined ? distortion_threshold_mdpt : null,
                suggested_pass_fail || 'Pass',
                confirmed_pass_fail,
                req.user.id,
                photo_path || null,
                notes || null,
                req.user.id
            ]
        );

        // Audit Log for insert
        await pool.execute(
            `INSERT INTO audit_logs (entity_type, entity_id, action, new_values, changed_by_user_id, changed_by_username)
             VALUES ('roll_wave', ?, 'INSERT', ?, ?, ?)`,
            [result.insertId, JSON.stringify(req.body), req.user.id, req.user.username]
        );

        res.status(201).json({ id: result.insertId, message: 'Roll wave distortion test record created' });
    } catch (err) {
        console.error('Error creating roll wave test:', err);
        res.status(500).json({ error: 'Failed to create roll wave test record' });
    }
});

// PUT /api/roll-wave-tests/:id - Edit record
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [oldRows] = await pool.execute('SELECT * FROM roll_wave_tests WHERE id = ?', [id]);
        if (oldRows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        const oldData = oldRows[0];
        const newData = req.body;
        const dataPointsJson = newData.data_points !== undefined 
            ? (typeof newData.data_points === 'string' ? newData.data_points : JSON.stringify(newData.data_points))
            : oldData.data_points;

        await pool.execute(
            `UPDATE roll_wave_tests SET
                test_date = ?, test_time = ?, sgcc_number = ?, operator_name = ?, specimen_id = ?,
                glass_thickness = ?, gauge_type = ?, unit = ?, data_points = ?, average_wavelength = ?,
                min_depth = ?, max_depth = ?, avg_depth = ?, max_distortion_mdpt = ?, avg_distortion_mdpt = ?,
                distortion_threshold_mdpt = ?, suggested_pass_fail = ?, confirmed_pass_fail = ?,
                photo_path = ?, notes = ?
            WHERE id = ?`,
            [
                newData.test_date || oldData.test_date,
                newData.test_time || oldData.test_time,
                newData.sgcc_number || oldData.sgcc_number,
                newData.operator_name || oldData.operator_name,
                newData.specimen_id || oldData.specimen_id,
                newData.glass_thickness || oldData.glass_thickness,
                newData.gauge_type || oldData.gauge_type,
                newData.unit || oldData.unit,
                dataPointsJson,
                newData.average_wavelength !== undefined ? newData.average_wavelength : oldData.average_wavelength,
                newData.min_depth !== undefined ? newData.min_depth : oldData.min_depth,
                newData.max_depth !== undefined ? newData.max_depth : oldData.max_depth,
                newData.avg_depth !== undefined ? newData.avg_depth : oldData.avg_depth,
                newData.max_distortion_mdpt !== undefined ? newData.max_distortion_mdpt : oldData.max_distortion_mdpt,
                newData.avg_distortion_mdpt !== undefined ? newData.avg_distortion_mdpt : oldData.avg_distortion_mdpt,
                newData.distortion_threshold_mdpt !== undefined ? newData.distortion_threshold_mdpt : oldData.distortion_threshold_mdpt,
                newData.suggested_pass_fail || oldData.suggested_pass_fail,
                newData.confirmed_pass_fail || oldData.confirmed_pass_fail,
                newData.photo_path !== undefined ? newData.photo_path : oldData.photo_path,
                newData.notes !== undefined ? newData.notes : oldData.notes,
                id
            ]
        );

        // Audit Log for update
        await pool.execute(
            `INSERT INTO audit_logs (entity_type, entity_id, action, old_values, new_values, changed_by_user_id, changed_by_username)
             VALUES ('roll_wave', ?, 'UPDATE', ?, ?, ?, ?)`,
            [id, JSON.stringify(oldData), JSON.stringify(newData), req.user.id, req.user.username]
        );

        res.json({ message: 'Roll wave record updated successfully' });
    } catch (err) {
        console.error('Error updating roll wave record:', err);
        res.status(500).json({ error: 'Failed to update record' });
    }
});

// DELETE /api/roll-wave-tests/:id - Admin only delete
router.delete('/:id', async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Only Admin users can delete test logs' });
        }
        const id = req.params.id;
        const [oldRows] = await pool.execute('SELECT * FROM roll_wave_tests WHERE id = ?', [id]);
        if (oldRows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        const oldData = oldRows[0];

        await pool.execute('DELETE FROM roll_wave_tests WHERE id = ?', [id]);

        // Audit Log for deletion
        await pool.execute(
            `INSERT INTO audit_logs (entity_type, entity_id, action, old_values, changed_by_user_id, changed_by_username)
             VALUES ('roll_wave', ?, 'DELETE', ?, ?, ?)`,
            [id, JSON.stringify(oldData), req.user.id, req.user.username]
        );

        res.json({ message: 'Roll wave test record deleted successfully' });
    } catch (err) {
        console.error('Error deleting roll wave record:', err);
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

module.exports = router;
