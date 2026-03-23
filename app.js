let currentUser = null;
let authMode = 'login';
let users = JSON.parse(localStorage.getItem('users')) || { 'abhiraj': '1234' };
let sessions = JSON.parse(localStorage.getItem('sessions')) || {};
let currentFilter = 'all';

// Initialize default user
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(users));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
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

function submitAuth() {
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const errorDiv = document.getElementById('authError');

    if (!username || !password) {
        errorDiv.textContent = 'Please fill all fields';
        return;
    }

    if (authMode === 'register') {
        if (users[username]) {
            errorDiv.textContent = 'Username already exists';
            return;
        }
        users[username] = password;
        localStorage.setItem('users', JSON.stringify(users));
        errorDiv.textContent = '';
        errorDiv.style.color = '#27ae60';
        errorDiv.textContent = 'Registration successful! Please login.';
        setTimeout(() => switchTab('login'), 1500);
    } else {
        if (!users[username] || users[username] !== password) {
            errorDiv.textContent = 'Invalid username or password';
            return;
        }
        currentUser = username;
        localStorage.setItem('currentUser', currentUser);
        document.getElementById('authUsername').value = '';
        document.getElementById('authPassword').value = '';
        showApp();
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
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
function addSession() {
    const subject = document.getElementById('subjectInput').value.trim();
    const duration = parseInt(document.getElementById('durationInput').value);
    const difficulty = document.getElementById('difficulty').value;

    if (!subject || !duration || duration <= 0) {
        alert('Please fill all fields correctly');
        return;
    }

    if (!sessions[currentUser]) {
        sessions[currentUser] = [];
    }

    const session = {
        id: Date.now(),
        subject,
        duration,
        difficulty,
        date: new Date().toISOString()
    };

    sessions[currentUser].push(session);
    localStorage.setItem('sessions', JSON.stringify(sessions));

    document.getElementById('subjectInput').value = '';
    document.getElementById('durationInput').value = '';
    document.getElementById('difficulty').value = 'medium';

    loadSessions();
    updateStats();
}

function deleteSession(id) {
    sessions[currentUser] = sessions[currentUser].filter(s => s.id !== id);
    localStorage.setItem('sessions', JSON.stringify(sessions));
    loadSessions();
    updateStats();
}

function filterSessions(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadSessions();
}

function loadSessions() {
    const list = document.getElementById('sessionList');
    list.innerHTML = '';

    const userSessions = sessions[currentUser] || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    let filtered = userSessions;

    if (currentFilter === 'today') {
        filtered = userSessions.filter(s => {
            const sessionDate = new Date(s.date);
            const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
            return sessionDay.getTime() === today.getTime();
        });
    } else if (currentFilter === 'week') {
        filtered = userSessions.filter(s => {
            const sessionDate = new Date(s.date);
            return sessionDate >= weekAgo;
        });
    }

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-msg">No sessions yet. Start studying!</div>';
        document.getElementById('count').textContent = '0 sessions';
        return;
    }

    filtered.reverse().forEach(session => {
        const li = document.createElement('li');
        li.className = `session-item ${session.difficulty}`;
        const date = new Date(session.date).toLocaleDateString();
        const time = new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
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

    document.getElementById('count').textContent = `${filtered.length} session${filtered.length !== 1 ? 's' : ''}`;
}

function updateStats() {
    const userSessions = sessions[currentUser] || [];
    
    const totalMinutes = userSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const avgDuration = userSessions.length > 0 ? Math.round(totalMinutes / userSessions.length) : 0;

    document.getElementById('totalHours').textContent = totalHours;
    document.getElementById('totalSessions').textContent = userSessions.length;
    document.getElementById('avgDuration').textContent = avgDuration + 'm';
}

function clearOldSessions() {
    if (!confirm('Delete all sessions older than 30 days?')) return;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    sessions[currentUser] = (sessions[currentUser] || []).filter(s => {
        return new Date(s.date) >= thirtyDaysAgo;
    });

    localStorage.setItem('sessions', JSON.stringify(sessions));
    loadSessions();
    updateStats();
}
