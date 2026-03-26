/**
 * Audio 2.0 — Simple: play one clip, await completion. No queue.
 * The pipeline in page.tsx handles sequencing.
 */

let currentAudio: HTMLAudioElement | null = null;
let currentResolve: (() => void) | null = null;

/**
 * Play a base64-encoded audio clip. Returns a promise that resolves
 * when playback finishes (or when stopAudio() is called).
 */
export function playAudioBase64(base64: string, mime = 'audio/mpeg'): Promise<void> {
  // Stop anything currently playing first
  stopAudio();

  return new Promise((resolve) => {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    currentResolve = resolve;

    const done = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) {
        currentAudio = null;
        currentResolve = null;
      }
      resolve();
    };

    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(() => {
      // Autoplay blocked — resolve so pipeline continues
      // (text still shows, just no audio)
      done();
    });
  });
}

/**
 * Immediately stop whatever is playing and resolve its promise.
 */
export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if (currentResolve) {
    currentResolve();
    currentResolve = null;
  }
}

/**
 * Returns true if audio is currently playing.
 */
export function isPlaying(): boolean {
  return currentAudio !== null;
}
