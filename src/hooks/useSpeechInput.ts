import { useRef, useState } from 'react';
import { isSpeechSupported, startListening, stopListening } from '@/lib/speech';
import { apiAutoStream, apiTurnStream } from '@/lib/api';
import { type ChatMsg, nextId, dlog } from '@/lib/constants';
import type { SSEEvent } from '@/lib/api';
import type { Round } from '@/lib/constants';

interface UseSpeechInputDeps {
  sessionId: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  stopPipeline: () => void;
  setStopped: (v: boolean) => void;
  stoppedRef: React.MutableRefObject<boolean>;
  setStatus: (s: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMsg[]>>;
  addMsg: (speaker: ChatMsg['speaker'], text: string) => number;
  freshAbort: () => AbortController;
  fetchRound: (sid: string, streamFn: (sid: string, onEvent: (e: SSEEvent) => void, signal: AbortSignal) => Promise<void>, controller: AbortController) => Promise<Round | null>;
  playRound: (round: Round) => Promise<boolean>;
  runPipeline: (sid: string, prefetch?: Promise<Round | null> | null, ctrl?: AbortController | null) => void;
  runningRef: React.MutableRefObject<boolean>;
  sessionRef: React.MutableRefObject<string | null>;
  abortRef: React.MutableRefObject<AbortController | null>;
}

export function useSpeechInput(deps: UseSpeechInputDeps) {
  const [recording, setRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const liveTranscriptMsgId = useRef<number | null>(null);

  const handleInterrupt = () => {
    if (!recording) {
      // ---- START recording ----
      dlog('user', 'INTERRUPT — stopping bots, starting mic');
      deps.stopPipeline();
      deps.stoppedRef.current = true;
      deps.setStopped(true);
      setLiveTranscript('');
      liveTranscriptMsgId.current = null;

      const speechAvailable = isSpeechSupported();
      if (!speechAvailable) {
        deps.setStatus('Your turn — type something!');
        deps.inputRef.current?.focus();
        return;
      }

      const started = startListening({
        onInterimResult: (fullText) => {
          setLiveTranscript(fullText);
          if (liveTranscriptMsgId.current !== null) {
            deps.setMessages(prev => prev.map(m =>
              m.id === liveTranscriptMsgId.current ? { ...m, text: fullText + ' ...' } : m
            ));
          } else {
            const id = nextId();
            liveTranscriptMsgId.current = id;
            deps.setMessages(prev => [...prev, { id, speaker: 'user', text: fullText + ' ...' }]);
          }
        },
        onFinalResult: (fullText) => {
          setLiveTranscript(fullText);
          if (liveTranscriptMsgId.current !== null) {
            deps.setMessages(prev => prev.map(m =>
              m.id === liveTranscriptMsgId.current ? { ...m, text: fullText + ' ...' } : m
            ));
          }
        },
        onError: (error) => {
          dlog('speech', `Error: ${error}`);
          if (error === 'not-allowed') {
            deps.setStatus('Mic access denied — type instead');
            setRecording(false);
          }
        },
        onEnd: () => {},
      });

      if (started) {
        setRecording(true);
        deps.setStatus('Listening... press INTERRUPT again when done');
      } else {
        deps.setStatus('Your turn — type something!');
        deps.inputRef.current?.focus();
      }
    } else {
      // ---- STOP recording, send to AIs ----
      dlog('user', 'INTERRUPT released — stopping mic, sending to AIs');
      const transcript = stopListening();
      setRecording(false);
      setLiveTranscript('');

      if (liveTranscriptMsgId.current !== null && transcript) {
        deps.setMessages(prev => prev.map(m =>
          m.id === liveTranscriptMsgId.current ? { ...m, text: transcript } : m
        ));
      }
      liveTranscriptMsgId.current = null;

      if (transcript && deps.sessionId) {
        deps.stoppedRef.current = false;
        deps.setStopped(false);
        deps.setStatus('Getting response...');

        const sid = deps.sessionId;
        (async () => {
          try {
            const ctrl = deps.freshAbort();
            const round = await deps.fetchRound(sid,
              (s, onEvent, signal) => apiTurnStream(s, transcript, onEvent, signal),
              ctrl,
            );
            if (!round || deps.stoppedRef.current) return;

            deps.runningRef.current = true;
            deps.setStatus('Bots chatting...');

            const prefetchCtrl = new AbortController();
            deps.abortRef.current = prefetchCtrl;
            const prefetchPromise = deps.fetchRound(sid,
              (s, cb, sig) => apiAutoStream(s, cb, sig), prefetchCtrl);

            await deps.playRound(round);

            if (deps.sessionRef.current && !deps.stoppedRef.current) {
              deps.runPipeline(deps.sessionRef.current, prefetchPromise, prefetchCtrl);
            } else {
              prefetchCtrl.abort();
            }
          } catch (err) {
            if ((err as Error)?.name !== 'AbortError') {
              deps.addMsg('system', `Error: ${(err as Error).message}`);
              deps.setStatus('Error');
            }
          }
        })();
      } else if (!transcript) {
        deps.stoppedRef.current = false;
        deps.setStopped(false);
        deps.setStatus('Bots chatting...');
        if (deps.sessionId) deps.runPipeline(deps.sessionId);
      }
    }
  };

  return { recording, liveTranscript, handleInterrupt };
}
