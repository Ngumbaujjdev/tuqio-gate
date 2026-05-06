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

        const icon  = overlay.querySelector('.result-icon');
        const title = overlay.querySelector('.result-title');
        const sub   = overlay.querySelector('.result-sub');

        overlay.className = 'result-overlay';

        if (data.status === 'success') {
            overlay.classList.add('result-success');
            icon.textContent  = '✓';
            title.textContent = data.holder_name || 'Checked In';
            sub.textContent   = `${data.ticket_number}${data.ticket_type ? ' · ' + data.ticket_type : ''}`;
            if (navigator.vibrate) navigator.vibrate(200);
        } else if (data.status === 'duplicate') {
            overlay.classList.add('result-warning');
            icon.textContent  = '⚠';
            title.textContent = 'Already Checked In';
            sub.textContent   = `${data.holder_name || ''}${data.checked_in_at ? ' · ' + data.checked_in_at : ''}`;
        } else {
            overlay.classList.add('result-error');
            icon.textContent  = '✗';
            title.textContent = 'Invalid Ticket';
            sub.textContent   = data.message || 'This ticket cannot be checked in.';
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
