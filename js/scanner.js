const scanner = {
    stream: null,
    rafId:  null,
    locked: false,

    async start(onDetect) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
            });
        } catch (e) {
            throw new Error('Camera access denied. Please allow camera permission and try again.');
        }

        const video = document.getElementById('scanner-video');
        if (!video) return;

        video.srcObject = this.stream;
        await video.play();
        this._tick(video, onDetect);
    },

    _tick(video, onDetect) {
        if (!this.stream) return;

        if (video.readyState < video.HAVE_ENOUGH_DATA) {
            this.rafId = requestAnimationFrame(() => this._tick(video, onDetect));
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
        });

        if (code && code.data && !this.locked) {
            this.locked = true;
            onDetect(code.data);
            // Unlock after 3 seconds to allow next scan
            setTimeout(() => { this.locked = false; }, 3000);
        }

        this.rafId = requestAnimationFrame(() => this._tick(video, onDetect));
    },

    stop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        this.locked = false;
    },
};
