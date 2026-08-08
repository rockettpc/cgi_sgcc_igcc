const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { initDatabase } = require('./db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const configRoutes = require('./routes/config');
const temperedRoutes = require('./routes/tempered');
const laminatedRoutes = require('./routes/laminated');
const uploadRoutes = require('./routes/upload');
const exportRoutes = require('./routes/export');
const auditRoutes = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded photos
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/config-lists', configRoutes);
app.use('/api/tempered-tests', temperedRoutes);
app.use('/api/laminated', laminatedRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/audit-logs', auditRoutes);

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static build in production
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        res.sendFile(path.join(clientDist, 'index.html'), (err) => {
            if (err) {
                res.status(200).send('SGCC Break Test API Server is running. (Client build pending)');
            }
        });
    }
});

// Initialize database & Start Server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`SGCC Break Test Server running on port ${PORT}`);
    });
});
