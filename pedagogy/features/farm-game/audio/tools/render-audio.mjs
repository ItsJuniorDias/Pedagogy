// features/farm-game/audio/tools/render-audio.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Renderizador OFFLINE: "assa" (bake) a mesma síntese procedural que o motor
// Web Audio fazia ao vivo para arquivos .wav, que o `expo-audio` toca.
//
//   node tools/render-audio.mjs
//
// Gera em ../assets/audio/:
//   farm-theme.wav  (trilha pastoral, loop perfeito de 10s)
//   till/plant/water/harvest/coin/build/next-day/level-up/tap/blocked/error.wav
//
// Mesmos osciladores, envelopes e ruído filtrado do engine original — então o
// som é idêntico ao da versão web, só que pré-renderizado.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "assets",
  "audio",
);

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ── Osciladores ──────────────────────────────────────────────────────────────
function wave(type, ph) {
  switch (type) {
    case "square":
      return Math.sin(ph) >= 0 ? 1 : -1;
    case "sawtooth": {
      const p = ph / (2 * Math.PI);
      return 2 * (p - Math.floor(p)) - 1;
    }
    case "triangle":
      return (2 / Math.PI) * Math.asin(Math.sin(ph));
    case "sine":
    default:
      return Math.sin(ph);
  }
}

// Envelope exponencial igual ao da Web Audio: 0.0001 → peak (attack) → 0.0001.
function envExp(t, attack, peak, total) {
  if (t >= total) return 0;
  const floor = 0.0001;
  if (t < attack) return floor * Math.pow(peak / floor, t / attack);
  return peak * Math.pow(floor / peak, (t - attack) / (total - attack));
}

// ── Primitiva: nota tonal ────────────────────────────────────────────────────
function tone(buf, startSec, o, busGain, wrap) {
  const dur = o.dur ?? 0.2;
  const attack = Math.max(0.001, o.attack ?? 0.005);
  const release = Math.max(0.02, o.release ?? Math.min(0.25, dur));
  const peak = Math.max(0.0002, o.gain ?? 0.3) * busGain;
  const total = dur + release;
  const n = Math.ceil(total * SR);
  const start = Math.round(startSec * SR);
  const type = o.type ?? "sine";
  const detuneMult = o.detune ? Math.pow(2, o.detune / 1200) : 1;

  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let f = o.glideTo
      ? o.freq * Math.pow(o.glideTo / o.freq, Math.min(t, dur) / dur)
      : o.freq;
    f *= detuneMult;
    ph += (2 * Math.PI * f) / SR;
    const s = wave(type, ph) * envExp(t, attack, peak, total);
    const idx = wrap ? (start + i) % wrap : start + i;
    if (idx >= 0 && (wrap || idx < buf.length)) buf[idx] += s;
  }
}

// ── Biquad RBJ (recalculado por amostra p/ acompanhar a varredura) ───────────
function biquadCoeffs(type, f0, Q) {
  const w0 = (2 * Math.PI * f0) / SR;
  const cw = Math.cos(w0);
  const sw = Math.sin(w0);
  const alpha = sw / (2 * Q);
  let b0, b1, b2, a0, a1, a2;
  if (type === "lowpass") {
    b0 = (1 - cw) / 2;
    b1 = 1 - cw;
    b2 = (1 - cw) / 2;
  } else if (type === "highpass") {
    b0 = (1 + cw) / 2;
    b1 = -(1 + cw);
    b2 = (1 + cw) / 2;
  } else {
    // bandpass (0 dB de pico)
    b0 = alpha;
    b1 = 0;
    b2 = -alpha;
  }
  a0 = 1 + alpha;
  a1 = -2 * cw;
  a2 = 1 - alpha;
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}

// ── Primitiva: ruído filtrado ────────────────────────────────────────────────
function noise(buf, startSec, o, busGain, wrap) {
  const dur = o.dur ?? 0.12;
  const peak = Math.max(0.0002, o.gain ?? 0.3) * busGain;
  const attack = Math.max(0.001, o.attack ?? 0.002);
  const release = o.release ?? 0.02;
  const total = dur + release;
  const n = Math.ceil(total * SR);
  const start = Math.round(startSec * SR);
  const Q = o.q ?? 0.8;
  const type = o.type ?? "bandpass";
  const f0base = o.freq ?? 1200;

  let z1 = 0;
  let z2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let f0 = o.freqTo
      ? f0base * Math.pow(o.freqTo / f0base, Math.min(t, dur) / dur)
      : f0base;
    f0 = Math.max(20, Math.min(SR / 2 - 200, f0));
    const [b0, b1, b2, a1, a2] = biquadCoeffs(type, f0, Q);
    const x = Math.random() * 2 - 1;
    const y = b0 * x + z1;
    z1 = b1 * x - a1 * y + z2;
    z2 = b2 * x - a2 * y;
    const s = y * envExp(t, attack, peak, total);
    const idx = wrap ? (start + i) % wrap : start + i;
    if (idx >= 0 && (wrap || idx < buf.length)) buf[idx] += s;
  }
}

