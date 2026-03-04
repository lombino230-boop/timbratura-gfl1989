// --- State ---
let state = {
    user: null,
    token: null,
    activeTab: 'home',
    records: [],
    holidays: [],
    adminHolidays: [],
    users: [],
    locations: [],
    coords: null,
    activeSession: null,
    notes: ""
};

// --- Icons (Inline SVG helpers) ---
const icons = {
    clock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    mapPin: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    logout: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
    calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
    palmtree: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2c1.66 0 3 1.34 3 3v9"/><path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3c0-1.66-1.34-3-3-3"/><path d="M5.89 9.71c.45 2.1 2.55 3.79 5.05 3.79 4.9 0 6.1-3.5 6.1-3.5"/><path d="M11 13v7"/><path d="M7 20h8"/></svg>',
    shield: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    history: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
    chevronRight: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    chevronLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    building: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>',
    users: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    download: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>'
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    restoreSession();
    render();

    // GPS Init
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => state.coords = { lat: pos.coords.latitude, lon: pos.coords.longitude },
            () => console.warn("GPS non disponibile")
        );
    }
});

function restoreSession() {
    const token = localStorage.getItem('gc_token');
    const user = localStorage.getItem('gc_user');
    if (token && user) {
        state.token = token;
        state.user = JSON.parse(user);
        fetchDashboardData();
    }
}

// --- API Wrapper ---
async function apiFetch(url, options = {}) {
    const headers = { ...options.headers };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

    try {
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) logout();
        return res;
    } catch (e) {
        return { ok: false, json: async () => ({ error: "Errore di connessione" }) };
    }
}

// --- Auth Actions ---
async function login(email, password) {
    const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('gc_token', data.token);
        localStorage.setItem('gc_user', JSON.stringify(data.user));
        fetchDashboardData();
        render();
    } else {
        alert(data.error || "Errore login");
    }
}

function logout() {
    state.user = null;
    state.token = null;
    localStorage.removeItem('gc_token');
    localStorage.removeItem('gc_user');
    render();
}

// --- Data Fetching ---
async function fetchDashboardData() {
    if (!state.user) return;

    if (state.user.role === 'admin') {
        const [rec, users, loc, hol] = await Promise.all([
            apiFetch('/api/admin/records').then(r => r.json()),
            apiFetch('/api/admin/users').then(r => r.json()),
            apiFetch('/api/admin/locations').then(r => r.json()),
            apiFetch('/api/admin/holidays').then(r => r.json())
        ]);
        state.records = rec;
        state.users = users;
        state.locations = loc;
        state.adminHolidays = hol;
    } else {
        const [rec, hol] = await Promise.all([
            apiFetch('/api/history').then(r => r.json()),
            apiFetch('/api/holidays').then(r => r.json())
        ]);
        state.records = rec;
        state.holidays = hol;
        state.activeSession = rec.find(r => !r.out_time) || null;
    }
    render();
}

// --- Render Logic ---
function render() {
    const root = document.getElementById('root');
    if (!state.user) {
        renderLogin(root);
    } else if (state.user.role === 'admin') {
        renderAdmin(root);
    } else {
        renderEmployee(root);
    }
}

