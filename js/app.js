// PWA install prompt
let _installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _installPrompt = e;
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.style.display = 'flex';
});

const app = {
    state: {
        screen:        'login',
        selectedEvent: null,
        logInterval:   null,
        statsInterval: null,
    },

    async render(screen, data = {}) {
        if (this.state.screen === 'scanner' && screen !== 'scanner') scanner.stop();
        if (this.state.logInterval)   { clearInterval(this.state.logInterval);   this.state.logInterval = null; }
        if (this.state.statsInterval) { clearInterval(this.state.statsInterval); this.state.statsInterval = null; }

        this.state.screen = screen;
        const root = document.getElementById('app');

        switch (screen) {
            case 'login':     root.innerHTML = this._loginHTML();             break;
            case 'events':    await this._renderEvents(root);                 break;
            case 'dashboard': await this._renderDashboard(root, data.event);  break;
            case 'scanner':   this._renderScanner(root);                      break;
            case 'manual':    this._renderManual(root);                       break;
            case 'log':       await this._renderLog(root);                    break;
        }
    },

    // ─── LOGIN ──────────────────────────────────────────────────────────────
    _loginHTML() {
        return `
        <div class="login-screen">
            <div class="login-top">
                <img src="${SITE_URL}/icons/logo-white.svg" alt="Tuqio Hub" class="login-logo">
                <h1 class="login-title">Gate <span class="login-title-accent">Scanner</span></h1>
                <p class="login-sub">Event entry check-in</p>
            </div>

            <div class="login-card">
                <form id="login-form">
                    <div class="field">
                        <label class="field-label">Email address</label>
                        <input type="email" id="login-email" class="field-input" autocomplete="email" placeholder="you@tuqiohub.africa" required>
                    </div>
                    <div class="field">
                        <label class="field-label">Password</label>
                        <input type="password" id="login-password" class="field-input" autocomplete="current-password" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn-signin" id="login-btn">
                        <span>Sign In</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                </form>
            </div>

            <button class="install-banner" id="pwa-install-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v13M8 11l4 4 4-4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
                <span>Install as app on your device</span>
            </button>

            <p class="login-version">Tuqio Gate v${APP_VERSION} · ${APP_ENV}</p>
        </div>`;
    },

    _bindLogin() {
        const ARROW_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

        document.getElementById('login-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn      = document.getElementById('login-btn');
            const email    = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            btn.disabled  = true;
            btn.innerHTML = '<span>Signing in…</span>';

            try {
                const result = await auth.login(email, password);
                if (result.ok) {
                    toast.success('Welcome back! Loading events…');
                    setTimeout(() => app.render('events'), 600);
                } else {
                    toast.error(result.message || 'Invalid email or password.');
                    btn.disabled  = false;
                    btn.innerHTML = `<span>Sign In</span>${ARROW_SVG}`;
                }
            } catch (err) {
                if (!err.auth) {
                    toast.error(err.message || 'Connection error. Is the server running?');
                }
                btn.disabled  = false;
                btn.innerHTML = `<span>Sign In</span>${ARROW_SVG}`;
            }
        });

        // PWA install banner button
        document.getElementById('pwa-install-btn')?.addEventListener('click', () => pwa.show());
    },

    // ─── EVENTS LIST ────────────────────────────────────────────────────────
    async _renderEvents(root) {
        root.innerHTML = `
        <div class="screen">
            <div class="app-header">
                <img src="${SITE_URL}/icons/logo-white.svg" alt="Tuqio" class="header-logo">
                <span class="header-title">Events</span>
                <button class="btn-icon-header" id="logout-btn" title="Logout">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                </button>
            </div>
            <div id="events-content" class="events-content">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading events…</p>
                </div>
            </div>
        </div>`;

        document.getElementById('logout-btn').addEventListener('click', () => {
            auth.logout();
            app.render('login');
        });

        try {
            const data   = await eventsModule.fetchEvents();
            const events = data.data || [];

            if (!events.length) {
                document.getElementById('events-content').innerHTML =
                    `<div class="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        <p>No events with ticketing available.</p>
                     </div>`;
                return;
            }

            document.getElementById('events-content').innerHTML = `
            <div class="events-grid">
                ${events.map(ev => `
                <div class="event-card" data-id="${ev.id}">
                    <div class="event-card-img" style="background-image:url('${ev.banner_image || ''}')">
                        <div class="event-card-overlay"></div>
                        <div class="event-card-info">
                            <div class="event-card-name">${this._esc(ev.name)}</div>
                            <div class="event-card-date">${this._formatDate(ev.start_date)}</div>
                        </div>
                    </div>
                    <div class="event-card-footer">
                        <span class="event-card-venue">${this._esc(ev.venue_name || 'Venue TBC')}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                </div>`).join('')}
            </div>`;

            document.querySelectorAll('.event-card').forEach(card => {
                card.addEventListener('click', async () => {
                    const id = card.dataset.id;
                    card.classList.add('loading-card');
                    try {
                        const eventData = await eventsModule.fetchEventDetail(id);
                        this.state.selectedEvent = eventData;
                        app.render('dashboard', { event: eventData });
                    } catch (_) {
                        card.classList.remove('loading-card');
                        alert('Could not load event. Check your connection.');
                    }
                });
            });

        } catch (err) {
            document.getElementById('events-content').innerHTML =
                `<div class="alert alert-error">${err.message || 'Failed to load events.'}</div>`;
        }
    },

    // ─── DASHBOARD ──────────────────────────────────────────────────────────
    async _renderDashboard(root, event) {
        if (!event) { app.render('events'); return; }

        root.innerHTML = `
        <div class="screen">
            <div class="app-header">
                <button class="btn-icon-header" id="back-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <span class="header-title">${this._esc(event.name)}</span>
                <span></span>
            </div>
            <div class="dashboard-body">
                <div class="event-banner" style="background-image:url('${event.banner_image || ''}')">
                    <div class="event-banner-overlay">
                        <div class="event-banner-name">${this._esc(event.name)}</div>
                        <div class="event-banner-meta">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            ${this._esc(event.venue_name || '')}
                            &nbsp;·&nbsp;
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                            ${this._formatDate(event.start_date)}
                        </div>
                    </div>
                </div>

                <div class="stats-grid" id="stats-grid">
                    ${this._statsHTML(event.stats)}
                </div>

                <div class="progress-wrap">
                    <div class="progress-labels">
                        <span>Check-in progress</span>
                        <span id="progress-pct">${event.stats?.check_in_rate ?? 0}%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" id="progress-fill" style="width:${event.stats?.check_in_rate ?? 0}%"></div>
                    </div>
                </div>

                <button class="btn-scan-big" id="scan-btn">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="7" height="7" rx="1"/><rect x="15" y="2" width="7" height="7" rx="1"/><rect x="2" y="15" width="7" height="7" rx="1"/><path d="M15 15h2v2h-2zM19 15h2M15 19h2M19 19h2M19 17h2"/></svg>
                    Start Scanning
                </button>
                <button class="btn-outline" id="log-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    Recent Check-Ins
                </button>
            </div>
        </div>`;

        document.getElementById('back-btn').addEventListener('click', () => app.render('events'));
        document.getElementById('scan-btn').addEventListener('click', () => app.render('scanner'));
        document.getElementById('log-btn').addEventListener('click', () => app.render('log'));

        this.state.statsInterval = setInterval(async () => {
            try {
                const fresh = await eventsModule.fetchEventDetail(event.id);
                this.state.selectedEvent = fresh;
                const grid = document.getElementById('stats-grid');
                if (grid) grid.innerHTML = this._statsHTML(fresh.stats);
                const fill = document.getElementById('progress-fill');
                const pct  = document.getElementById('progress-pct');
                if (fill) fill.style.width = `${fresh.stats?.check_in_rate ?? 0}%`;
                if (pct)  pct.textContent  = `${fresh.stats?.check_in_rate ?? 0}%`;
            } catch (_) {}
        }, 15000);
    },

    _statsHTML(stats = {}) {
        const items = [
            { value: stats.total_tickets    ?? '—', label: 'Total',      color: '' },
            { value: stats.checked_in_count ?? '—', label: 'Checked In', color: 'green' },
            { value: stats.pending_count    ?? '—', label: 'Pending',    color: 'amber' },
            { value: (stats.check_in_rate ?? 0) + '%', label: 'Rate',   color: 'blue' },
        ];
        return items.map(i => `
        <div class="stat-card">
            <div class="stat-value ${i.color}">${i.value}</div>
            <div class="stat-label">${i.label}</div>
        </div>`).join('');
    },

    // ─── SCANNER ────────────────────────────────────────────────────────────
    _renderScanner(root) {
        const event = this.state.selectedEvent;
        if (!event) { app.render('events'); return; }
        checkin.currentEventId = event.id;

        root.innerHTML = `
        <div class="scanner-screen">
            <div class="scanner-header">
                <button class="btn-icon-header" id="scanner-back">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <span>${this._esc(event.name)}</span>
                <button class="btn-icon-header" id="scanner-manual-btn" title="Manual entry">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h6"/></svg>
                </button>
            </div>
            <div class="scanner-viewport">
                <video id="scanner-video" playsinline muted autoplay></video>
                <div class="scan-frame">
                    <div class="scan-corner tl"></div>
                    <div class="scan-corner tr"></div>
                    <div class="scan-corner bl"></div>
                    <div class="scan-corner br"></div>
                    <div class="scan-line"></div>
                </div>
                <p class="scan-hint">Align QR code within the frame</p>
            </div>
            <div class="manual-bar">
                <input type="text" id="manual-code" placeholder="Enter ticket code manually…" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false">
                <button id="manual-submit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
            </div>
            <div id="result-overlay" class="result-overlay">
                <div class="result-icon-wrap"><span class="result-icon"></span></div>
                <div class="result-title"></div>
                <div class="result-sub"></div>
            </div>
        </div>`;

        document.getElementById('scanner-back').addEventListener('click', () => {
            app.render('dashboard', { event });
        });

        document.getElementById('scanner-manual-btn').addEventListener('click', () => {
            app.render('manual');
        });

        document.getElementById('manual-submit').addEventListener('click', () => {
            const code = document.getElementById('manual-code').value.trim();
            if (!code) return;
            document.getElementById('manual-code').value = '';
            checkin.doCheckIn(code, 'manual');
        });

        document.getElementById('manual-code').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const code = e.target.value.trim();
                if (!code) return;
                e.target.value = '';
                checkin.doCheckIn(code, 'manual');
            }
        });

        scanner.start((code) => checkin.doCheckIn(code, 'qr_scan'))
            .catch(err => {
                const hint = document.querySelector('.scan-hint');
                if (hint) { hint.textContent = err.message; hint.style.color = '#fca5a5'; }
            });
    },

    // ─── MANUAL ENTRY ───────────────────────────────────────────────────────
    _renderManual(root) {
        const event = this.state.selectedEvent;
        if (!event) { app.render('events'); return; }
        checkin.currentEventId = event.id;

        const recent = JSON.parse(localStorage.getItem('gate_recent_codes') || '[]');
        const chipsHTML = recent.length
            ? `<div class="recent-label">Recent codes</div>
               <div class="recent-chips">${recent.map(c => `<button class="chip" data-code="${this._esc(c)}">${this._esc(c)}</button>`).join('')}</div>`
            : '';

        root.innerHTML = `
        <div class="manual-screen">
            <div class="scanner-header">
                <button class="btn-icon-header" id="manual-back">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <span>Manual Entry</span>
                <span style="width:36px"></span>
            </div>
            <div class="manual-body">
                <div class="manual-icon-circle">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ed1c24" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h6"/></svg>
                </div>
                <h2 class="manual-heading">Enter Ticket Code</h2>
                <p class="manual-sub">Type the ticket number printed on the ticket</p>
                <input type="text" id="manual-big-input" class="manual-big-input"
                    placeholder="TKT-A1B2C3D4"
                    autocomplete="off" autocorrect="off"
                    autocapitalize="characters" spellcheck="false">
                <button class="btn-scan-big" id="manual-checkin-btn" style="width:100%;margin-top:0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    Check In
                </button>
                ${chipsHTML}
            </div>
            <div id="result-overlay" class="result-overlay">
                <div class="result-icon-wrap"><span class="result-icon"></span></div>
                <div class="result-title"></div>
                <div class="result-sub"></div>
            </div>
        </div>`;

        document.getElementById('manual-back').addEventListener('click', () => {
            app.render('scanner');
        });

        const submit = () => {
            const input = document.getElementById('manual-big-input');
            const code  = input.value.trim().toUpperCase();
            if (!code) return;
            input.value = '';
            // Save to recent codes (max 5, newest first, no duplicates)
            const prev = JSON.parse(localStorage.getItem('gate_recent_codes') || '[]');
            const next = [code, ...prev.filter(c => c !== code)].slice(0, 5);
            localStorage.setItem('gate_recent_codes', JSON.stringify(next));
            checkin.doCheckIn(code, 'manual');
        };

        document.getElementById('manual-checkin-btn').addEventListener('click', submit);
        document.getElementById('manual-big-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submit();
        });

        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const input = document.getElementById('manual-big-input');
                if (input) { input.value = chip.dataset.code; input.focus(); }
            });
        });
    },

    // ─── LOG ────────────────────────────────────────────────────────────────
    async _renderLog(root) {
        const event = this.state.selectedEvent;
        if (!event) { app.render('events'); return; }

        root.innerHTML = `
        <div class="screen">
            <div class="app-header">
                <button class="btn-icon-header" id="log-back">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <span class="header-title">Check-In Log</span>
                <span class="header-live">● LIVE</span>
            </div>
            <div id="log-content" class="log-content">
                <div class="loading"><div class="spinner"></div><p>Loading…</p></div>
            </div>
        </div>`;

        document.getElementById('log-back').addEventListener('click', () => {
            app.render('dashboard', { event });
        });

        const loadLog = async () => {
            try {
                const data = await api.get(`/events/${event.id}/check-ins/recent`);
                const rows = data.data || [];
                const el   = document.getElementById('log-content');
                if (!el) return;

                if (!rows.length) {
                    el.innerHTML = `<div class="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
                        <p>No check-ins yet</p></div>`;
                    return;
                }

                el.innerHTML = `
                <table class="log-table">
                    <thead><tr><th>Attendee</th><th>Ticket</th><th>Time</th></tr></thead>
                    <tbody>
                        ${rows.map(r => `
                        <tr>
                            <td>
                                <div class="log-name">${this._esc(r.holder_name || '—')}</div>
                                <div class="log-type">${this._esc(r.ticket_type || '')}</div>
                            </td>
                            <td class="log-ticket">${this._esc(r.ticket_number || '—')}</td>
                            <td class="log-time">${this._shortTime(r.checked_in_at)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>`;
            } catch (_) {}
        };

        await loadLog();
        this.state.logInterval = setInterval(loadLog, 10000);
    },

    // ─── UTILS ──────────────────────────────────────────────────────────────
    _esc(str) {
        return String(str)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    },
    _formatDate(d) {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' });
    },
    _shortTime(d) {
        if (!d) return '—';
        return new Date(d).toLocaleTimeString('en-KE', { hour:'2-digit', minute:'2-digit' });
    },
};

document.addEventListener('DOMContentLoaded', () => {
    auth.isLoggedIn() ? app.render('events') : app.render('login');

    new MutationObserver(() => {
        if (document.getElementById('login-form')) app._bindLogin();
    }).observe(document.getElementById('app'), { childList: true, subtree: false });

    // Offer PWA install after 3 seconds (only if not already installed / dismissed)
    pwa.showIfNeeded();
});
