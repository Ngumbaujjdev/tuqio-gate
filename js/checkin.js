const SPIN_SVG = `<svg class="btn-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`;

const checkin = {
    currentEventId: null,

    async doCheckIn(ticketCode, method = 'qr_scan', btn = null) {
        const origHTML = btn ? btn.innerHTML : null;
        if (btn) {
            btn.disabled  = true;
            btn.innerHTML = `${SPIN_SVG}<span>Checking…</span>`;
        }

        let data;
        try {
            data = await api.post(`/events/${this.currentEventId}/check-in`, {
                ticket_code: ticketCode,
                method,
                device_id: this._getDeviceId(),
            });
        } catch (err) {
            if (btn) { btn.disabled = false; btn.innerHTML = origHTML; }
            if (err.network) {
                toast.error('No internet connection — check-in not recorded.');
                this.showResult({ success: false, status: 'error', message: 'No internet connection — check-in not recorded.' });
            }
            return;
        }

        if (btn) { btn.disabled = false; btn.innerHTML = origHTML; }
        this.showResult(data);
    },

    showResult(data) {
        const overlay = document.getElementById('result-overlay');

        const CHECK_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        const WARN_SVG  = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`;
        const X_SVG     = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

        if (data.status === 'success') {
            const name   = data.holder_name || 'Guest';
            const detail = `${data.ticket_number || ''}${data.ticket_type ? ' · ' + data.ticket_type : ''}`;
            toast.success(`${name}${detail ? ' — ' + detail : ''}`);
            if (navigator.vibrate) navigator.vibrate(200);

            if (overlay) {
                overlay.className = 'result-overlay result-success';
                overlay.querySelector('.result-icon').innerHTML         = CHECK_SVG;
                overlay.querySelector('.result-status-pill-wrap').innerHTML = `<div class="result-status-pill granted">Granted</div>`;
                overlay.querySelector('.result-title').textContent      = name;
                overlay.querySelector('.result-sub').textContent        = detail;
            }
        } else if (data.status === 'duplicate') {
            const who  = data.holder_name || '';
            const when = data.checked_in_at ? ' · at ' + data.checked_in_at : '';
            toast.warning(`Already checked in${who ? ': ' + who : ''}${when}`);

            if (overlay) {
                overlay.className = 'result-overlay result-warning';
                overlay.querySelector('.result-icon').innerHTML         = WARN_SVG;
                overlay.querySelector('.result-status-pill-wrap').innerHTML = `<div class="result-status-pill repeat">Repeat</div>`;
                overlay.querySelector('.result-title').textContent      = 'Already Checked In';
                overlay.querySelector('.result-sub').textContent        = `${who}${when}`;
            }
        } else {
            const msg = data.message || 'This ticket cannot be checked in.';
            toast.error(msg);

            if (overlay) {
                overlay.className = 'result-overlay result-error';
                overlay.querySelector('.result-icon').innerHTML         = X_SVG;
                overlay.querySelector('.result-status-pill-wrap').innerHTML = `<div class="result-status-pill denied">Denied</div>`;
                overlay.querySelector('.result-title').textContent      = 'Invalid Ticket';
                overlay.querySelector('.result-sub').textContent        = msg;
            }
        }

        if (overlay) {
            overlay.classList.add('visible');
            setTimeout(() => overlay.classList.remove('visible'), 3000);
        }
    },

    _getDeviceId() {
        let id = localStorage.getItem('gate_device_id');
        if (!id) {
            id = 'gate-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('gate_device_id', id);
        }
        return id;
    },
};
