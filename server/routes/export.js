const express = require('express');
const router = express.Router();
const fastcsv = require('fast-csv');
const PDFDocument = require('pdfkit');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/export/csv?type=tempered&startDate=...&endDate=...
router.get('/csv', async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;

        if (type === 'tempered') {
            let query = 'SELECT * FROM tempered_tests WHERE 1=1';
            const params = [];
            if (startDate) { query += ' AND test_date >= ?'; params.push(startDate); }
            if (endDate) { query += ' AND test_date <= ?'; params.push(endDate); }
            query += ' ORDER BY test_date DESC';

            const [rows] = await pool.execute(query, params);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="tempered_break_tests.csv"');

            const csvStream = fastcsv.format({ headers: true });
            csvStream.pipe(res);
            rows.forEach(row => csvStream.write({
                ID: row.id,
                Date: row.test_date,
                Time: row.test_time,
                'SGCC #': row.sgcc_number,
                'Glass Type': row.glass_type,
                Thickness: row.thickness,
                'Sample Size': row.sample_size,
                'Specimen Weight (lbs)': row.specimen_weight_lbs,
                'Max Allowable Wt (g)': row.max_allowable_particle_weight,
                'Actual 10-Pc Wt (g)': row.actual_10pc_particle_weight,
                'Suggested Result': row.suggested_pass_fail,
                'Confirmed Result': row.confirmed_pass_fail,
                Operator: row.operator_name,
                Notes: row.notes || ''
            }));
            csvStream.end();
        } else if (type === 'roll_wave' || type === 'rollwave') {
            let query = 'SELECT * FROM roll_wave_tests WHERE 1=1';
            const params = [];
            if (startDate) { query += ' AND test_date >= ?'; params.push(startDate); }
            if (endDate) { query += ' AND test_date <= ?'; params.push(endDate); }
            query += ' ORDER BY test_date DESC';

            const [rows] = await pool.execute(query, params);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="roll_wave_optical_distortion_tests.csv"');

            const csvStream = fastcsv.format({ headers: true });
            csvStream.pipe(res);
            rows.forEach(row => csvStream.write({
                ID: row.id,
                Date: row.test_date,
                Time: row.test_time,
                'SGCC #': row.sgcc_number,
                'Specimen ID': row.specimen_id,
                Thickness: row.glass_thickness,
                'Gauge Type': row.gauge_type,
                Unit: row.unit,
                'Avg Wavelength (L_ave)': row.average_wavelength !== null ? row.average_wavelength : 'N/A',
                'Min Depth (W_min)': row.min_depth,
                'Max Depth (W_max)': row.max_depth,
                'Avg Depth (W_avg)': row.avg_depth,
                'Max Distortion (mdpt)': row.max_distortion_mdpt,
                'Avg Distortion (mdpt)': row.avg_distortion_mdpt,
                'Threshold (mdpt)': row.distortion_threshold_mdpt || 'N/A',
                'Suggested Result': row.suggested_pass_fail,
                'Confirmed Result': row.confirmed_pass_fail,
                Operator: row.operator_name,
                Notes: row.notes || ''
            }));
            csvStream.end();
        } else {
            let query = `
                SELECT t.production_date, t.production_time, t.sgcc_number, t.interlayer_type,
                       t.glass_type, t.glass_kind, t.nominal_thickness, t.collection_week,
                       r.specimen_number, r.test_date, r.test_time, r.specimen_temp, r.temp_unit,
                       r.measured_min_thickness, r.drop_height_class, r.suggested_result, r.confirmed_result, r.notes
                FROM laminated_traceability t
                LEFT JOIN laminated_test_results r ON t.id = r.traceability_id
                WHERE 1=1
            `;
            const params = [];
            if (startDate) { query += ' AND t.production_date >= ?'; params.push(startDate); }
            if (endDate) { query += ' AND t.production_date <= ?'; params.push(endDate); }
            query += ' ORDER BY t.production_date DESC';

            const [rows] = await pool.execute(query, params);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="laminated_ball_drop_tests.csv"');

            const csvStream = fastcsv.format({ headers: true });
            csvStream.pipe(res);
            rows.forEach(row => csvStream.write({
                'Prod Date': row.production_date,
                'Prod Time': row.production_time,
                'SGCC #': row.sgcc_number || '',
                'Interlayer Type': row.interlayer_type,
                'Glass Type': row.glass_type,
                Kind: row.glass_kind,
                Thickness: row.nominal_thickness,
                'Collection Week': row.collection_week,
                'Specimen #': row.specimen_number || '',
                'Test Date': row.test_date || '',
                'Test Temp': row.specimen_temp ? `${row.specimen_temp}°${row.temp_unit}` : '',
                'Min Thickness': row.measured_min_thickness || '',
                'Drop Class': row.drop_height_class || '',
                'Result Category': row.confirmed_result || '',
                Notes: row.notes || ''
            }));
            csvStream.end();
        }
    } catch (err) {
        console.error('CSV Export error:', err);
        res.status(500).json({ error: 'Failed to generate CSV export' });
    }
});

