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
  | { type: 'session'; session_id: string; gpt_personality?: string; claude_personality?: string }
  | { type: 'text'; speaker: 'gpt' | 'claude'; text: string }
  | { type: 'audio'; speaker: 'gpt' | 'claude'; audio_base64: string; mime_type: string }
  | { type: 'motivations'; gpt: string; claude: string }
  | { type: 'done'; next_generator?: string; filler?: boolean };

export type SSECallback = (event: SSEEvent) => void | Promise<void>;

/**
 * POST to an SSE endpoint, parse events as they arrive, call back for each.
 * Callbacks are awaited so audio playback completes before processing the next event.
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
            await onEvent(event);
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
      await onEvent(event);
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

/** Autopilot — one AI generates 10-14 messages for both bots */
export function apiAutopilotStream(
  sessionId: string,
  whoGenerates: string,
  onEvent: SSECallback,
  signal?: AbortSignal
): Promise<void> {
  return streamPost('/autopilot/stream', { session_id: sessionId, who_generates: whoGenerates }, onEvent, signal);
}

/** Filler — 2 quick acknowledgment messages after user speaks */
export function apiFillerStream(
  sessionId: string,
  userText: string,
  onEvent: SSECallback,
  signal?: AbortSignal
): Promise<void> {
  return streamPost('/filler/stream', { session_id: sessionId, user_text: userText }, onEvent, signal);
}

/** Hot-swap settings (voice, mode, etc.) for an existing session */
export async function apiUpdateSettings(
  sessionId: string,
  settings: Record<string, unknown>
): Promise<void> {
  const resp = await fetch(`${API_BASE}/settings/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, settings }),
  });
  if (!resp.ok) {
    throw new Error(`Settings update failed: ${resp.status}`);
  }
}

/** Fetch debug logs from backend */
export interface LogEntry {
  t: number;
  ts: string;
  cat: string;
  msg: string;
  [key: string]: unknown;
}

export async function apiDebugLogs(since: number = 0): Promise<LogEntry[]> {
  try {
    const resp = await fetch(`${API_BASE}/debug/logs?since=${since}`);
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.logs || [];
  } catch {
    return [];
  }
}

/** Delete session */
export async function apiDeleteSession(sessionId: string): Promise<void> {
  await fetch(`${API_BASE}/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
}
