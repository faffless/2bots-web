/**
 * 2BOTS API client — SSE streaming for fast perceived response.
 * GPT text shows immediately, audio follows, then Claude streams in.
 */

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || window.location.origin
    : '';

export interface BotMessage {
  speaker: 'gpt' | 'claude';
  text: string;
  voice?: string;
  mime_type?: string;
  audio_base64?: string;
}

export type SSEEvent =
  | { type: 'session'; session_id: string }
  | { type: 'text'; speaker: 'gpt' | 'claude'; text: string }
  | { type: 'audio'; speaker: 'gpt' | 'claude'; audio_base64: string; mime_type: string }
  | { type: 'done' };

export type SSECallback = (event: SSEEvent) => void;

/**
 * POST to an SSE endpoint, parse events as they arrive, call back for each.
 * Accepts an optional AbortSignal so callers can kill in-flight streams.
 */
async function streamPost(
  url: string,
  body: object,
  onEvent: SSECallback,
  signal?: AbortSignal
): Promise<void> {
  const resp = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!resp.ok) throw new Error(`${url} failed: ${resp.status}`);
  if (!resp.body) throw new Error('No response body');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6)) as SSEEvent;
            onEvent(event);
          } catch {
            // skip malformed events
          }
        }
      }
    }
  } catch (err) {
    if (signal?.aborted) return; // expected cancellation
    throw err;
  }

  // Process any remaining data in buffer
  if (buffer.startsWith('data: ')) {
    try {
      const event = JSON.parse(buffer.slice(6)) as SSEEvent;
      onEvent(event);
    } catch { /* skip */ }
  }
}

/** Start conversation — streams GPT then Claude */
export function apiStartStream(
  personality: number,
  settings: Record<string, unknown>,
  onEvent: SSECallback,
  signal?: AbortSignal
): Promise<void> {
  return streamPost('/start/stream', { personality, settings }, onEvent, signal);
}

/** User turn — streams GPT then Claude */
export function apiTurnStream(
  sessionId: string,
  text: string,
  onEvent: SSECallback,
  signal?: AbortSignal
): Promise<void> {
  return streamPost('/turn/stream', { session_id: sessionId, text }, onEvent, signal);
}

/** Auto continue — streams GPT then Claude */
export function apiAutoStream(
  sessionId: string,
  onEvent: SSECallback,
  signal?: AbortSignal
): Promise<void> {
  return streamPost('/auto/stream', { session_id: sessionId }, onEvent, signal);
}

/** Transcribe audio */
export async function apiTranscribe(
  sessionId: string,
  audioBlob: Blob,
  promptHint?: string
): Promise<{ session_id: string; text: string | null }> {
  const form = new FormData();
  form.append('session_id', sessionId);
  form.append('audio', audioBlob, 'recording.webm');
  if (promptHint) form.append('prompt_hint', promptHint);
  const resp = await fetch(`${API_BASE}/transcribe`, { method: 'POST', body: form });
  if (!resp.ok) throw new Error(`Transcribe failed: ${resp.status}`);
  return resp.json();
}

/** Hot-swap settings (voice, mode, etc.) for an existing session */
export async function apiUpdateSettings(
  sessionId: string,
  settings: Record<string, unknown>
): Promise<void> {
  await fetch(`${API_BASE}/settings/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, settings }),
  }).catch(() => {});
}

/** Delete session */
export async function apiDeleteSession(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
}
