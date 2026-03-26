# 2BOTS — Developer Handoff Document

**Date:** March 26, 2026
**Owner:** Will (GitHub: faffless)
**Site:** 2bots.io

---

## What Is 2BOTS?

A web app where Claude and ChatGPT have a live voice conversation while a human listens and can interject. Think of it as a podcast with two AI hosts and a live audience of one. The user can interrupt at any time to speak (via mic or text), change personalities/voices/styles mid-conversation, and watch the bots react in real time.

---

## Architecture Overview

Two separate repos, two separate deployments:

### Backend — FastAPI + Python
- **Location:** `/2bots/backend/`
- **Entry:** `app.py` (FastAPI), `engine.py` (AI engine)
- **Runs:** Uvicorn on port 8000 (`python app.py`)
- **Deploy:** Heroku (see `Procfile`, `runtime.txt`)
- **Dependencies:** `requirements.txt` — fastapi, uvicorn, anthropic, openai, edge-tts, pydantic

### Frontend — Next.js 14 + TypeScript + Tailwind
- **Location:** `/Desktop/2bots-web/`
- **Entry:** `src/app/page.tsx` (single-page app)
- **Runs:** `npm run dev` on port 3000
- **Deploy:** Vercel
- **Dependencies:** `package.json` — next 14, react 18, tailwind 3.4

### Communication
- Frontend → Backend via **SSE (Server-Sent Events)** for streaming bot responses
- Settings updates via regular POST (`/settings/update`)
- `NEXT_PUBLIC_API_URL` env var points frontend at backend (defaults to `window.location.origin`)

---

## File Map

### Backend (`/2bots/backend/`)

| File | Purpose |
|------|---------|
| `engine.py` | Core AI engine: prompt building, API calls (Claude + GPT), TTS generation, conversation state |
| `app.py` | FastAPI routes, SSE streaming, session management, debug logging |
| `engine_v1.py` | Legacy engine (unused, kept for reference) |
| `app_v1.py` | Legacy app (unused) |
| `requirements.txt` | Python deps |
| `Procfile` | Heroku deployment config |
| `static/` | Static frontend build (for self-hosted mode) |

### Frontend (`/Desktop/2bots-web/src/`)

| File | Purpose |
|------|---------|
| `app/page.tsx` | **Main file** — all UI, state, pipeline logic, settings panels (~1150 lines) |
| `app/layout.tsx` | Root layout, metadata, global styles |
| `app/globals.css` | Tailwind imports, custom animations, range slider styling |
| `lib/api.ts` | API client — SSE streaming, settings updates, debug log fetching |
| `lib/audio.ts` | Audio playback — play base64 MP3, stop, isPlaying |
| `lib/speech.ts` | Web Speech API wrapper — live voice transcription (Chrome/Edge only) |
| `components/DebugPanel.tsx` | Debug log viewer — polls backend + shows frontend logs, toggle with backtick |
| `tailwind.config.ts` | Custom colors (bot-bg, bot-panel, bot-gpt, bot-claude, bot-user, bot-muted, bot-text) |

---

## How The Pipeline Works

This is the most important thing to understand. The entire UX is built around zero-gap audio playback.

### Round = 1 GPT response + 1 Claude response

Each "round" is fetched as a single SSE stream from the backend:
1. Backend calls GPT API → streams GPT text
2. Backend starts GPT TTS + Claude API **in parallel**
3. Backend streams GPT audio
4. Backend streams Claude text
5. Backend generates Claude TTS → streams Claude audio
6. Backend sends `done` event

### Frontend Pipeline (`runPipeline` in page.tsx)

```
Round N playing audio  ←→  Round N+1 prefetching from backend
         ↓                           ↓
    Audio finishes              Prefetch ready
         ↓                           ↓
    Round N+1 plays immediately (zero gap)
    Round N+2 prefetch starts
         ...continues...
```

The pipeline runs in a `while` loop. It always has one round playing and one prefetching. This is what makes the conversation feel seamless.

### Key Refs (not state, for immediate access):

| Ref | Purpose |
|-----|---------|
| `runningRef` | Pipeline is active — must be `true` before `playRound()` or it bails between GPT and Claude |
| `stoppedRef` | User explicitly stopped — prevents pipeline restart |
| `sessionRef` | Current session ID (ref, not state, for instant access in async code) |
| `abortRef` | Current AbortController for in-flight prefetch |
| `settingsChangedRef` | Flag: settings changed, discard stale prefetch |
| `settingsVersionRef` | Counter: bumps on every settings change |
| `prefetchVersionRef` | Stamp: what version was active when current prefetch started |
| `countdownRef` | How many bot responses remain before new settings take effect |

### Settings Hot-Swap Flow

When user changes a setting:
1. 300ms debounce (prevents spam from sliders)
2. POST to `/settings/update` — backend updates in-memory session
3. Bump `settingsVersionRef`
4. Set `countdownRef = 2` (show countdown overlay)
5. Abort in-flight prefetch if any
6. When pipeline picks up next prefetch, it checks `prefetchVersionRef !== settingsVersionRef` — if stale, discards and refetches fresh

