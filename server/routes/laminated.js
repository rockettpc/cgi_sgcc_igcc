const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/laminated-traceability - list traceability records with linked test results
router.get('/traceability', async (req, res) => {
    try {
        const { startDate, endDate, sgcc_number, glass_type, week } = req.query;

        let query = `
            SELECT t.*, u.username as created_by_username
            FROM laminated_traceability t
            LEFT JOIN users u ON t.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            query += ' AND t.production_date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND t.production_date <= ?';
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
        if (week) {
            query += ' AND t.collection_week = ?';
            params.push(week);
        }

        query += ' ORDER BY t.production_date DESC, t.production_time DESC';

        const [traceRecords] = await pool.execute(query, params);

        // Fetch associated test results for each traceability record
        for (const trace of traceRecords) {
            const [results] = await pool.execute(
                `SELECT r.*, u.username as confirmed_by_username
                 FROM laminated_test_results r
                 LEFT JOIN users u ON r.confirmed_by_user_id = u.id
                 WHERE r.traceability_id = ?
                 ORDER BY r.specimen_number ASC`,
                [trace.id]
            );
            trace.test_results = results;
        }

        res.json(traceRecords);
    } catch (err) {
        console.error('Error fetching laminated traceability:', err);
        res.status(500).json({ error: 'Failed to fetch laminated logs' });
    }
});

// POST /api/laminated-traceability - Create new traceability record
router.post('/traceability', async (req, res) => {
    try {
        const {
            production_date,
            production_time,
            sgcc_number,
            interlayer_type,
            glass_type,
            glass_kind,
            nominal_thickness,
            collection_week
        } = req.body;

        if (!production_date || !production_time || !interlayer_type || !glass_type || !glass_kind || !nominal_thickness || !collection_week) {
            return res.status(400).json({ error: 'Missing required traceability fields' });
        }

        const [result] = await pool.execute(
            `INSERT INTO laminated_traceability (
                production_date, production_time, sgcc_number, interlayer_type,
                glass_type, glass_kind, nominal_thickness, collection_week, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                production_date, production_time, sgcc_number || null, interlayer_type,
                glass_type, glass_kind, nominal_thickness, collection_week, req.user.id
            ]
        );

        // Audit Log
        await pool.execute(
            `INSERT INTO audit_logs (entity_type, entity_id, action, new_values, changed_by_user_id, changed_by_username)
             VALUES ('laminated_traceability', ?, 'INSERT', ?, ?, ?)`,
            [result.insertId, JSON.stringify(req.body), req.user.id, req.user.username]
        );

        res.status(201).json({ id: result.insertId, message: 'Laminated traceability record created' });
    } catch (err) {
        console.error('Error creating laminated traceability:', err);
        res.status(500).json({ error: 'Failed to create traceability record' });
    }
});

// POST /api/laminated-test-results - Add test specimen result to a traceability record
router.post('/test-results', async (req, res) => {
    try {
        const {
            traceability_id,
            specimen_number,
            test_date,
            test_time,
            specimen_temp,
            temp_unit,
            measured_min_thickness,
            drop_height_class,
            suggested_result,
            confirmed_result,
            photo_path,
            notes
        } = req.body;

        if (!traceability_id || !specimen_number || !test_date || !test_time || specimen_temp === undefined || !measured_min_thickness || !drop_height_class) {
            return res.status(400).json({ error: 'Missing required test result fields' });
        }

        if (!confirmed_result) {
            return res.status(400).json({ error: 'Pass/Fail result category confirmation is mandatory' });
        }

        const [result] = await pool.execute(
            `INSERT INTO laminated_test_results (
                traceability_id, specimen_number, test_date, test_time, specimen_temp,
                temp_unit, measured_min_thickness, drop_height_class, suggested_result,
                confirmed_result, confirmed_by_user_id, photo_path, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                traceability_id, specimen_number, test_date, test_time, specimen_temp,
                temp_unit || 'F', measured_min_thickness, drop_height_class, suggested_result || '1',
                confirmed_result, req.user.id, photo_path || null, notes || null, req.user.id
            ]
        );

        // Audit Log
        await pool.execute(
            `INSERT INTO audit_logs (entity_type, entity_id, action, new_values, changed_by_user_id, changed_by_username)
             VALUES ('laminated_test', ?, 'INSERT', ?, ?, ?)`,
            [result.insertId, JSON.stringify(req.body), req.user.id, req.user.username]
        );

        res.status(201).json({ id: result.insertId, message: 'Specimen test result recorded' });
    } catch (err) {
        console.error('Error creating laminated test result:', err);
        res.status(500).json({ error: 'Failed to record test result' });
    }
});

// PUT /api/laminated/traceability/:id - Edit traceability record
router.put('/traceability/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const [oldRows] = await pool.execute('SELECT * FROM laminated_traceability WHERE id = ?', [id]);
        if (oldRows.length === 0) return res.status(404).json({ error: 'Record not found' });
        const oldData = oldRows[0];
        const newData = req.body;

        await pool.execute(
            `UPDATE laminated_traceability SET
                production_date = ?, production_time = ?, sgcc_number = ?, interlayer_type = ?,
                glass_type = ?, glass_kind = ?, nominal_thickness = ?, collection_week = ?
            WHERE id = ?`,
            [
                newData.production_date || oldData.production_date,
                newData.production_time || oldData.production_time,
                newData.sgcc_number !== undefined ? newData.sgcc_number : oldData.sgcc_number,
                newData.interlayer_type || oldData.interlayer_type,
                newData.glass_type || oldData.glass_type,
                newData.glass_kind || oldData.glass_kind,
                newData.nominal_thickness || oldData.nominal_thickness,
                newData.collection_week || oldData.collection_week,
                id
            ]
        );

        await pool.execute(
            `INSERT INTO audit_logs (entity_type, entity_id, action, old_values, new_values, changed_by_user_id, changed_by_username)
             VALUES ('laminated_traceability', ?, 'UPDATE', ?, ?, ?, ?)`,
            [id, JSON.stringify(oldData), JSON.stringify(newData), req.user.id, req.user.username]
        );

        res.json({ message: 'Traceability record updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update record' });
    }
});

// DELETE /api/laminated/traceability/:id - Admin only delete
router.delete('/traceability/:id', async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Only Admin users can delete records' });
        }
        const id = req.params.id;
        const [oldRows] = await pool.execute('SELECT * FROM laminated_traceability WHERE id = ?', [id]);
        if (oldRows.length === 0) return res.status(404).json({ error: 'Record not found' });
        const oldData = oldRows[0];

        await pool.execute('DELETE FROM laminated_traceability WHERE id = ?', [id]);

        await pool.execute(
            `INSERT INTO audit_logs (entity_type, entity_id, action, old_values, changed_by_user_id, changed_by_username)
             VALUES ('laminated_traceability', ?, 'DELETE', ?, ?, ?)`,
            [id, JSON.stringify(oldData), req.user.id, req.user.username]
        );

        res.json({ message: 'Traceability record deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

module.exports = router;
