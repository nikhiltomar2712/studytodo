/**
 * StudyFlow — audio feedback via the Web Audio API (no asset files needed).
 * A soft two-tone "ding" for session completion and a lower tone for breaks.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  audio: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  volume: number
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, audio.currentTime + startOffset);

  const t0 = audio.currentTime + startOffset;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Pleasant rising chime when a focus session ends. */
export function playFocusCompleteChime() {
  const audio = getCtx();
  if (!audio) return;
  // E5 -> A5 -> C#6 (A major arpeggio feel)
  tone(audio, 659.25, 0, 0.35, 0.18);
  tone(audio, 880.0, 0.18, 0.4, 0.16);
  tone(audio, 1108.73, 0.36, 0.55, 0.14);
}

/** Softer, falling chime when a break ends. */
export function playBreakCompleteChime() {
  const audio = getCtx();
  if (!audio) return;
  tone(audio, 880.0, 0, 0.3, 0.15);
  tone(audio, 659.25, 0.2, 0.45, 0.15);
}

/** Tiny tick for UI interactions (kept very quiet). */
export function playTick() {
  const audio = getCtx();
  if (!audio) return;
  tone(audio, 520, 0, 0.08, 0.05);
}