This means: the currently-playing round uses old settings (unavoidable), but the very next round will use new settings. The countdown overlay tells the user "New settings in 2 responses" → "1 response" → disappears.

### User Interrupt Flow (SPEAK button)

1. User presses SPEAK → pipeline stops, mic starts (Web Speech API)
2. Live transcript appears in chat as user talks
3. User presses SEND → mic stops, transcript sent via `/turn/stream`
4. Both bots respond to user, then pipeline resumes with prefetch

---

## Backend Deep Dive

### engine.py — The AI Engine

**Models:**
- Claude: `claude-haiku-4-5-20251001` (Anthropic)
- GPT: `gpt-4o-mini` (OpenAI)
- TTS: `tts-1` (OpenAI) for both bots

**Response Length Presets** (recently changed from slider):
```python
RESPONSE_LENGTHS = {
    "very_short": { "max_tokens": 25,  "prompt": "HARD LIMIT: 15 words MAX..." },
    "brief":      { "max_tokens": 60,  "prompt": "HARD LIMIT: 35 words MAX..." },
    "normal":     { "max_tokens": 120, "prompt": "TARGET: around 60 words..." },
    "long":       { "max_tokens": 250, "prompt": "TARGET: around 120 words..." },
}
```

**System Prompt Structure** (`_build_system_prompt`):
1. Identity ("You are Claude/ChatGPT in a 3-way chat...")
2. Length guide (from preset above)
3. Conversation rules ("Rapid-fire spoken conversation, no markdown...")
4. Context-specific instruction (opener / auto / user-turn)
5. Interaction style (chatting, debate, roast, brainstorm, interview, roleplay)
6. Personality (14 options × 4 strength levels: off/subtle/strong/unhinged)
7. Quirks (18 options × 4 strength levels)
8. Custom instruction (freetext)

**Opener Prompts:**
- GPT: "Welcome the user to 2bots and say hi to Claude"
- Claude: "Say hi back to ChatGPT and the user. Ask how you can help."

**Key Design Decision:** `save_messages_only()` exists because `/auto/stream` and `/turn/stream` must NOT overwrite the session's settings when saving. The user might change settings mid-round via `/settings/update`, and if the auto endpoint saved the full engine state, it would overwrite those hot-swapped settings with stale ones.

### app.py — API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/start/stream` | POST | First round — creates session, opener messages |
| `/auto/stream` | POST | Auto-continue round (bots talk to each other) |
| `/turn/stream` | POST | User said something — bots respond |
| `/settings/update` | POST | Hot-swap settings for existing session |
| `/voices` | GET | Returns available voices, modes, personalities, quirks, response_lengths |
| `/debug/logs` | GET | Returns structured log entries since timestamp |
| `/session/{id}` | DELETE | Clean up session |
| `/health` | GET | Health check |

**Session Storage:** In-memory dict `SESSIONS`. No persistence. Sessions die on restart.

**Debug Logging:** Ring buffer (`deque(maxlen=200)`), structured entries with category/message/extras. Categories: round, gpt, claude, session, settings, auto.

---

## Frontend Deep Dive

### State Architecture (page.tsx)

Everything is in one file. No Redux, no context. Just `useState` + `useRef` + `useCallback`.

**UI State:** started, loading, stopped, recording, settingsOpen, showPricing, messages, status, typedText, turnCount, liveTranscript, settingsCountdown

**Settings State:** gptResponseLength, claudeResponseLength, gptVoice, claudeVoice, interactionStyle, gptPersonality, claudePersonality, gptQuirks, claudeQuirks, gptCustom, claudeCustom, gptPersonalityStrength, claudePersonalityStrength, gptQuirkStrength, claudeQuirkStrength

### Layout (Desktop)

```
┌─────────────┬──────────────────────┬──────────────┐
│  GPT Panel  │     Chat Column      │ Claude Panel │
│  (w-52)     │   (max-w-620px)      │   (w-52)     │
│             │                      │              │
│ Personality │  [Chat messages]     │ Personality  │
│ Voice       │                      │ Voice        │
│ Quirks      │  [Idea chips]        │ Quirks       │
│ Length btns │                      │ Length btns  │
│ Custom text │  [Input + controls]  │ Custom text  │
└─────────────┴──────────────────────┴──────────────┘
```

Side panels are `hidden lg:flex` — mobile users only get the chat column + settings drawer (gear icon).

### Color System (tailwind.config.ts)

| Token | Hex | Usage |
|-------|-----|-------|
| bot-bg | #1a1a2e | Page background |
| bot-panel | #16213e | Card/panel backgrounds |
| bot-settings | #0f1a2e | Settings drawer |
| bot-gpt | #78e08f | GPT green |
| bot-claude | #e77f67 | Claude amber/orange |
| bot-user | #82ccdd | User blue |
| bot-text | #eeeeee | Primary text |
| bot-muted | #888888 | Secondary text |

### Animations (globals.css)

