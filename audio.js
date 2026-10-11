// Web Audio API procedural sound synthesizer (Zero external dependencies)
class SoundFX {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playGrab() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.06);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playDrop() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playUntangle() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(780, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playSpark() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        // Subtle electric static noise
        const bufferSize = this.ctx.sampleRate * 0.04;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.15;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2400, this.ctx.currentTime);
        filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    playVictory() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        // Grand electric chord: C4, E4, G4, B4, C5 arpeggio
        const notes = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99];
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = index % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + index * 0.08);

            const startTime = this.ctx.currentTime + index * 0.08;
            gain.gain.setValueAtTime(0.16, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 1.2);
        });

        // Deep power generator hum
        const hum = this.ctx.createOscillator();
        const humGain = this.ctx.createGain();
        hum.type = 'sawtooth';
        hum.frequency.setValueAtTime(65.41, this.ctx.currentTime);
        hum.frequency.exponentialRampToValueAtTime(130.81, this.ctx.currentTime + 0.8);

        const humFilter = this.ctx.createBiquadFilter();
        humFilter.type = 'lowpass';
        humFilter.frequency.setValueAtTime(240, this.ctx.currentTime);

        humGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        humGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);

        hum.connect(humFilter);
        humFilter.connect(humGain);
        humGain.connect(this.ctx.destination);

        hum.start();
        hum.stop(this.ctx.currentTime + 1.5);
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
}

window.soundFX = new SoundFX();
