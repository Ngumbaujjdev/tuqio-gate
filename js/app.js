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
            case 'login':
                root.innerHTML = this._loginHTML();
                this._bindLogin();
                break;
            case 'events':    await this._renderEvents(root);                 break;
            case 'dashboard': await this._renderDashboard(root, data.event);  break;
            case 'scanner':   this._renderScanner(root);                      break;
            case 'manual':    this._renderManual(root);                       break;
            case 'log':       await this._renderLog(root);                    break;
        }
    },

    // ─── LOGIN ──────────────────────────────────────────────────────────────
    _loginHTML() {
        const LOCK_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
        const EMAIL_SVG = `<svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3,7 12,13 21,7"/></svg>`;
        const PASS_SVG  = `<svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
        const CHECK_SVG = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12 10 17 19 8"/></svg>`;
        const DL_SVG    = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
        const ARROW_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

        return `
        <div class="login-screen">
            <div class="login-top">
                <div><div class="ops-badge"><span class="ops-badge-pulse"></span>OPERATOR PORTAL · KE</div></div>
                <img src="${SITE_URL}/icons/logo-white.svg" alt="Tuqio Hub" class="login-logo">
                <h1 class="login-title">Gate<span class="login-title-accent">Scanner</span></h1>
                <p class="login-sub">Sign in to start checking guests in.</p>
            </div>

            <div class="login-card">
                <div class="card-eyebrow">
                    <span class="card-eyebrow-label">Sign in</span>
                    <span class="card-eyebrow-lock">${LOCK_SVG}</span>
                </div>
                <form id="login-form">
                    <div class="field">
                        <label class="field-label">Email address</label>
                        ${EMAIL_SVG}
                        <input type="email" id="login-email" class="field-input" autocomplete="email" placeholder="you@tuqiohub.africa" required>
                    </div>
                    <div class="field">
                        <label class="field-label">Password</label>
                        ${PASS_SVG}
                        <input type="password" id="login-password" class="field-input" autocomplete="current-password" placeholder="••••••••••" required>
                    </div>
                    <div class="field-row">
                        <div class="field-remember">
                            <span class="field-check">${CHECK_SVG}</span>
                            Keep me signed in
                        </div>
                        <span class="field-forgot">Reset</span>
                    </div>
                    <button type="submit" class="btn-signin" id="login-btn">
                        <span>Sign In</span>
                        ${ARROW_SVG}
                    </button>
                </form>
            </div>

            <div class="install-wrap">
                <button class="install-pill" id="pwa-install-btn">
                    <span class="install-pill-ic">${DL_SVG}</span>
                    <span>Install as app on your device</span>
                </button>
            </div>

            <div class="login-footer">
                <div class="login-footer-l">
                    <span>Tuqio Gate v${APP_VERSION}</span>
                    <span class="login-footer-sep"></span>
                    <span>${APP_ENV}</span>
                </div>
                <div>tuqiohub.africa</div>
            </div>
        </div>`;
    },

    _bindLogin() {
        const ARROW_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

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

        document.getElementById('pwa-install-btn')?.addEventListener('click', () => pwa.show());
    },

    // ─── EVENTS LIST ────────────────────────────────────────────────────────
    async _renderEvents(root) {
        const user = auth.getUser();
        const firstName = user?.name?.split(' ')[0] || 'there';

        root.innerHTML = `
        <div class="screen">
            <div class="events-header-expanded">
                <div class="events-header-top">
                    <img src="${SITE_URL}/icons/logo-white.svg" alt="Tuqio" class="header-logo">
                    <div style="display:flex;gap:8px;">
                        <button class="btn-icon-header" id="logout-btn" title="Logout">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        </button>
                    </div>
                </div>
                <div class="events-header-welcome">
                    <div class="events-welcome-sub">Welcome back</div>
                    <div class="events-welcome-name" id="events-welcome-name">
                        Hi, ${this._esc(firstName)} <span class="dot">·</span> <span class="events-welcome-count" id="events-count">Loading…</span>
                    </div>
                </div>
            </div>
            <div id="events-content" class="events-content">
                <div class="loading"><div class="spinner"></div><p>Loading events…</p></div>
            </div>
        </div>`;

        document.getElementById('logout-btn').addEventListener('click', () => {
            auth.logout();
            app.render('login');
        });

        try {
            const data   = await eventsModule.fetchEvents();
            const events = data.data || [];

            document.getElementById('events-count').textContent =
                events.length ? `${events.length} event${events.length !== 1 ? 's' : ''} live` : 'No events';

            if (!events.length) {
                document.getElementById('events-content').innerHTML =
                    `<div class="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        <p>No events with ticketing available.</p>
                    </div>`;
                return;
            }

            document.getElementById('events-content').innerHTML = `
            <div style="padding:16px;">
                <div class="events-toolbar">
                    <div class="events-search">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input placeholder="Search events, venues…" id="events-search-input">
                    </div>
                    <button class="events-filter-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
                    </button>
                </div>
                <div class="events-section-title">
                    <span class="events-section-l">UPCOMING · ${events.length}</span>
                    <span class="events-section-r">View all →</span>
                </div>
                <div class="events-grid">
                    ${events.map((ev, i) => this._eventCardHTML(ev, i)).join('')}
                </div>
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
                        toast.error('Could not load event. Check your connection.');
                    }
                });
            });

        } catch (err) {
            document.getElementById('events-content').innerHTML =
                `<div style="padding:16px;"><div class="alert-error">${err.message || 'Failed to load events.'}</div></div>`;
        }
    },

    _eventCardHTML(ev, index) {
        const now  = new Date();
        const start = new Date(ev.start_date);
        const diffDays = (start - now) / (1000 * 60 * 60 * 24);
        let pillClass = '', pillText = '';
        if (diffDays < 1 && diffDays > -1) { pillClass = 'live'; pillText = '● Today'; }
        else if (diffDays <= 7 && diffDays > 0) { pillClass = 'soon'; pillText = '● Soon'; }
        else { pillText = start.toLocaleString('en-KE', { month: 'short' }).toUpperCase(); }

        const PIN_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
        const CHEV = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

        return `
        <div class="event-card" data-id="${ev.id}">
            <div class="event-card-img ev-bg-${index % 4}">
                <span class="event-card-pill ${pillClass}">${pillText}</span>
                <div class="event-card-info">
                    <div class="event-card-name">${this._esc(ev.name)}</div>
                    <div class="event-card-date">${this._formatDate(ev.start_date)}</div>
                </div>
            </div>
            <div class="event-card-footer">
                <span class="event-card-venue">${PIN_SVG}${this._esc(ev.venue_name || 'Venue TBC')}</span>
                <span class="event-card-arrow">${CHEV}</span>
            </div>
        </div>`;
    },

    // ─── DASHBOARD ──────────────────────────────────────────────────────────
    async _renderDashboard(root, event) {
        if (!event) { app.render('events'); return; }

        const BACK_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
        const DOTS_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`;
        const QR_SVG   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="14" x2="14" y2="17"/><line x1="17" y1="14" x2="21" y2="14"/><line x1="14" y1="20" x2="17" y2="20"/><line x1="20" y1="17" x2="20" y2="21"/></svg>`;
        const LOG_SVG  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6a2 2 0 0 1 2 2v0H7v0a2 2 0 0 1 2-2z"/><rect x="5" y="4" width="14" height="18" rx="2"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="13" y2="15"/></svg>`;
        const ARROW_SVG= `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
        const CHEV_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
        const PIN_SVG  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
        const CAL_SVG  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

        root.innerHTML = `
        <div class="screen">
            <div class="app-header">
                <button class="btn-icon-header" id="back-btn">${BACK_SVG}</button>
                <div style="display:flex;flex-direction:column;align-items:center;flex:1;overflow:hidden;">
                    <div class="header-sub">Active Event</div>
                    <div class="header-title" style="font-size:13px;margin-top:1px;">${this._esc(event.name)}</div>
                </div>
                <button class="btn-icon-header">${DOTS_SVG}</button>
            </div>

            <div class="event-banner">
                <div class="event-banner-overlay"></div>
                <div class="live-tag"><span class="live-tag-dot"></span>Live · Doors Open</div>
                <div class="event-banner-content">
                    <div class="event-banner-eyebrow">Tonight · Black Tie</div>
                    <div class="event-banner-name">${this._esc(event.name)}</div>
                    <div class="event-banner-meta">
                        <span class="event-banner-meta-item">${PIN_SVG}${this._esc(event.venue_name || '')}</span>
                        <span class="event-banner-meta-item">${CAL_SVG}${this._formatDate(event.start_date)}</span>
                    </div>
                </div>
            </div>

            <div class="dashboard-body">
                <div class="stats-card" id="stats-card">
                    ${this._statsHTML(event.stats)}
                </div>

                <div class="progress-card" id="progress-card">
                    ${this._progressHTML(event.stats)}
                </div>

                <button class="btn-scan-big" id="scan-btn">
                    <span class="btn-ic-wrap">${QR_SVG}</span>
                    Start Scanning
                    <span class="btn-scan-arrow">${ARROW_SVG}</span>
                </button>

                <button class="btn-recent" id="log-btn">
                    <span class="btn-recent-l">
                        <span class="btn-recent-ic">${LOG_SVG}</span>
                        Recent Check-Ins
                    </span>
                    <span class="btn-recent-r">
                        <span id="recent-count">${event.stats?.checked_in_count ?? 0} scanned</span>
                        ${CHEV_SVG}
                    </span>
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
                const sc = document.getElementById('stats-card');
                const pc = document.getElementById('progress-card');
                const rc = document.getElementById('recent-count');
                if (sc) sc.innerHTML = this._statsHTML(fresh.stats);
                if (pc) pc.innerHTML = this._progressHTML(fresh.stats);
                if (rc) rc.textContent = `${fresh.stats?.checked_in_count ?? 0} scanned`;
            } catch (_) {}
        }, 15000);
    },

    _statsHTML(stats = {}) {
        const items = [
            { value: stats.total_tickets    ?? '—', label: 'Tickets issued', delta: 'TOTAL',  deltaClass: 'info'  },
            { value: stats.checked_in_count ?? '—', label: 'Checked In',     delta: '+' + (stats.checked_in_count ?? 0), deltaClass: 'up'   },
            { value: stats.pending_count    ?? '—', label: 'Pending',        delta: stats.pending_count ?? '—',          deltaClass: 'warn' },
            { value: (stats.check_in_rate ?? 0) + '%', label: 'Conversion',  delta: 'RATE',   deltaClass: 'info'  },
        ];
        const colors = ['', 'green', 'amber', 'blue'];
        return `<div class="stats-grid">${items.map((i, idx) => `
        <div class="stat-cell">
            <span class="stat-delta ${i.deltaClass}">${i.delta}</span>
            <div class="stat-value ${colors[idx]}">${i.value}</div>
            <div class="stat-label">${i.label}</div>
        </div>`).join('')}</div>`;
    },

    _progressHTML(stats = {}) {
        const checked = stats?.checked_in_count ?? 0;
        const total   = stats?.total_tickets    ?? 0;
        const pending = stats?.pending_count    ?? 0;
        const rate    = stats?.check_in_rate    ?? 0;
        return `
        <div class="progress-row">
            <div class="progress-row-l">
                <div class="lbl">Check-in progress</div>
                <div class="val">${checked} / ${total}<small>guests</small></div>
            </div>
            <div class="progress-row-r">
                <div class="lbl">Completion</div>
                <div class="val">${rate}<small>%</small></div>
            </div>
        </div>
        <div class="progress-track">
            <div class="progress-fill" style="width:${rate}%"></div>
        </div>
        <div class="progress-legend">
            <span><span class="progress-swatch" style="background:var(--green);"></span>Checked in · ${checked}</span>
            <span><span class="progress-swatch" style="background:var(--amber);"></span>Pending · ${pending}</span>
        </div>`;
    },

    // ─── SCANNER ────────────────────────────────────────────────────────────
    _renderScanner(root) {
        const event = this.state.selectedEvent;
        if (!event) { app.render('events'); return; }
        checkin.currentEventId = event.id;

        const stats = event.stats || {};
        const BACK_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
        const KBD_SVG  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="10" x2="6" y2="10"/><line x1="10" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="14" y2="10"/><line x1="18" y1="10" x2="18" y2="10"/><line x1="7" y1="14" x2="17" y2="14"/></svg>`;
        const ENV_SVG  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 7 8 6 8-6"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`;
        const CHKIN_SVG= `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        const CLOCK_SVG= `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
        const ARROW_SVG= `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

        root.innerHTML = `
        <div class="scanner-screen">
            <div class="scanner-header">
                <button class="btn-icon-header" id="scanner-back">${BACK_SVG}</button>
                <div class="scanner-header-center">
                    <div class="header-sub">Scanning</div>
                    <div class="header-title" style="font-size:13px;margin-top:1px;">${this._esc(event.name)}</div>
                </div>
                <div class="scanner-header-right">
                    <button class="btn-icon-header" id="scanner-manual-btn" title="Manual entry">${KBD_SVG}</button>
                </div>
            </div>

            <div class="scanner-viewport">
                <video id="scanner-video" playsinline muted autoplay></video>

                <div class="scan-overlay scan-overlay-top"></div>
                <div class="scan-overlay scan-overlay-bottom"></div>
                <div class="scan-overlay scan-overlay-left"></div>
                <div class="scan-overlay scan-overlay-right"></div>

                <div class="scan-tag"><span class="scan-tag-pulse"></span>Scanning · Camera Active</div>

                <div class="scan-zone">
                    <div class="scan-corner tl"></div>
                    <div class="scan-corner tr"></div>
                    <div class="scan-corner bl"></div>
                    <div class="scan-corner br"></div>
                    <div class="scan-line"></div>
                </div>

                <div class="scan-hint">
                    Align QR code within the frame
                    <span class="scan-hint-sub">Hold steady — focus locks automatically</span>
                </div>

                <div class="scan-stats">
                    <div class="scan-stat-pill">
                        <span class="scan-stat-ic">${CHKIN_SVG}</span>
                        <div><div class="scan-stat-v">${stats.checked_in_count ?? 0}</div><div class="scan-stat-l">Checked in</div></div>
                    </div>
                    <div class="scan-stat-pill">
                        <span class="scan-stat-ic">${CLOCK_SVG}</span>
                        <div><div class="scan-stat-v">${stats.pending_count ?? 0}</div><div class="scan-stat-l">Pending</div></div>
                    </div>
                </div>
            </div>

            <div class="scanner-foot">
                <div class="scanner-foot-wrap">
                    ${ENV_SVG}
                    <input type="text" id="manual-code" placeholder="Enter ticket code manually…" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false">
                    <span class="scanner-foot-prefix">TKT-</span>
                </div>
                <button class="scanner-foot-send" id="manual-submit">${ARROW_SVG}</button>
            </div>

            <div id="result-overlay" class="result-overlay">
                <div class="result-drag"></div>
                <div class="result-icon-wrap"><span class="result-icon"></span></div>
                <div class="result-status-pill-wrap"></div>
                <div class="result-title"></div>
                <div class="result-sub"></div>
            </div>
        </div>`;

        document.getElementById('scanner-back').addEventListener('click', () => app.render('dashboard', { event }));
        document.getElementById('scanner-manual-btn').addEventListener('click', () => app.render('manual'));

        document.getElementById('manual-submit').addEventListener('click', () => {
            const input = document.getElementById('manual-code');
            const code  = input.value.trim();
            if (!code) return;
            input.value = '';
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
                const tag = document.querySelector('.scan-tag');
                if (tag) { tag.innerHTML = `<span style="color:#fca5a5;">${err.message}</span>`; }
            });
    },

    // ─── MANUAL ENTRY ───────────────────────────────────────────────────────
    _renderManual(root) {
        const event = this.state.selectedEvent;
        if (!event) { app.render('events'); return; }
        checkin.currentEventId = event.id;

        const recent = JSON.parse(localStorage.getItem('gate_recent_codes') || '[]');
        const chipsHTML = recent.length
            ? `<div class="manual-recent-header">
                   <span class="recent-label">Recent codes</span>
                   <span class="recent-tap">tap to refill</span>
               </div>
               <div class="recent-chips">${recent.map(c => `<button class="chip" data-code="${this._esc(c)}">${this._esc(c)}</button>`).join('')}</div>`
            : '';

        const BACK_SVG  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
        const KBD_SVG   = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ed1c24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10"/><line x1="10" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="14" y2="10"/><line x1="18" y1="10" x2="18" y2="10"/><line x1="7" y1="14" x2="17" y2="14"/></svg>`;
        const ARROW_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

        root.innerHTML = `
        <div class="manual-screen">
            <div class="scanner-header">
                <button class="btn-icon-header" id="manual-back">${BACK_SVG}</button>
                <div class="header-title">Manual Entry</div>
                <span style="width:36px;display:block;"></span>
            </div>
            <div class="manual-body">
                <div class="manual-icon-circle">${KBD_SVG}</div>
                <h2 class="manual-heading">Enter Ticket Code</h2>
                <p class="manual-sub">Type the ticket number printed on the ticket</p>
                <input type="text" id="manual-big-input" class="manual-big-input"
                    placeholder="TKT-A1B2C3D4"
                    autocomplete="off" autocorrect="off"
                    autocapitalize="characters" spellcheck="false">
                <button class="btn-manual-checkin" id="manual-checkin-btn">
                    Check In ${ARROW_SVG}
                </button>
                ${chipsHTML}
            </div>
            <div id="result-overlay" class="result-overlay">
                <div class="result-drag"></div>
                <div class="result-icon-wrap"><span class="result-icon"></span></div>
                <div class="result-status-pill-wrap"></div>
                <div class="result-title"></div>
                <div class="result-sub"></div>
            </div>
        </div>`;

        document.getElementById('manual-back').addEventListener('click', () => app.render('scanner'));

        const submit = () => {
            const input = document.getElementById('manual-big-input');
            const code  = input.value.trim().toUpperCase();
            if (!code) return;
            input.value = '';
            const prev = JSON.parse(localStorage.getItem('gate_recent_codes') || '[]');
            const next = [code, ...prev.filter(c => c !== code)].slice(0, 5);
            localStorage.setItem('gate_recent_codes', JSON.stringify(next));
            checkin.doCheckIn(code, 'manual');
        };

        document.getElementById('manual-checkin-btn').addEventListener('click', submit);
        document.getElementById('manual-big-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
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

        const DL_SVG   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
        const BACK_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;

        root.innerHTML = `
        <div class="screen">
            <div class="app-header">
                <button class="btn-icon-header" id="log-back">${BACK_SVG}</button>
                <div style="display:flex;flex-direction:column;align-items:center;flex:1;overflow:hidden;">
                    <div class="header-sub">Audit Trail</div>
                    <div class="header-title" style="font-size:13px;margin-top:1px;">Check-In Log</div>
                </div>
                <button class="btn-icon-header" style="background:rgba(74,222,128,0.18);border-color:rgba(74,222,128,0.3);color:#86efac;">${DL_SVG}</button>
            </div>
            <div id="log-content" class="log-content">
                <div class="loading"><div class="spinner"></div><p>Loading…</p></div>
            </div>
        </div>`;

        document.getElementById('log-back').addEventListener('click', () => app.render('dashboard', { event }));

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

                const stats = this.state.selectedEvent?.stats || {};
                const avatarColors = ['', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'];

                el.innerHTML = `
                <div class="log-summary">
                    <div>
                        <div class="log-summary-lbl">Total checked in</div>
                        <div class="log-summary-val">${stats.checked_in_count ?? rows.length}<small>/ ${stats.total_tickets ?? '—'}</small></div>
                    </div>
                    <div class="log-live-pill"><span class="log-live-dot"></span>LIVE</div>
                </div>
                <div class="log-filters">
                    <span class="log-chip active">All · ${stats.checked_in_count ?? rows.length}</span>
                    <span class="log-chip">VIP</span>
                    <span class="log-chip">Group</span>
                    <span class="log-chip">Reg</span>
                </div>
                <table class="log-table">
                    <thead><tr><th>Attendee</th><th>Ticket</th><th style="text-align:right;">Time</th></tr></thead>
                    <tbody>
                        ${rows.map((r, i) => {
                            const initials = (r.holder_name || '??').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                            const typeClass = (r.ticket_type || '').toLowerCase().includes('vip') ? 'vip' : (r.ticket_type || '').toLowerCase().includes('group') ? 'group' : '';
                            const PIN_SVG2 = `<span class="log-type-tag-dot"></span>`;
                            return `<tr>
                                <td>
                                    <div class="log-name-row">
                                        <div class="log-avatar ${avatarColors[i % 7]}">${this._esc(initials)}</div>
                                        <div>
                                            <div class="log-name">${this._esc(r.holder_name || '—')}</div>
                                            <span class="log-type-tag ${typeClass}">${PIN_SVG2}${this._esc(r.ticket_type || 'Regular')}</span>
                                        </div>
                                    </div>
                                </td>
                                <td><span class="log-ticket">${this._esc(r.ticket_number || '—')}</span></td>
                                <td><div class="log-time">${this._shortTime(r.checked_in_at)}<span class="log-ago">${this._ago(r.checked_in_at)}</span></div></td>
                            </tr>`;
                        }).join('')}
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
    _ago(d) {
        if (!d) return '';
        const mins = Math.round((Date.now() - new Date(d)) / 60000);
        if (mins < 1)  return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.round(mins / 60);
        return `${hrs}h ago`;
    },
};

document.addEventListener('DOMContentLoaded', () => {
    auth.isLoggedIn() ? app.render('events') : app.render('login');
    pwa.showIfNeeded();
});