// ── Efeitos (mesma definição do sfx.ts) ──────────────────────────────────────
const SFX_BUS = 0.9;
const sfxDefs = {
  tap: (b) => tone(b, 0, { freq: midi(84), type: "triangle", dur: 0.05, gain: 0.14 }, SFX_BUS),
  blocked: (b) =>
    tone(b, 0, { freq: midi(58), glideTo: midi(52), type: "square", dur: 0.12, gain: 0.12 }, SFX_BUS),
  error: (b) => {
    tone(b, 0, { freq: midi(50), type: "sawtooth", dur: 0.18, gain: 0.14 }, SFX_BUS);
    tone(b, 0.02, { freq: midi(49), type: "sawtooth", dur: 0.18, gain: 0.1 }, SFX_BUS);
  },
  till: (b) => {
    tone(b, 0, { freq: midi(46), glideTo: midi(38), type: "sine", dur: 0.14, gain: 0.22 }, SFX_BUS);
    noise(b, 0, { freq: 600, freqTo: 180, dur: 0.13, gain: 0.16, q: 0.6 }, SFX_BUS);
  },
  plant: (b) =>
    tone(b, 0, { freq: midi(64), glideTo: midi(76), type: "triangle", dur: 0.1, gain: 0.18 }, SFX_BUS),
  water: (b) => {
    noise(b, 0, { type: "lowpass", freq: 2600, freqTo: 600, dur: 0.16, gain: 0.14, q: 1.2 }, SFX_BUS);
    tone(b, 0.02, { freq: midi(79), glideTo: midi(70), type: "sine", dur: 0.12, gain: 0.12 }, SFX_BUS);
  },
  harvest: (b) => {
    tone(b, 0, { freq: midi(72), type: "triangle", dur: 0.16, gain: 0.2 }, SFX_BUS);
    tone(b, 0.06, { freq: midi(76), type: "triangle", dur: 0.18, gain: 0.18 }, SFX_BUS);
    tone(b, 0.12, { freq: midi(79), type: "sine", dur: 0.22, gain: 0.16 }, SFX_BUS);
  },
  coin: (b) => {
    tone(b, 0, { freq: midi(83), type: "square", dur: 0.07, gain: 0.16 }, SFX_BUS);
    tone(b, 0.07, { freq: midi(88), type: "square", dur: 0.12, gain: 0.16 }, SFX_BUS);
  },
  build: (b) =>
    [60, 64, 67, 72].forEach((nn, i) =>
      tone(b, i * 0.05, { freq: midi(nn), type: "triangle", dur: 0.2, gain: 0.16 }, SFX_BUS),
    ),
  "next-day": (b) => {
    tone(b, 0, { freq: midi(55), glideTo: midi(67), type: "sine", dur: 0.5, gain: 0.16, attack: 0.08 }, SFX_BUS);
    tone(b, 0.1, { freq: midi(67), glideTo: midi(74), type: "triangle", dur: 0.5, gain: 0.1, attack: 0.12 }, SFX_BUS);
  },
  "level-up": (b) =>
    [60, 64, 67, 72, 76].forEach((nn, i) =>
      tone(b, i * 0.08, { freq: midi(nn), type: "square", dur: 0.16, gain: 0.16 }, SFX_BUS),
    ),
};

// ── Trilha "farm" (mesma lógica do music.ts → farmStep), loop de 10s ─────────
const MUSIC_BUS = 0.5;
const FARM_BPM = 96;
const STEPS = 64;
const SEC_PER_STEP = 60 / FARM_BPM / 4; // 0.15625
const LOOP_SEC = STEPS * SEC_PER_STEP; // 10.0
const LOOP_SAMPLES = Math.round(LOOP_SEC * SR);

const FARM_CHORDS = [
  [48, 52, 55],
  [43, 47, 50],
  [45, 48, 52],
  [41, 45, 48],
];

