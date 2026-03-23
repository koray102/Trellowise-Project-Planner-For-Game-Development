/**
 * Notification Sound Utility
 * 
 * Uses the Web Audio API to programmatically generate a pleasant two-tone chime.
 * No external audio files needed.
 * 
 * --- CUSTOM SES DOSYASI KULLANMAK İSTERSENİZ ---
 * 1. Ses dosyanızı (örn: notification.mp3) public/ klasörüne koyun
 * 2. Aşağıdaki playNotificationSound fonksiyonunu şununla değiştirin:
 *
 *    export function playNotificationSound() {
 *      const audio = new Audio('/notification.mp3');
 *      audio.volume = 0.5;
 *      audio.play().catch(() => {});
 *    }
 *
 * Bu kadar! Artık kendi ses dosyanız çalacaktır.
 * -----------------------------------------------
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Plays a pleasant two-tone notification chime (~300ms).
 * First tone: 587 Hz (D5), second tone: 880 Hz (A5) — a rising interval.
 */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext();

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // --- Tone 1: D5 (587 Hz) ---
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // --- Tone 2: A5 (880 Hz) ---
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.3, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.35);
  } catch {
    // Silently fail if audio is not available
  }
}
