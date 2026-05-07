const checkin = {
    currentEventId: null,

    async doCheckIn(ticketCode, method = 'qr_scan') {
        let data;
        try {
            data = await api.post(`/events/${this.currentEventId}/check-in`, {
                ticket_code: ticketCode,
                method,
                device_id: this._getDeviceId(),
            });
        } catch (err) {
            if (err.network) {
                this.showResult({ success: false, status: 'error', message: 'No internet connection — check-in not recorded.' });
            }
            return;
        }
        this.showResult(data);
    },

    showResult(data) {
        const overlay = document.getElementById('result-overlay');
        if (!overlay) return;

        const iconWrap  = overlay.querySelector('.result-icon');
        const pillWrap  = overlay.querySelector('.result-status-pill-wrap');
        const title     = overlay.querySelector('.result-title');
        const sub       = overlay.querySelector('.result-sub');

        const CHECK_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        const WARN_SVG  = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`;
        const X_SVG     = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

        overlay.className = 'result-overlay';

        if (data.status === 'success') {
            overlay.classList.add('result-success');
            iconWrap.innerHTML  = CHECK_SVG;
            pillWrap.innerHTML  = `<div class="result-status-pill granted">Granted</div>`;
            title.textContent   = data.holder_name || 'Checked In';
            sub.textContent     = `${data.ticket_number}${data.ticket_type ? ' · ' + data.ticket_type : ''}`;
            if (navigator.vibrate) navigator.vibrate(200);
        } else if (data.status === 'duplicate') {
            overlay.classList.add('result-warning');
            iconWrap.innerHTML  = WARN_SVG;
            pillWrap.innerHTML  = `<div class="result-status-pill repeat">Repeat</div>`;
            title.textContent   = 'Already Checked In';
            sub.textContent     = `${data.holder_name || ''}${data.checked_in_at ? ' · at ' + data.checked_in_at : ''}`;
        } else {
            overlay.classList.add('result-error');
            iconWrap.innerHTML  = X_SVG;
            pillWrap.innerHTML  = `<div class="result-status-pill denied">Denied</div>`;
            title.textContent   = 'Invalid Ticket';
            sub.textContent     = data.message || 'This ticket cannot be checked in.';
        }

        overlay.classList.add('visible');
        setTimeout(() => overlay.classList.remove('visible'), 3000);
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