function renderFarmTheme() {
  const buf = new Float32Array(LOOP_SAMPLES);
  for (let step = 0; step < STEPS; step++) {
    const when = step * SEC_PER_STEP;
    const bar = Math.floor(step / 16);
    const inBar = step % 16;
    const chord = FARM_CHORDS[bar];

    if (inBar === 0) {
      chord.forEach((nn) =>
        tone(buf, when, { freq: midi(nn), type: "triangle", dur: 1.7, gain: 0.05, attack: 0.4, release: 0.6 }, MUSIC_BUS, LOOP_SAMPLES),
      );
    }
    if (inBar === 0 || inBar === 8) {
      tone(buf, when, { freq: midi(chord[0] - 12), type: "sine", dur: 0.5, gain: 0.12, attack: 0.01 }, MUSIC_BUS, LOOP_SAMPLES);
    }
    if (inBar % 2 === 0) {
      const seq = [0, 1, 2, 1];
      const note = chord[seq[(inBar / 2) % 4]] + 12;
      tone(buf, when, { freq: midi(note), type: "sine", dur: 0.22, gain: 0.055, attack: 0.005 }, MUSIC_BUS, LOOP_SAMPLES);
    }
    if (inBar === 0 || inBar === 8) {
      noise(buf, when, { type: "lowpass", freq: 220, freqTo: 70, dur: 0.14, gain: 0.1 }, MUSIC_BUS, LOOP_SAMPLES);
    }
    if (inBar % 4 === 2) {
      noise(buf, when, { type: "highpass", freq: 5000, dur: 0.04, gain: 0.025 }, MUSIC_BUS, LOOP_SAMPLES);
    }
  }
  return buf;
}

// ── Utilidades ───────────────────────────────────────────────────────────────
function peakOf(buf) {
  let p = 0;
  for (let i = 0; i < buf.length; i++) p = Math.max(p, Math.abs(buf[i]));
  return p;
}
function scale(buf, k) {
  for (let i = 0; i < buf.length; i++) buf[i] *= k;
}
function trimTail(buf, thresh = 1e-4) {
  let end = buf.length;
  while (end > 1 && Math.abs(buf[end - 1]) < thresh) end--;
  return buf.subarray(0, Math.min(buf.length, end + Math.round(0.01 * SR)));
}
function writeWav(file, buf) {
  const n = buf.length;
  const out = Buffer.alloc(44 + n * 2);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + n * 2, 4);
  out.write("WAVE", 8);
  out.write("fmt ", 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20); // PCM
  out.writeUInt16LE(1, 22); // mono
  out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  out.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    let s = Math.max(-1, Math.min(1, buf[i]));
    out.writeInt16LE((s < 0 ? s * 0x8000 : s * 0x7fff) | 0, 44 + i * 2);
  }
  fs.writeFileSync(file, out);
  return out.length;
}

// ── Render ───────────────────────────────────────────────────────────────────
fs.mkdirSync(OUT, { recursive: true });

// SFX: renderiza todos, normaliza com UM fator global (preserva o balanço).
const sfxBufs = {};
let sfxMax = 0;
for (const [name, fn] of Object.entries(sfxDefs)) {
  const b = new Float32Array(Math.ceil(1.4 * SR));
  fn(b);
  sfxBufs[name] = b;
  sfxMax = Math.max(sfxMax, peakOf(b));
}
const sfxScale = sfxMax > 0 ? 0.9 / sfxMax : 1;
let totalBytes = 0;
for (const [name, b] of Object.entries(sfxBufs)) {
  scale(b, sfxScale);
  const trimmed = trimTail(b);
  const bytes = writeWav(path.join(OUT, `${name}.wav`), trimmed);
  totalBytes += bytes;
  console.log(`  ${name}.wav  ${(bytes / 1024).toFixed(1)} KB  (${(trimmed.length / SR).toFixed(2)}s)`);
}

// Trilha: normaliza p/ pico ~0.7 (headroom), loop perfeito.
const theme = renderFarmTheme();
const tp = peakOf(theme);
if (tp > 0) scale(theme, 0.7 / tp);
const themeBytes = writeWav(path.join(OUT, "farm-theme.wav"), theme);
totalBytes += themeBytes;
console.log(`  farm-theme.wav  ${(themeBytes / 1024).toFixed(1)} KB  (${LOOP_SEC.toFixed(2)}s loop)`);

console.log(`\n✓ total ${(totalBytes / 1024).toFixed(0)} KB em ${OUT}`);
