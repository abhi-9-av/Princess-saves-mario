// ============================================================================
// PRINCESS SAVES MARIO — Audio System (Web Audio API Chiptune Synthesis)
// ============================================================================

var Audio = (() => {
    let ctx = null;
    let masterGain = null;
    let muted = false;
    const initialized = false;

    function ensureContext() {
        if (!ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                try {
                    ctx = new AudioCtx();
                    masterGain = ctx.createGain();
                    masterGain.gain.value = 0.3;
                    masterGain.connect(ctx.destination);
                } catch (e) {
                    ctx = null;
                }
            }
        }
        if (ctx && ctx.state === 'suspended') {
            try { ctx.resume(); } catch (e) {}
        }
        return ctx;
    }

    function playTone(freq, duration, type = 'square', volume = 0.3, delay = 0) {
        try {
            const c = ensureContext();
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(volume, c.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(c.currentTime + delay);
            osc.stop(c.currentTime + delay + duration);
        } catch (e) { /* Audio not available */ }
    }

    function playNoise(duration, volume = 0.1) {
        try {
            const c = ensureContext();
            const bufferSize = c.sampleRate * duration;
            const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = c.createBufferSource();
            noise.buffer = buffer;
            const gain = c.createGain();
            gain.gain.setValueAtTime(volume, c.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
            noise.connect(gain);
            gain.connect(masterGain);
            noise.start();
        } catch (e) { /* Audio not available */ }
    }

    return {
        toggle() {
            muted = !muted;
            if (masterGain) {
                masterGain.gain.value = muted ? 0 : 0.3;
            }
            return !muted;
        },

        isMuted() { return muted; },

        // Initialize audio context (must be called from user interaction)
        init() { ensureContext(); },

        // Sound Effects
        jump() {
            if (muted) return;
            playTone(400, 0.1, 'square', 0.2);
            playTone(600, 0.15, 'square', 0.2, 0.05);
        },

        coin() {
            if (muted) return;
            playTone(988, 0.08, 'square', 0.2);
            playTone(1319, 0.3, 'square', 0.2, 0.08);
        },

        punch() {
            if (muted) return;
            playNoise(0.08, 0.15);
            playTone(200, 0.1, 'sawtooth', 0.15);
        },

        blast() {
            if (muted) return;
            playTone(800, 0.1, 'sine', 0.2);
            playTone(1200, 0.1, 'sine', 0.15, 0.05);
            playTone(600, 0.2, 'sine', 0.1, 0.1);
        },

        enemyHit() {
            if (muted) return;
            playTone(500, 0.05, 'square', 0.2);
            playTone(300, 0.1, 'square', 0.15, 0.05);
            playTone(100, 0.15, 'sawtooth', 0.1, 0.1);
        },

        stomp() {
            if (muted) return;
            playTone(400, 0.06, 'square', 0.2);
            playTone(600, 0.15, 'square', 0.15, 0.06);
        },

        hurt() {
            if (muted) return;
            playTone(400, 0.1, 'square', 0.25);
            playTone(200, 0.2, 'sawtooth', 0.2, 0.1);
        },

        die() {
            if (muted) return;
            const notes = [493, 440, 392, 349, 330, 294, 261, 220];
            notes.forEach((f, i) => playTone(f, 0.15, 'square', 0.2, i * 0.1));
        },

        gameOver() {
            if (muted) return;
            const notes = [330, 294, 261, 247, 220, 196, 175, 165];
            notes.forEach((f, i) => playTone(f, 0.25, 'square', 0.2, i * 0.15));
        },

        victory() {
            if (muted) return;
            const notes = [523, 659, 784, 1047, 784, 1047, 1319];
            notes.forEach((f, i) => playTone(f, 0.15, 'square', 0.25, i * 0.1));
            playTone(1319, 0.5, 'square', 0.2, 0.7);
        },

        levelClear() {
            if (muted) return;
            const notes = [523, 587, 659, 784, 880, 988, 1047, 1319];
            notes.forEach((f, i) => {
                playTone(f, 0.12, 'square', 0.2, i * 0.08);
                playTone(f * 1.5, 0.12, 'square', 0.1, i * 0.08);
            });
        },

        powerUp() {
            if (muted) return;
            const notes = [523, 659, 784, 1047];
            notes.forEach((f, i) => playTone(f, 0.15, 'sine', 0.2, i * 0.1));
        },

        doorOpen() {
            if (muted) return;
            playTone(440, 0.1, 'square', 0.15);
            playTone(554, 0.1, 'square', 0.15, 0.1);
            playTone(659, 0.15, 'square', 0.15, 0.2);
        },

        puzzleCorrect() {
            if (muted) return;
            playTone(523, 0.1, 'sine', 0.2);
            playTone(659, 0.15, 'sine', 0.2, 0.1);
        },

        puzzleWrong() {
            if (muted) return;
            playTone(200, 0.2, 'sawtooth', 0.2);
            playNoise(0.1, 0.08);
        },

        puzzleComplete() {
            if (muted) return;
            const notes = [523, 659, 784, 1047, 1319, 1568];
            notes.forEach((f, i) => {
                playTone(f, 0.2, 'sine', 0.2, i * 0.12);
                playTone(f * 0.5, 0.2, 'triangle', 0.1, i * 0.12);
            });
        },

        tick() {
            if (muted) return;
            playTone(800, 0.03, 'square', 0.1);
        },

        timeWarning() {
            if (muted) return;
            playTone(880, 0.05, 'square', 0.2);
            playTone(880, 0.05, 'square', 0.2, 0.15);
        },

        menuSelect() {
            if (muted) return;
            playTone(700, 0.06, 'square', 0.15);
        },

        menuConfirm() {
            if (muted) return;
            playTone(523, 0.08, 'square', 0.2);
            playTone(784, 0.12, 'square', 0.2, 0.08);
        },

        interact() {
            if (muted) return;
            playTone(523, 0.1, 'sine', 0.2);
            playTone(784, 0.1, 'sine', 0.15, 0.1);
            playTone(1047, 0.2, 'sine', 0.2, 0.2);
        },

        checkpoint() {
            if (muted) return;
            playTone(659, 0.1, 'square', 0.2);
            playTone(784, 0.1, 'square', 0.2, 0.08);
            playTone(988, 0.2, 'square', 0.2, 0.16);
        },
    };
})();

if (typeof window !== 'undefined') {
    window.Audio = Audio;
}
