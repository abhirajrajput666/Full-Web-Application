const API_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let currentUser = localStorage.getItem('username');
let authMode = 'login';
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (token && currentUser) {
        showApp();
    }
});

// Auth Functions
function switchTab(mode) {
    authMode = mode;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('authSubmit').textContent = mode === 'login' ? 'Login' : 'Register';
    document.getElementById('authError').textContent = '';
}

async function submitAuth() {
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const errorDiv = document.getElementById('authError');

    if (!username || !password) {
        errorDiv.textContent = 'Please fill all fields';
        return;
    }

    try {
        const endpoint = authMode === 'register' ? '/register' : '/login';
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorDiv.textContent = data.error || 'Authentication failed';
            return;
        }

        if (authMode === 'register') {
            errorDiv.style.color = '#27ae60';
            errorDiv.textContent = 'Registration successful! Please login.';
            setTimeout(() => switchTab('login'), 1500);
        } else {
            token = data.token;
            currentUser = data.username;
            localStorage.setItem('token', token);
            localStorage.setItem('username', currentUser);
            document.getElementById('authUsername').value = '';
            document.getElementById('authPassword').value = '';
            showApp();
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Make sure server is running.';
        console.error(error);
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';
    document.getElementById('authError').textContent = '';
}

function showApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    document.getElementById('welcomeUser').textContent = `Welcome, ${currentUser}!`;
    loadSessions();
    updateStats();
}

// Session Functions
async function addSession() {
    const subject = document.getElementById('subjectInput').value.trim();
    const duration = parseInt(document.getElementById('durationInput').value);
    const difficulty = document.getElementById('difficulty').value;

    if (!subject || !duration || duration <= 0) {
        alert('Please fill all fields correctly');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ subject, duration, difficulty })
        });

        if (!response.ok) throw new Error('Failed to add session');

        document.getElementById('subjectInput').value = '';
        document.getElementById('durationInput').value = '';
        document.getElementById('difficulty').value = 'medium';

        loadSessions();
        updateStats();
    } catch (error) {
        alert('Error adding session: ' + error.message);
    }
}

async function deleteSession(id) {
    try {
        const response = await fetch(`${API_URL}/sessions/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to delete session');

        loadSessions();
        updateStats();
    } catch (error) {
        alert('Error deleting session: ' + error.message);
    }
}

function filterSessions(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadSessions();
}

async function loadSessions() {
    try {
        const response = await fetch(`${API_URL}/sessions?filter=${currentFilter}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load sessions');

        const sessions = await response.json();
        const list = document.getElementById('sessionList');
        list.innerHTML = '';

        if (sessions.length === 0) {
            list.innerHTML = '<div class="empty-msg">No sessions yet. Start studying!</div>';
            document.getElementById('count').textContent = '0 sessions';
            return;
        }

        sessions.forEach(session => {
            const li = document.createElement('li');
            li.className = `session-item ${session.difficulty}`;
            const date = new Date(session.created_at).toLocaleDateString();
            const time = new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            li.innerHTML = `
                <div class="session-info">
                    <div class="session-subject">${session.subject}</div>
                    <div class="session-details">${session.duration} min • ${session.difficulty} • ${date} ${time}</div>
                </div>
                <div class="session-actions">
                    <button class="delete-btn" onclick="deleteSession(${session.id})">Delete</button>
                </div>
            `;
            list.appendChild(li);
        });

        document.getElementById('count').textContent = `${sessions.length} session${sessions.length !== 1 ? 's' : ''}`;
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load stats');

        const stats = await response.json();
        document.getElementById('totalHours').textContent = stats.total_hours;
        document.getElementById('totalSessions').textContent = stats.total_sessions;
        document.getElementById('avgDuration').textContent = stats.avg_duration + 'm';
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function clearOldSessions() {
    if (!confirm('Delete all sessions older than 30 days?')) return;

    try {
        const response = await fetch(`${API_URL}/sessions/clear/old`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to clear sessions');

        loadSessions();
        updateStats();
    } catch (error) {
        alert('Error clearing sessions: ' + error.message);
    }
}
