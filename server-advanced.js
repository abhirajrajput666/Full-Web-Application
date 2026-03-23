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

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./study_tracker.db', (err) => {
    if (err) console.error(err);
    else console.log('Connected to SQLite database');
});

// Enhanced Database Schema
db.serialize(() => {
    // Users with profiles
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        avatar TEXT,
        bio TEXT,
        theme TEXT DEFAULT 'light',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Study sessions with notes and ratings
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        duration INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        notes TEXT,
        rating INTEGER,
        mood TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Study goals
    db.run(`CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        target_hours INTEGER NOT NULL,
        current_hours INTEGER DEFAULT 0,
        deadline TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Achievements/Badges
    db.run(`CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Streaks
    db.run(`CREATE TABLE IF NOT EXISTS streaks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_session_date TEXT,
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

// ===== AUTHENTICATION =====
app.post('/api/register', (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run(
        'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
        [username, hashedPassword, email],
        function(err) {
            if (err) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            res.json({ message: 'User registered successfully' });
        }
    );
});

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
        res.json({ token, username: user.username, userId: user.id });
    });
});

// ===== USER PROFILE =====
app.get('/api/profile', authenticateToken, (req, res) => {
    db.get('SELECT id, username, email, avatar, bio, theme FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch profile' });
        res.json(user);
    });
});

app.put('/api/profile', authenticateToken, (req, res) => {
    const { email, avatar, bio, theme } = req.body;
    db.run(
        'UPDATE users SET email = ?, avatar = ?, bio = ?, theme = ? WHERE id = ?',
        [email, avatar, bio, theme, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to update profile' });
            res.json({ message: 'Profile updated' });
        }
    );
});

// ===== SESSIONS =====
app.post('/api/sessions', authenticateToken, (req, res) => {
    const { subject, duration, difficulty, notes, rating, mood } = req.body;
    if (!subject || !duration || !difficulty) {
        return res.status(400).json({ error: 'All fields required' });
    }
    db.run(
        'INSERT INTO sessions (user_id, subject, duration, difficulty, notes, rating, mood) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, subject, duration, difficulty, notes, rating, mood],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to add session' });
            updateStreak(req.user.id, subject);
            checkAchievements(req.user.id);
            res.json({ id: this.lastID, subject, duration, difficulty });
        }
    );
});

app.get('/api/sessions', authenticateToken, (req, res) => {
    const { filter, subject } = req.query;
    let query = 'SELECT * FROM sessions WHERE user_id = ?';
    const params = [req.user.id];

    if (filter === 'today') {
        query += ` AND DATE(created_at) = DATE('now')`;
    } else if (filter === 'week') {
        query += ` AND created_at >= datetime('now', '-7 days')`;
    } else if (filter === 'month') {
        query += ` AND created_at >= datetime('now', '-30 days')`;
    }

    if (subject) {
        query += ` AND subject = ?`;
        params.push(subject);
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch sessions' });
        res.json(rows || []);
    });
});

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

// ===== ANALYTICS & STATS =====
app.get('/api/stats', authenticateToken, (req, res) => {
    db.get(
        `SELECT 
            COUNT(*) as total_sessions,
            SUM(duration) as total_minutes,
            AVG(duration) as avg_duration,
            MAX(rating) as best_rating
         FROM sessions WHERE user_id = ?`,
        [req.user.id],
        (err, row) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
            
            const totalMinutes = row.total_minutes || 0;
            const totalHours = (totalMinutes / 60).toFixed(1);
            const avgDuration = row.avg_duration ? Math.round(row.avg_duration) : 0;

            res.json({
                total_sessions: row.total_sessions || 0,
                total_hours: totalHours,
                avg_duration: avgDuration,
                best_rating: row.best_rating || 0
            });
        }
    );
});

app.get('/api/analytics', authenticateToken, (req, res) => {
    db.all(
        `SELECT subject, COUNT(*) as count, SUM(duration) as total_duration, AVG(rating) as avg_rating
         FROM sessions WHERE user_id = ? GROUP BY subject`,
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch analytics' });
            res.json(rows || []);
        }
    );
});

app.get('/api/weekly-stats', authenticateToken, (req, res) => {
    db.all(
        `SELECT DATE(created_at) as date, SUM(duration) as duration, COUNT(*) as sessions
         FROM sessions WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
         GROUP BY DATE(created_at) ORDER BY date`,
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch weekly stats' });
            res.json(rows || []);
        }
    );
});

// ===== GOALS =====
app.post('/api/goals', authenticateToken, (req, res) => {
    const { subject, target_hours, deadline } = req.body;
    if (!subject || !target_hours) {
        return res.status(400).json({ error: 'Subject and target hours required' });
    }
    db.run(
        'INSERT INTO goals (user_id, subject, target_hours, deadline) VALUES (?, ?, ?, ?)',
        [req.user.id, subject, target_hours, deadline],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to create goal' });
            res.json({ id: this.lastID, subject, target_hours });
        }
    );
});

app.get('/api/goals', authenticateToken, (req, res) => {
    db.all(
        `SELECT g.*, COALESCE(SUM(s.duration)/60, 0) as current_hours
         FROM goals g
         LEFT JOIN sessions s ON g.user_id = s.user_id AND g.subject = s.subject
         WHERE g.user_id = ? GROUP BY g.id`,
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch goals' });
            res.json(rows || []);
        }
    );
});

app.delete('/api/goals/:id', authenticateToken, (req, res) => {
    db.run(
        'DELETE FROM goals WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to delete goal' });
            res.json({ message: 'Goal deleted' });
        }
    );
});

// ===== ACHIEVEMENTS =====
app.get('/api/achievements', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM achievements WHERE user_id = ? ORDER BY earned_at DESC',
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch achievements' });
            res.json(rows || []);
        }
    );
});

// ===== STREAKS =====
app.get('/api/streaks', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM streaks WHERE user_id = ?',
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch streaks' });
            res.json(rows || []);
        }
    );
});

// ===== HELPER FUNCTIONS =====
function updateStreak(userId, subject) {
    db.get(
        'SELECT * FROM streaks WHERE user_id = ? AND subject = ?',
        [userId, subject],
        (err, streak) => {
            const today = new Date().toISOString().split('T')[0];
            if (!streak) {
                db.run(
                    'INSERT INTO streaks (user_id, subject, current_streak, longest_streak, last_session_date) VALUES (?, ?, 1, 1, ?)',
                    [userId, subject, today]
                );
            } else {
                const lastDate = streak.last_session_date;
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                let newStreak = streak.current_streak;
                if (lastDate === yesterday) {
                    newStreak = streak.current_streak + 1;
                } else if (lastDate !== today) {
                    newStreak = 1;
                }
                const longestStreak = Math.max(newStreak, streak.longest_streak);
                db.run(
                    'UPDATE streaks SET current_streak = ?, longest_streak = ?, last_session_date = ? WHERE id = ?',
                    [newStreak, longestStreak, today, streak.id]
                );
            }
        }
    );
}

function checkAchievements(userId) {
    db.get('SELECT COUNT(*) as count FROM sessions WHERE user_id = ?', [userId], (err, row) => {
        if (!err && row) {
            const count = row.count;
            const achievements = [
                { count: 1, title: '🎯 First Step', description: 'Complete your first study session' },
                { count: 5, title: '🔥 Getting Started', description: 'Complete 5 study sessions' },
                { count: 10, title: '⭐ Dedicated', description: 'Complete 10 study sessions' },
                { count: 25, title: '🏆 Expert', description: 'Complete 25 study sessions' },
                { count: 50, title: '👑 Master', description: 'Complete 50 study sessions' }
            ];

            achievements.forEach(ach => {
                if (count === ach.count) {
                    db.get(
                        'SELECT * FROM achievements WHERE user_id = ? AND title = ?',
                        [userId, ach.title],
                        (err, existing) => {
                            if (!existing) {
                                db.run(
                                    'INSERT INTO achievements (user_id, title, description, icon) VALUES (?, ?, ?, ?)',
                                    [userId, ach.title, ach.description, '🎖️']
                                );
                            }
                        }
                    );
                }
            });
        }
    });
}

app.listen(PORT, () => {
    console.log(`Advanced Study Tracker running on http://localhost:${PORT}`);
});
