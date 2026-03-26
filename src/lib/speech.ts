/**
 * Web Speech API wrapper for live voice transcription.
 * Falls back gracefully — if unsupported, isSupported() returns false
 * and the user can just type.
 */

// TypeScript doesn't ship Web Speech API types by default
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

let recognition: SpeechRecognition | null = null;
let onInterim: ((text: string) => void) | null = null;
let onFinal: ((text: string) => void) | null = null;
let finalTranscript = '';
let isListening = false;

export function isSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isRecording(): boolean {
  return isListening;
}

/**
 * Start listening. Calls onInterimResult with live partial text as
 * the user speaks. Calls onFinalResult when a phrase is finalized.
 * Both callbacks receive the FULL transcript so far (not just the delta).
 */
export function startListening(
  callbacks: {
    onInterimResult: (fullText: string) => void;
    onFinalResult: (fullText: string) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
  }
): boolean {
  if (!isSpeechSupported()) return false;
  if (isListening) return true; // already going

  const SpeechRecog = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecog) return false;

  recognition = new SpeechRecog();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  finalTranscript = '';
  onInterim = callbacks.onInterimResult;
  onFinal = callbacks.onFinalResult;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript + ' ';
        onFinal?.(finalTranscript.trim());
      } else {
        interim += result[0].transcript;
      }
    }
    // Show final + interim combined for live preview
    const fullText = (finalTranscript + interim).trim();
    if (fullText) {
      onInterim?.(fullText);
    }
  };

  recognition.onerror = (event) => {
    console.error('[speech] Error:', event.error);
    callbacks.onError?.(event.error);
    if (event.error !== 'no-speech') {
      isListening = false;
    }
  };

  recognition.onend = () => {
    // If we're still supposed to be listening (continuous mode can drop),
    // restart automatically
    if (isListening) {
      try {
        recognition?.start();
      } catch {
        isListening = false;
        callbacks.onEnd?.();
      }
    } else {
      callbacks.onEnd?.();
    }
  };

  try {
    recognition.start();
    isListening = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * Stop listening and return the final transcript.
 */
export function stopListening(): string {
  isListening = false;
  if (recognition) {
    try {
      recognition.stop();
    } catch { /* already stopped */ }
    recognition = null;
  }
  onInterim = null;
  onFinal = null;
  const result = finalTranscript.trim();
  finalTranscript = '';
  return result;
}