const path = require('path');
const fs = require('fs');

const formatDateStr = (d) => {
    if (!d) return 'N/A';
    if (d instanceof Date) return d.toISOString().split('T')[0];
    const str = String(d);
    if (str.length >= 10) return str.substring(0, 10);
    return str;
};

// GET /api/export/pdf?type=tempered&startDate=...&endDate=...
router.get('/pdf', async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        const doc = new PDFDocument({ margin: 35, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${type}_break_tests_audit_report.pdf"`);
        doc.pipe(res);

        const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

        let reportTitle = 'Tempered (Center Punch Break Test)';
        if (type === 'laminated') reportTitle = 'Laminated (Ball Drop Test)';
        if (type === 'roll_wave' || type === 'rollwave') reportTitle = 'Roll Wave Optical Distortion (ASTM C1651)';

        // Document Title & Header
        doc.fontSize(18).fillColor('#0f172a').text('SGCC QA Production Testing Audit Log Report', { align: 'center' });
        doc.fontSize(11).fillColor('#475569').text(`Record Type: ${reportTitle}`, { align: 'center' });
        doc.fontSize(9).fillColor('#64748b').text(`Generated: ${new Date().toLocaleString()} | Date Range: ${startDate || 'All'} to ${endDate || 'All'}`, { align: 'center' });
        doc.moveDown(1.2);

        if (type === 'tempered') {
            let query = 'SELECT * FROM tempered_tests WHERE 1=1';
            const params = [];
            if (startDate) { query += ' AND test_date >= ?'; params.push(startDate); }
            if (endDate) { query += ' AND test_date <= ?'; params.push(endDate); }
            query += ' ORDER BY test_date DESC, test_time DESC LIMIT 50';

            const [rows] = await pool.execute(query, params);

            rows.forEach((row, i) => {
                if (doc.y > 670) doc.addPage();

                const dateDisplay = formatDateStr(row.test_date);

                doc.fontSize(11).fillColor('#0f172a').text(`Entry #${i + 1} - Date: ${dateDisplay} ${row.test_time || ''} | SGCC #: ${row.sgcc_number}`);
                doc.fontSize(9).fillColor('#334155').text(`Type: ${row.glass_type} | Thickness: ${row.thickness} | Sample Size: ${row.sample_size}`);
                doc.text(`Specimen Weight: ${row.specimen_weight_lbs || 'N/A'} lbs | Max Particle Wt: ${row.max_allowable_particle_weight}g | Actual 10-Pc Wt: ${row.actual_10pc_particle_weight}g`);
                doc.text(`Operator: ${row.operator_name} | Result: ${String(row.confirmed_pass_fail).toUpperCase()}`);
                if (row.notes) doc.text(`Notes: ${row.notes}`);

                if (row.photo_path) {
                    const photoFileName = path.basename(row.photo_path);
                    const photoDiskPath = path.join(uploadDir, photoFileName);
                    if (fs.existsSync(photoDiskPath)) {
                        try {
                            const imgY = doc.y + 4;
                            doc.image(photoDiskPath, 35, imgY, { fit: [160, 95] });
                            doc.y = imgY + 100;
                        } catch (imgErr) {}
                    }
                }

                doc.moveDown(0.5);
                doc.moveTo(35, doc.y).lineTo(560, doc.y).strokeColor('#e2e8f0').stroke();
                doc.y += 10;
            });
        } else if (type === 'roll_wave' || type === 'rollwave') {
            let query = 'SELECT * FROM roll_wave_tests WHERE 1=1';
            const params = [];
            if (startDate) { query += ' AND test_date >= ?'; params.push(startDate); }
            if (endDate) { query += ' AND test_date <= ?'; params.push(endDate); }
            query += ' ORDER BY test_date DESC, test_time DESC LIMIT 50';

            const [rows] = await pool.execute(query, params);

            rows.forEach((row, i) => {
                if (doc.y > 670) doc.addPage();

                const dateDisplay = formatDateStr(row.test_date);
                const unitStr = row.unit === 'mm' ? 'mm' : 'in';

                doc.fontSize(11).fillColor('#0f172a').text(`Entry #${i + 1} - Date: ${dateDisplay} ${row.test_time || ''} | SGCC #: ${row.sgcc_number}`);
                doc.fontSize(9).fillColor('#334155').text(`Specimen ID: ${row.specimen_id} | Thickness: ${row.glass_thickness} | Gauge: ${row.gauge_type} (${unitStr})`);
                doc.text(`Avg Wavelength (L_ave): ${row.average_wavelength !== null ? row.average_wavelength + ' ' + unitStr : 'N/A'} | Depth Range: W_min=${row.min_depth}${unitStr}, W_max=${row.max_depth}${unitStr}, W_avg=${row.avg_depth}${unitStr}`);
                doc.text(`Optical Distortion: D_max = ${row.max_distortion_mdpt} mdpt | D_avg = ${row.avg_distortion_mdpt} mdpt (Limit: ${row.distortion_threshold_mdpt ? row.distortion_threshold_mdpt + ' mdpt' : 'N/A'})`);
                doc.text(`Operator: ${row.operator_name} | Result: ${String(row.confirmed_pass_fail).toUpperCase()}`);
                if (row.notes) doc.text(`Notes: ${row.notes}`);

                if (row.photo_path) {
                    const photoFileName = path.basename(row.photo_path);
                    const photoDiskPath = path.join(uploadDir, photoFileName);
                    if (fs.existsSync(photoDiskPath)) {
                        try {
                            const imgY = doc.y + 4;
                            doc.image(photoDiskPath, 35, imgY, { fit: [160, 95] });
                            doc.y = imgY + 100;
                        } catch (imgErr) {}
                    }
                }

                doc.moveDown(0.5);
                doc.moveTo(35, doc.y).lineTo(560, doc.y).strokeColor('#e2e8f0').stroke();
                doc.y += 10;
            });
        } else {
            let query = `
                SELECT t.*, r.specimen_number, r.test_date as r_test_date, r.test_time as r_test_time,
                       r.specimen_temp, r.temp_unit, r.measured_min_thickness, r.drop_height_class,
                       r.confirmed_result, r.photo_path as test_photo_path
                FROM laminated_traceability t
                LEFT JOIN laminated_test_results r ON t.id = r.traceability_id
                WHERE 1=1
            `;
            const params = [];
            if (startDate) { query += ' AND t.production_date >= ?'; params.push(startDate); }
            if (endDate) { query += ' AND t.production_date <= ?'; params.push(endDate); }
            query += ' ORDER BY t.production_date DESC LIMIT 50';

            const [rows] = await pool.execute(query, params);

            rows.forEach((row, i) => {
                if (doc.y > 670) {
                    doc.addPage();
                }

                const prodDateDisplay = formatDateStr(row.production_date);

                doc.fontSize(11).fillColor('#0f172a').text(`Entry #${i + 1} - Prod Date: ${prodDateDisplay} ${row.production_time || ''} | SGCC #: ${row.sgcc_number || 'N/A'}`);
                doc.fontSize(9).fillColor('#334155').text(`Interlayer: ${row.interlayer_type} | Glass: ${row.glass_type} (${row.glass_kind}) | Thickness: ${row.nominal_thickness} | Collection Week: Week ${row.collection_week}`);

                if (row.specimen_number) {
                    const testDateDisplay = formatDateStr(row.r_test_date);
                    doc.text(`Specimen #${row.specimen_number} - Test Date: ${testDateDisplay} | Temp: ${row.specimen_temp}°${row.temp_unit} | Min Thick: ${row.measured_min_thickness}" | Class: ${row.drop_height_class} | Result: Category ${row.confirmed_result}`);

                    if (row.test_photo_path) {
                        const photoFileName = path.basename(row.test_photo_path);
                        const photoDiskPath = path.join(uploadDir, photoFileName);
                        if (fs.existsSync(photoDiskPath)) {
                            try {
                                const imgY = doc.y + 4;
                                doc.image(photoDiskPath, 35, imgY, { fit: [160, 95] });
                                doc.y = imgY + 100;
                            } catch (imgErr) {}
                        }
                    }
                }

                doc.moveDown(0.5);
                doc.moveTo(35, doc.y).lineTo(560, doc.y).strokeColor('#e2e8f0').stroke();
                doc.y += 10;
            });
        }

        doc.end();
    } catch (err) {
        console.error('PDF Export error:', err);
        res.status(500).json({ error: 'Failed to generate PDF export' });
    }
});

module.exports = router;