function renderLogin(root) {
    root.innerHTML = `
        <div id="login-page">
            <div class="login-card">
                <div class="logo-box">${icons.clock}</div>
                <h1>GeoClock</h1>
                <p class="subtitle">Accedi per timbrare la tua presenza</p>
                <form id="login-form">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="login-email" value="mario@geoclock.it" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="login-password" value="user123" required>
                    </div>
                    <button type="submit" class="btn">Accedi</button>
                    <div style="margin-top: 2rem; font-size: 10px; text-align: center; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">
                        Credenziali Demo <br>
                        Admin: admin@geoclock.it / admin123 <br>
                        User: mario@geoclock.it / user123
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('login-form').onsubmit = (e) => {
        e.preventDefault();
        login(document.getElementById('login-email').value, document.getElementById('login-password').value);
    };
}

function renderEmployee(root) {
    root.innerHTML = `
        <div class="dashboard-container">
            <header>
                <div class="user-info">
                    <h2>Ciao, ${state.user.name}</h2>
                    <p>${new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <button class="logout-btn" onclick="logout()">${icons.logout}</button>
            </header>

            <div id="tab-content">
                ${renderTabContent()}
            </div>

            <nav class="bottom-nav">
                <button class="nav-item ${state.activeTab === 'home' ? 'active' : ''}" onclick="switchTab('home')">
                    ${icons.clock} <span>TIMBRA</span>
                </button>
                <button class="nav-item ${state.activeTab === 'calendar' ? 'active' : ''}" onclick="switchTab('calendar')">
                    ${icons.calendar} <span>CALENDARIO</span>
                </button>
                <button class="nav-item ${state.activeTab === 'holidays' ? 'active' : ''}" onclick="switchTab('holidays')">
                    ${icons.palmtree} <span>FERIE</span>
                </button>
            </nav>
        </div>
    `;

    if (state.activeTab === 'home') initSlider();
}

function renderTabContent() {
    if (state.activeTab === 'home') {
        return `
            <div class="slider-container">
                <div style="margin-bottom: 1rem">
                    <label>Note (opzionale)</label>
                    <textarea id="clock-notes" placeholder="Note turno..." oninput="state.notes = this.value">${state.notes}</textarea>
                </div>
                <div class="slider-track ${state.activeSession ? 'out' : 'in'}" id="slider-track">
                    <div class="slider-text">TRASCINA PER ${state.activeSession ? 'USCIRE' : 'ENTRARE'}</div>
                    <div class="slider-handle" id="slider-handle">
                        ${state.activeSession ? icons.logout : icons.chevronRight}
                    </div>
                </div>
                <div style="text-align: center; margin-top: 1.5rem; color: var(--text-muted); font-size: 10px; display: flex; align-items: center; justify-content: center; gap: 4px;">
                    ${icons.mapPin} ${state.coords ? `${state.coords.lat.toFixed(4)}, ${state.coords.lon.toFixed(4)}` : 'Ricerca posizione...'}
                </div>
            </div>

            <div class="section-title" style="font-weight: 800; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                ${icons.history} Storico Recente
            </div>
            <div class="history-list">
                ${state.records.slice(0, 5).map(r => `
                    <div class="card" style="padding: 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="background: #f8fafc; padding: 0.5rem; border-radius: 12px; color: var(--primary);">
                                ${icons.clock}
                            </div>
                            <div>
                                <div style="font-weight: 700;">${formatTime(r.in_time)} ${r.out_time ? '- ' + formatTime(r.out_time) : ''}</div>
                                <div style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); font-weight: 800;">
                                    ${new Date(r.in_time).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </div>
                            </div>
                        </div>
                        ${icons.chevronRight}
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (state.activeTab === 'calendar') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const start = new Date(firstDay);
        start.setDate(firstDay.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));

        const days = [];
        let curr = new Date(start);
        for (let i = 0; i < 42; i++) {
            days.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }

        return `
            <div class="card">
                <div class="card-title" style="text-transform: capitalize;">${now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</div>
                <div class="calendar-grid">
                    ${['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
                    ${days.map(d => {
            const dayRecords = state.records.filter(r => isSameDay(new Date(r.in_time), d));
            const isOtherMonth = d.getMonth() !== now.getMonth();
            return `
                            <div class="calendar-day ${isOtherMonth ? 'other-month' : ''}">
                                <div style="font-weight: 700; color: ${isSameDay(d, new Date()) ? 'var(--primary)' : 'inherit'}">${d.getDate()}</div>
                                ${dayRecords.map(r => `
                                    <div style="background: #dcfce7; color: #166534; padding: 2px; border-radius: 4px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${formatTime(r.in_time)}
                                    </div>
                                `).join('')}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    if (state.activeTab === 'holidays') {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="font-weight: 800;">Le mie Ferie</h3>
                <button class="btn" style="width: auto; padding: 0.5rem 1rem;" onclick="toggleHolidayForm()">Nuova Richiesta</button>
            </div>
            
            <div id="holiday-form" class="card hidden" style="padding: 1.5rem; margin-bottom: 1.5rem;">
                <form onsubmit="submitHoliday(event)">
                    <div class="form-group">
                        <label>Tipo</label>
                        <select name="type">
                            <option value="holiday">Ferie</option>
                            <option value="sick">Malattia</option>
                            <option value="permit">Permesso</option>
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">

                        <div class="form-group"><label>Inizio</label><input type="date" name="start_date" required></div>
                        <div class="form-group"><label>Fine</label><input type="date" name="end_date" required></div>
                    </div>
                    <button type="submit" class="btn">Invia Richiesta</button>
                </form>
            </div>

            ${state.holidays.map(h => `
                <div class="card" style="padding: 1rem; display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="background: #fefce8; padding: 0.5rem; border-radius: 12px; color: #ca8a04;">
                            ${icons.palmtree}
                        </div>
                        <div>
                            <div style="font-weight: 700; text-transform: capitalize;">${h.type}</div>
                            <div style="font-size: 10px; color: var(--text-muted); font-weight: 800;">
                                ${new Date(h.start_date).toLocaleDateString()} - ${new Date(h.end_date).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <span class="status-badge status-${h.status || 'pending'}">${h.status || 'pending'}</span>
                </div>
            `).join('')}
        `;
    }
}

function renderAdmin(root) {
    if (!state.adminTab) state.adminTab = 'records';

    root.innerHTML = `
        <div class="admin-shell">
            <aside class="sidebar">
                <div style="display: flex; align-items: center; gap: 12px; color: var(--primary); margin-bottom: 0.5rem;">
                    ${icons.shield} <span style="font-weight: 900; font-size: 1.25rem;">GeoClock</span>
                </div>
                <div style="font-size: 10px; font-weight: 900; color: var(--text-muted); text-transform: uppercase;">Admin Panel</div>
                
                <nav class="sidebar-nav">
                    <button class="sidebar-link ${state.adminTab === 'records' ? 'active' : ''}" onclick="switchAdminTab('records')">${icons.history} Timbrature</button>
                    <button class="sidebar-link ${state.adminTab === 'users' ? 'active' : ''}" onclick="switchAdminTab('users')">${icons.users} Dipendenti</button>
                    <button class="sidebar-link ${state.adminTab === 'locations' ? 'active' : ''}" onclick="switchAdminTab('locations')">${icons.building} Sedi</button>
                    <button class="sidebar-link ${state.adminTab === 'holidays' ? 'active' : ''}" onclick="switchAdminTab('holidays')">${icons.palmtree} Richieste Ferie</button>
                </nav>
                
                <button class="sidebar-link" onclick="logout()" style="margin-top: auto;">${icons.logout} Esci</button>
            </aside>
            
            <main class="admin-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem;">
                    <h2 style="font-size: 2rem; font-weight: 900; text-transform: capitalize;">${state.adminTab}</h2>
                    <button class="btn" style="width: auto; background: var(--text-main)" onclick="downloadProject()">
                        ${icons.download} <span style="margin-left: 8px">Scarica Sorgenti</span>
                    </button>
                </div>
                
                ${renderAdminTabContent()}
            </main>
        </div>
    `;
}

function renderAdminTabContent() {
    if (state.adminTab === 'records') {
        return `
            <div class="card">
                <table>
                    <thead>
                        <tr>
                            <th>Dipendente</th>
                            <th>Entrata</th>
                            <th>Uscita</th>
                            <th>Sede</th>
                            <th>Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.records.map(r => `
                            <tr>
                                <td style="font-weight: 700;">${r.user_name}</td>
                                <td>${new Date(r.in_time).toLocaleString()}</td>
                                <td>${r.out_time ? new Date(r.out_time).toLocaleString() : '---'}</td>
                                <td>${r.location_name || 'Esterna'}</td>
                                <td style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">${r.notes || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    if (state.adminTab === 'holidays') {
        return `
            <div class="card">
                <table>
                    <thead>
                        <tr>
                            <th>Dipendente</th>
                            <th>Tipo</th>
                            <th>Periodo</th>
                            <th>Stato</th>
                            <th>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.adminHolidays.map(h => `
                            <tr>
                                <td style="font-weight: 700;">${h.user_name}</td>
                                <td style="text-transform: capitalize;">${h.type}</td>
                                <td>${new Date(h.start_date).toLocaleDateString()} - ${new Date(h.end_date).toLocaleDateString()}</td>
                                <td><span class="status-badge status-${h.status}">${h.status}</span></td>
                                <td>
                                    ${h.status === 'pending' ? `
                                        <div style="display: flex; gap: 8px;">
                                            <button class="btn" onclick="updateHolidayStatus(${h.id}, 'approved')" style="width: auto; padding: 4px 8px; background: var(--success); font-size: 10px;">Approva</button>
                                            <button class="btn" onclick="updateHolidayStatus(${h.id}, 'rejected')" style="width: auto; padding: 4px 8px; background: var(--error); font-size: 10px;">Rifiuta</button>
                                        </div>
                                    ` : '---'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    return `<div class="card" style="padding: 2rem; color: var(--text-muted); text-align: center;">Coming soon...</div>`;
}

// --- Interaction Helpers ---
function switchTab(tab) {
    state.activeTab = tab;
    render();
}

function switchAdminTab(tab) {
    state.adminTab = tab;
    render();
}

function toggleHolidayForm() {
    document.getElementById('holiday-form').classList.toggle('hidden');
}

async function submitHoliday(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const res = await apiFetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) fetchDashboardData();
}

async function updateHolidayStatus(id, status) {
    const res = await apiFetch('/api/admin/holidays/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
    });
    if (res.ok) fetchDashboardData();
}

// --- Slider Logic ---
function initSlider() {
    const track = document.getElementById('slider-track');
    const handle = document.getElementById('slider-handle');
    if (!track || !handle) return;

    let isDragging = false;
    let startX = 0;
    const max = track.offsetWidth - handle.offsetWidth - 16;

    const onStart = (e) => {
        isDragging = true;
        startX = (e.pageX || e.touches[0].pageX) - handle.offsetLeft;
    };

    const onMove = (e) => {
        if (!isDragging) return;
        let x = (e.pageX || e.touches[0].pageX) - startX;
        x = Math.max(0, Math.min(x, max));
        handle.style.transform = `translateX(${x}px)`;

        if (x >= max) {
            isDragging = false;
            handle.style.transform = `translateX(0px)`;
            performClockAction();
        }
    };

    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        handle.style.transform = `translateX(0px)`;
    };

    handle.onmousedown = onStart;
    window.onmousemove = onMove;
    window.onmouseup = onEnd;

    handle.ontouchstart = onStart;
    window.ontouchmove = onMove;
    window.ontouchend = onEnd;
}

async function performClockAction() {
    const type = state.activeSession ? 'out' : 'in';
    if (!state.coords) {
        alert("Attendi il GPS");
        return;
    }

    const res = await apiFetch(`/api/clock-${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state.coords, notes: state.notes })
    });

    if (res.ok) {
        state.notes = "";
        fetchDashboardData();
    } else {
        const data = await res.json();
        alert(data.error || "Errore timbratura");
    }
}

// --- Utilities ---
function formatTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

async function downloadProject() {
    const res = await fetch('/api/download-project');
    if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'geoclock-project.zip';
        a.click();
    }
}
