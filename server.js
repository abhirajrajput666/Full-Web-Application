const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database Setup
const db = new sqlite3.Database('./study_tracker.db', (err) => {
    if (err) console.error(err);
    else console.log('Connected to SQLite database');
});

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        duration INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Routes

// Register
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword],
        function(err) {
            if (err) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            res.json({ message: 'User registered successfully' });
        }
    );
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, username: user.username });
    });
});

// Add Session
app.post('/api/sessions', authenticateToken, (req, res) => {
    const { subject, duration, difficulty } = req.body;

    if (!subject || !duration || !difficulty) {
        return res.status(400).json({ error: 'All fields required' });
    }

    db.run(
        'INSERT INTO sessions (user_id, subject, duration, difficulty) VALUES (?, ?, ?, ?)',
        [req.user.id, subject, duration, difficulty],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to add session' });
            res.json({ id: this.lastID, subject, duration, difficulty });
        }
    );
});

// Get Sessions
app.get('/api/sessions', authenticateToken, (req, res) => {
    const { filter } = req.query;
    let query = 'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC';
    const params = [req.user.id];

    if (filter === 'today') {
        query = `SELECT * FROM sessions WHERE user_id = ? 
                 AND DATE(created_at) = DATE('now') 
                 ORDER BY created_at DESC`;
    } else if (filter === 'week') {
        query = `SELECT * FROM sessions WHERE user_id = ? 
                 AND created_at >= datetime('now', '-7 days') 
                 ORDER BY created_at DESC`;
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch sessions' });
        res.json(rows || []);
    });
});

// Get Stats
app.get('/api/stats', authenticateToken, (req, res) => {
    db.get(
        `SELECT 
            COUNT(*) as total_sessions,
            SUM(duration) as total_minutes
         FROM sessions WHERE user_id = ?`,
        [req.user.id],
        (err, row) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
            
            const totalMinutes = row.total_minutes || 0;
            const totalHours = (totalMinutes / 60).toFixed(1);
            const avgDuration = row.total_sessions > 0 ? Math.round(totalMinutes / row.total_sessions) : 0;

            res.json({
                total_sessions: row.total_sessions || 0,
                total_hours: totalHours,
                avg_duration: avgDuration
            });
        }
    );
});

// Delete Session
app.delete('/api/sessions/:id', authenticateToken, (req, res) => {
    db.run(
        'DELETE FROM sessions WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to delete session' });
            res.json({ message: 'Session deleted' });
        }
    );
});

// Clear Old Sessions
app.delete('/api/sessions/clear/old', authenticateToken, (req, res) => {
    db.run(
        `DELETE FROM sessions WHERE user_id = ? 
         AND created_at < datetime('now', '-30 days')`,
        [req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to clear sessions' });
            res.json({ message: 'Old sessions cleared', deleted: this.changes });
        }
    );
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
