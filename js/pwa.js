const pwa = (() => {
    const isIos        = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true
                      || window.matchMedia('(display-mode: standalone)').matches;

    let _prompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        _prompt = e;
    });

    function _showModal() {
        const existing = document.getElementById('pwa-modal-backdrop');
        if (existing) existing.remove();

        const logoSrc = (typeof SITE_URL !== 'undefined')
            ? SITE_URL + '/icons/logo-white.svg'
            : '/icons/logo-white.svg';

        let content;

        if (isIos) {
            content = `
            <div class="pwa-modal-icon">
                <img src="${logoSrc}" alt="Tuqio Gate">
            </div>
            <h2>Install Tuqio Gate</h2>
            <p>Add this app to your home screen for the best gate-scanning experience — works offline too.</p>
            <div class="pwa-steps">
                <div class="pwa-step">
                    <div class="pwa-step-num">1</div>
                    <div class="pwa-step-text">Tap the <strong>Share</strong> button at the bottom of Safari <span style="font-size:18px">⎋</span></div>
                </div>
                <div class="pwa-step">
                    <div class="pwa-step-num">2</div>
                    <div class="pwa-step-text">Scroll down and tap <strong>"Add to Home Screen"</strong></div>
                </div>
                <div class="pwa-step">
                    <div class="pwa-step-num">3</div>
                    <div class="pwa-step-text">Tap <strong>Add</strong> — the Tuqio Gate icon will appear on your home screen</div>
                </div>
            </div>
            <button class="btn-pwa-dismiss" id="pwa-dismiss">Maybe later</button>`;
        } else {
            content = `
            <div class="pwa-modal-icon">
                <img src="${logoSrc}" alt="Tuqio Gate">
            </div>
            <h2>Install Tuqio Gate</h2>
            <p>Get the full app experience — faster scanning, offline support, and no browser UI in the way.</p>
            <div class="pwa-steps">
                <div class="pwa-step">
                    <div class="pwa-step-num">✓</div>
                    <div class="pwa-step-text"><strong>Works offline</strong> — scan tickets even with poor signal</div>
                </div>
                <div class="pwa-step">
                    <div class="pwa-step-num">✓</div>
                    <div class="pwa-step-text"><strong>Full screen</strong> — no browser bar, more camera space</div>
                </div>
                <div class="pwa-step">
                    <div class="pwa-step-num">✓</div>
                    <div class="pwa-step-text"><strong>Fast launch</strong> — opens instantly from your home screen</div>
                </div>
            </div>
            <button class="btn-pwa-install" id="pwa-native-install">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v13M8 11l4 4 4-4"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
                Install Now
            </button>
            <button class="btn-pwa-dismiss" id="pwa-dismiss">Maybe later</button>`;
        }

        const backdrop = document.createElement('div');
        backdrop.id        = 'pwa-modal-backdrop';
        backdrop.className = 'pwa-modal-backdrop';
        backdrop.innerHTML = `
            <div class="pwa-modal" id="pwa-modal">
                <div class="pwa-modal-handle"></div>
                ${content}
            </div>`;

        document.body.appendChild(backdrop);

        // Close on backdrop click
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) _close();
        });

        document.getElementById('pwa-dismiss')?.addEventListener('click', _close);

        document.getElementById('pwa-native-install')?.addEventListener('click', async () => {
            if (!_prompt) return;
            _close();
            _prompt.prompt();
            const { outcome } = await _prompt.userChoice;
            if (outcome === 'accepted') {
                toast.success('Tuqio Gate installed! Open it from your home screen.');
                _prompt = null;
            }
        });
    }

    function _close() {
        const el = document.getElementById('pwa-modal-backdrop');
        if (el) {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.2s';
            setTimeout(() => el.remove(), 200);
        }
        sessionStorage.setItem('pwa_dismissed', '1');
    }

    function showIfNeeded() {
        if (isStandalone) return;                           // already installed
        if (sessionStorage.getItem('pwa_dismissed')) return; // dismissed this session
        // Show after a short delay on first visit
        setTimeout(_showModal, 3000);
    }

    return { show: _showModal, showIfNeeded };
})();
