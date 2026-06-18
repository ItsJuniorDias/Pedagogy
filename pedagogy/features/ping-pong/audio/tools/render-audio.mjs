// ping-pong/audio/tools/render-audio.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Renderizador OFFLINE do NEON PONG: "assa" (bake) a síntese procedural para
// .wav, que o expo-audio toca. Mesmo motor (osciladores + envelopes + ruído
// filtrado + sequenciador) da versão web.
//
//   node tools/render-audio.mjs
//
// Gera em ../assets/audio/:
//   pong-theme.wav   (synthwave em Lá menor, loop perfeito ~7.27s)
//   serve/wall/spin/score-player/score-cpu/win/lose.wav
//   paddle-player[-hard]/paddle-cpu[-hard].wav  (timbre por quem bate + corte)
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

// ── DSP (igual ao renderer do farm) ──────────────────────────────────────────
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
    default:
      return Math.sin(ph);
  }
}
function envExp(t, attack, peak, total) {
  if (t >= total) return 0;
  const floor = 0.0001;
  if (t < attack) return floor * Math.pow(peak / floor, t / attack);
  return peak * Math.pow(floor / peak, (t - attack) / (total - attack));
}
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
function biquadCoeffs(type, f0, Q) {
  const w0 = (2 * Math.PI * f0) / SR;
  const cw = Math.cos(w0);
  const sw = Math.sin(w0);
  const alpha = sw / (2 * Q);
  let b0, b1, b2;
  if (type === "lowpass") {
    b0 = (1 - cw) / 2;
    b1 = 1 - cw;
    b2 = (1 - cw) / 2;
  } else if (type === "highpass") {
    b0 = (1 + cw) / 2;
    b1 = -(1 + cw);
    b2 = (1 + cw) / 2;
  } else {
    b0 = alpha;
    b1 = 0;
    b2 = -alpha;
  }
  const a0 = 1 + alpha;
  return [b0 / a0, b1 / a0, b2 / a0, (-2 * cw) / a0, (1 - alpha) / a0];
}
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

// ── Efeitos do PONG (mesma definição do sfx.ts web) ──────────────────────────
const SFX_BUS = 0.9;
function paddle(buf, isPlayer, spin) {
  const base = isPlayer ? 79 : 67;
  const f = midi(base + Math.min(7, spin * 7));
  tone(buf, 0, { freq: f, glideTo: f * 0.78, type: "square", dur: 0.06, gain: 0.2 }, SFX_BUS);
  noise(buf, 0, { freq: 2200, freqTo: 800, dur: 0.04, gain: 0.1, q: 1.5 }, SFX_BUS);
}
const sfxDefs = {
  serve: (b) => tone(b, 0, { freq: midi(81), type: "triangle", dur: 0.08, gain: 0.12 }, SFX_BUS),
  wall: (b) => tone(b, 0, { freq: midi(72), glideTo: midi(60), type: "triangle", dur: 0.05, gain: 0.12 }, SFX_BUS),
  spin: (b) => noise(b, 0, { type: "bandpass", freq: 500, freqTo: 2400, dur: 0.22, gain: 0.12, q: 0.7 }, SFX_BUS),
  "score-player": (b) => {
    tone(b, 0, { freq: midi(72), type: "square", dur: 0.1, gain: 0.16 }, SFX_BUS);
    tone(b, 0.1, { freq: midi(79), type: "square", dur: 0.16, gain: 0.16 }, SFX_BUS);
  },
  "score-cpu": (b) => {
    tone(b, 0, { freq: midi(64), type: "sawtooth", dur: 0.1, gain: 0.14 }, SFX_BUS);
    tone(b, 0.1, { freq: midi(57), type: "sawtooth", dur: 0.18, gain: 0.14 }, SFX_BUS);
  },
  win: (b) =>
    [60, 64, 67, 72, 76, 79].forEach((nn, i) =>
      tone(b, i * 0.09, { freq: midi(nn), type: "square", dur: 0.18, gain: 0.17 }, SFX_BUS),
    ),
  lose: (b) =>
    [67, 63, 60, 55].forEach((nn, i) =>
      tone(b, i * 0.12, { freq: midi(nn), type: "sawtooth", dur: 0.24, gain: 0.15 }, SFX_BUS),
    ),
  "paddle-player": (b) => paddle(b, true, 0),
  "paddle-player-hard": (b) => paddle(b, true, 1),
  "paddle-cpu": (b) => paddle(b, false, 0),
  "paddle-cpu-hard": (b) => paddle(b, false, 1),
};

