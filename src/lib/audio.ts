/**
 * Audio playback queue + mic recording helpers for 2BOTS.
 */

type QueueItem = {
  speaker: string;
  base64: string;
  mimeType: string;
  onStart?: () => void;  // fires when THIS clip starts playing
};

type AudioCallbacks = {
  onPlayStart: (speaker: string) => void;
  onPlayEnd: () => void;
  onError: (msg: string) => void;
};

let queue: QueueItem[] = [];
let playing = false;
let currentAudio: HTMLAudioElement | null = null;
let callbacks: AudioCallbacks | null = null;

export function initAudio(cb: AudioCallbacks) {
  callbacks = cb;
}

export function queueAudio(
  speaker: string,
  base64: string,
  mimeType = 'audio/mpeg',
  onStart?: () => void
) {
  queue.push({ speaker, base64, mimeType, onStart });
  if (!playing) playNext();
}

function playNext() {
  if (queue.length === 0) {
    playing = false;
    currentAudio = null;
    callbacks?.onPlayEnd();
    return;
  }

  playing = true;
  const item = queue.shift()!;
  callbacks?.onPlayStart(item.speaker);
  item.onStart?.();  // reveal text for THIS specific clip

  const audio = new Audio(`data:${item.mimeType};base64,${item.base64}`);
  currentAudio = audio;

  audio.addEventListener('ended', () => {
    currentAudio = null;
    playing = false;
    playNext();
  });

  audio.addEventListener('error', () => {
    currentAudio = null;
    playing = false;
    callbacks?.onError('Audio playback error');
    playNext();
  });

  audio.play().catch(() => {
    currentAudio = null;
    playing = false;
    callbacks?.onError('Autoplay blocked — interact with the page first');
    document.addEventListener('click', () => playNext(), { once: true });
  });
}

export function stopAllAudio() {
  queue = [];
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  playing = false;
}

export function isAudioPlaying() {
  return playing;
}

// ---- Mic recording ----

let mediaRecorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let micStream: MediaStream | null = null;

function getSupportedMime(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return 'audio/webm';
}

/** Pre-request mic permission so the browser prompt appears early */
export async function requestMicPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Got permission — immediately stop the stream (we don't need it yet)
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch {
    return false;
  }
}

export async function startMicRecording(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  micStream = stream;
  chunks = [];

  mediaRecorder = new MediaRecorder(stream, { mimeType: getSupportedMime() });
  mediaRecorder.addEventListener('dataavailable', (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  });
  mediaRecorder.start(1000);
}

export function stopMicRecording(): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      resolve(null);
      return;
    }

    mediaRecorder.addEventListener('stop', () => {
      micStream?.getTracks().forEach((t) => t.stop());
      micStream = null;
      if (chunks.length === 0) {
        resolve(null);
        return;
      }
      const blob = new Blob(chunks, { type: mediaRecorder!.mimeType });
      chunks = [];
      resolve(blob);
    });

    mediaRecorder.stop();
  });
}

export function isMicRecording(): boolean {
  return mediaRecorder?.state === 'recording';
}
