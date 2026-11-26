// Original sound effects, all synthesized with the Web Audio API — no audio
// files, no copied music. A pentatonic chime for rings, a blip for the blaster,
// filtered noise for explosions, a short fanfare for victory.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    const c = ensure();
    if (!c || muted) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, cutoff) {
    const c = ensure();
    if (!c || muted) return;
    const t0 = c.currentTime;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t0);
  }

  // Pentatonic ladder used by the ring chime: C D E G A.
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0];

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    shoot() { tone(880, 0.09, 'square', 0.05, 0, 440); },
    ring(combo) {
      const base = PENTA[Math.min(combo, PENTA.length - 1)];
      tone(base, 0.35, 'sine', 0.12);
      tone(base * 1.5, 0.4, 'sine', 0.08, 0.06);
    },
    hit() { noise(0.25, 0.2, 900); tone(160, 0.2, 'sawtooth', 0.1, 0, 60); },
    explode() { noise(0.5, 0.25, 600); tone(90, 0.45, 'sawtooth', 0.12, 0, 40); },
    warning() { tone(220, 0.18, 'triangle', 0.09); tone(220, 0.18, 'triangle', 0.09, 0.22); },
    fanfare() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.5, 'triangle', 0.11, i * 0.13));
    },
  };
}
