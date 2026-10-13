import type { AppSettings } from "@island/shared";

let context: AudioContext | undefined;
let musicTimer: ReturnType<typeof setTimeout> | undefined;
let settings: AppSettings | undefined;
let active = false;
let noteIndex = 0;
const melody = [
  261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 392, 329.63, 293.66, 261.63,
  196,
];
function getContext() {
  if (!context) context = new AudioContext();
  if (context.state === "suspended")
    void context.resume().catch(() => undefined);
  return context;
}
function tone(frequency: number, duration: number, volume: number) {
  try {
    const ctx = getContext(),
      oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  } catch {
    /* Sound is optional when audio is unavailable or blocked. */
  }
}
function musicStep() {
  if (!active || !settings?.bgm || document.visibilityState !== "visible")
    return;
  tone(melody[noteIndex++ % melody.length], 0.9, settings.volume * 0.055);
  musicTimer = setTimeout(musicStep, 800);
}
export function updateAudio(next: AppSettings) {
  settings = next;
  clearTimeout(musicTimer);
  if (active && next.bgm) musicStep();
}
export function unlockAudio(next: AppSettings) {
  const first = !active;
  active = true;
  settings = next;
  if (first && next.bgm) musicStep();
}
export function paintSound(next: AppSettings) {
  unlockAudio(next);
  if (next.soundEffects && next.volume > 0)
    tone(610, 0.12, next.volume * 0.075);
}
export function completionSound(next: AppSettings) {
  if (!next.soundEffects) return;
  [523.25, 659.25, 783.99].forEach((f, i) =>
    setTimeout(() => tone(f, 0.4, next.volume * 0.075), i * 100),
  );
}
export function stopAudio() {
  active = false;
  clearTimeout(musicTimer);
  void context?.suspend().catch(() => undefined);
}
export function speakColor(label: string, enabled: boolean) {
  if (
    !enabled ||
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  )
    return;
  try {
    const voice = window.speechSynthesis
      .getVoices()
      .find((item) => /^ja(?:-|$)/i.test(item.lang));
    if (!voice) return;
    window.speechSynthesis.cancel();
    const text = new SpeechSynthesisUtterance(label);
    text.lang = "ja-JP";
    text.voice = voice;
    text.rate = 0.9;
    window.speechSynthesis.speak(text);
  } catch {
    /* Selection always succeeds even if speech is unsupported. */
  }
}
