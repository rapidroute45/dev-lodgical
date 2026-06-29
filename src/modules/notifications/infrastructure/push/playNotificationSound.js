/** Short alert tone for incoming push (Web Audio — no external asset). */
export function playNotificationSound() {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.12;

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    oscillator.start(now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    oscillator.stop(now + 0.22);

    window.setTimeout(() => {
      void ctx.close();
    }, 400);
  } catch {
    // Autoplay or AudioContext blocked — ignore.
  }
}