// ── Trilha "pong" (mesma lógica do music.ts → pongStep), loop de 64 passos ───
const MUSIC_BUS = 0.5;
const PONG_BPM = 132;
const STEPS = 64;
const SEC_PER_STEP = 60 / PONG_BPM / 4;
const LOOP_SEC = STEPS * SEC_PER_STEP; // ~7.2727
const LOOP_SAMPLES = Math.round(LOOP_SEC * SR);
const PONG_ROOTS = [45, 41, 48, 43];
const PONG_LEAD = {
  0: 69, 4: 72, 8: 76, 11: 74, 14: 72,
  16: 65, 20: 69, 24: 72, 28: 69,
  32: 67, 36: 72, 40: 76, 43: 79, 46: 76,
  48: 74, 52: 71, 56: 67, 59: 71, 62: 74,
};
function renderPongTheme() {
  const buf = new Float32Array(LOOP_SAMPLES);
  const W = LOOP_SAMPLES;
  for (let step = 0; step < STEPS; step++) {
    const when = step * SEC_PER_STEP;
    const bar = Math.floor(step / 16);
    const inBar = step % 16;
    const root = PONG_ROOTS[bar];
    if (inBar % 4 === 0) {
      tone(buf, when, { freq: midi(36), glideTo: midi(24), type: "sine", dur: 0.14, gain: 0.18, attack: 0.002 }, MUSIC_BUS, W);
    }
    if (inBar % 4 === 2) {
      noise(buf, when, { type: "highpass", freq: 7000, dur: 0.03, gain: 0.05 }, MUSIC_BUS, W);
    }
    if (inBar % 2 === 0) {
      const oct = inBar % 8 === 6 ? 0 : -12;
      tone(buf, when, { freq: midi(root - 12 + (oct === 0 ? 12 : 0)), type: "sawtooth", dur: 0.16, gain: 0.1, attack: 0.004 }, MUSIC_BUS, W);
    }
    const lead = PONG_LEAD[step];
    if (lead) {
      tone(buf, when, { freq: midi(lead), type: "sawtooth", dur: 0.2, gain: 0.09, attack: 0.005 }, MUSIC_BUS, W);
      tone(buf, when, { freq: midi(lead), type: "square", dur: 0.2, gain: 0.04, detune: 8 }, MUSIC_BUS, W);
    }
  }
  return buf;
}

// ── Utils + WAV ──────────────────────────────────────────────────────────────
const peakOf = (b) => { let p = 0; for (let i = 0; i < b.length; i++) p = Math.max(p, Math.abs(b[i])); return p; };
const scale = (b, k) => { for (let i = 0; i < b.length; i++) b[i] *= k; };
function trimTail(b, thresh = 1e-4) {
  let end = b.length;
  while (end > 1 && Math.abs(b[end - 1]) < thresh) end--;
  return b.subarray(0, Math.min(b.length, end + Math.round(0.01 * SR)));
}
function writeWav(file, b) {
  const n = b.length;
  const out = Buffer.alloc(44 + n * 2);
  out.write("RIFF", 0); out.writeUInt32LE(36 + n * 2, 4); out.write("WAVE", 8);
  out.write("fmt ", 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 2, 28);
  out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write("data", 36); out.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, b[i]));
    out.writeInt16LE((s < 0 ? s * 0x8000 : s * 0x7fff) | 0, 44 + i * 2);
  }
  fs.writeFileSync(file, out);
  return out.length;
}

fs.mkdirSync(OUT, { recursive: true });
const sfxBufs = {};
let sfxMax = 0;
for (const [name, fn] of Object.entries(sfxDefs)) {
  const b = new Float32Array(Math.ceil(1.4 * SR));
  fn(b);
  sfxBufs[name] = b;
  sfxMax = Math.max(sfxMax, peakOf(b));
}
const sfxScale = sfxMax > 0 ? 0.9 / sfxMax : 1;
let total = 0;
for (const [name, b] of Object.entries(sfxBufs)) {
  scale(b, sfxScale);
  const bytes = writeWav(path.join(OUT, `${name}.wav`), trimTail(b));
  total += bytes;
  console.log(`  ${name}.wav  ${(bytes / 1024).toFixed(1)} KB`);
}
const theme = renderPongTheme();
const tp = peakOf(theme);
if (tp > 0) scale(theme, 0.72 / tp);
total += writeWav(path.join(OUT, "pong-theme.wav"), theme);
console.log(`  pong-theme.wav  loop ${LOOP_SEC.toFixed(3)}s`);
console.log(`\n✓ total ${(total / 1024).toFixed(0)} KB em ${OUT}`);