- `animate-fade-in` — slide up + fade in (0.5s)
- `animate-pulse-glow` — blue glow pulse (START button)
- `animate-rec-pulse` — green pulse (recording indicator)
- `animate-blink` — cursor blink
- `animate-thinking` — opacity pulse

---

## Recent Changes (This Session)

### 1. Response Length: Slider → 4 Discrete Options
**Files changed:** engine.py, app.py, page.tsx

- Removed `gptMaxTokens`/`claudeMaxTokens` numeric state + `<input type="range">` sliders
- Added `RESPONSE_LENGTHS` dict in engine.py with 4 presets (very_short, brief, normal, long)
- Frontend now sends `gpt_response_length` / `claude_response_length` (string keys)
- UI is a row of 4 buttons per bot panel: V.Short | Brief | Normal | Long
- GPT buttons: green (#10a37f), Claude buttons: amber (#d97706)
- Default: "very_short" for both

### 2. Stale Prefetch Detection (Settings Version Stamp)
**Files changed:** page.tsx

**Problem:** When user changed settings, the prefetched next round might have already completed with old settings. Aborting only kills in-flight requests — completed prefetches were used as-is, causing ~40 second delay before new settings took effect.

**Fix:** Added `settingsVersionRef` (counter) and `prefetchVersionRef` (stamp). Each prefetch is stamped with the current version. When the pipeline consumes a prefetch, it compares versions. If mismatched, discards the stale data and refetches fresh.

### 3. Settings Countdown Overlay
**Files changed:** page.tsx

When settings change, two fixed-position overlays appear:
- Bottom-left: "ChatGPT — New settings in **2** responses"
- Bottom-right: "Claude — New settings in **2** responses"

Countdown decrements after each bot finishes speaking (in `playRound`). Disappears when it hits 0.

Uses `countdownRef` (ref for immediate mutation in callbacks) synced to `settingsCountdown` state (for rendering).

---

## Known Issues / Things To Watch

1. **DEFAULTS still has `gpt_max_tokens`/`claude_max_tokens`** — These are vestigial from the slider era. They're not used by the prompt builder or API calls anymore (those now read from `RESPONSE_LENGTHS` via the preset key). Safe to remove but harmless.

2. **Countdown assumes worst case of 2** — When settings change, we set countdown=2 (GPT + Claude in current round). If GPT already finished speaking, the real number is 1. Minor UX imprecision.

3. **No session persistence** — Sessions live in-memory. Server restart = all sessions lost. Fine for now.

4. **Firefox: no voice input** — Web Speech API is Chrome/Edge only. Firefox users get a text-only fallback (SPEAK button just focuses the text input).

5. **Free tier is client-side only** — `localStorage` counter for 3 sessions/day. Trivially bypassable. Placeholder until real auth.

6. **TTS is OpenAI only** — Both bots use OpenAI's `tts-1`. `edge-tts` is in requirements.txt but unused.

---

## Environment Variables

### Backend
| Var | Required | Purpose |
|-----|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | Claude API |
| `OPENAI_API_KEY` | Yes | GPT API + TTS |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (defaults to localhost + 2bots.io + Vercel) |
| `PORT` | No | Server port (default 8000) |

### Frontend
| Var | Required | Purpose |
|-----|----------|---------|
| `NEXT_PUBLIC_API_URL` | No | Backend URL (defaults to `window.location.origin`) |

---

## Running Locally

```bash
# Backend
cd 2bots/backend
export ANTHROPIC_API_KEY=sk-...
export OPENAI_API_KEY=sk-...
python app.py
# → http://localhost:8000

# Frontend
cd Desktop/2bots-web
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
# → http://localhost:3000
```

---

## Critical Patterns For Future Development

### The `sessionRef` Pattern
React state updates are async. In the pipeline's async `while` loop, `sessionId` state might be stale. Always use `sessionRef.current` for the current session ID inside async code. The ref is synced via `useEffect(() => { sessionRef.current = sessionId; }, [sessionId]);`

### The `runningRef` Must Be True Before `playRound`
`playRound()` checks `runningRef.current` between GPT and Claude audio. If it's false, it returns false (pipeline interprets as "stopped"). Always set `runningRef.current = true` before calling `playRound` — this tripped us up multiple times.

### The `save_messages_only()` Pattern
Never use `save()` (full state save) in `/auto/stream` or `/turn/stream`. It overwrites settings that were hot-swapped via `/settings/update`. Use `save_messages_only()` which only touches `claude_msgs` and `gpt_msgs`.

### Prefetch During Transitions
Every transition point (opener→pipeline, user-turn→pipeline, interrupt→pipeline) should prefetch the next auto round during the current audio playback. This is what makes it feel seamless. Pattern:
```typescript
const prefetchCtrl = new AbortController();
const prefetchPromise = fetchRound(sid, apiAutoStream, prefetchCtrl);
await playRound(currentRound);  // audio plays while prefetch runs
runPipeline(sid, prefetchPromise, prefetchCtrl);  // hand off
```

### Debounced Settings Updates
Settings changes are debounced 300ms before POSTing to backend. This prevents slider/button spam from flooding the API. The debounce timer ref is `settingsTimerRef`.
