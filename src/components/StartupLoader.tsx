'use client';

import { useEffect, useMemo, useState } from 'react';

const SETUP_LINES = [
  'Warming up the microphones...',
  'Bribing the bots to behave...',
  'Flipping a coin for who talks first...',
  'Loading controversial opinions...',
  'Stretching vocal cords...',
  'Deciding who gets the last word...',
  'Calibrating sarcasm levels...',
  'Shuffling conversation topics...',
  'Teaching the bots small talk...',
  'Polishing hot takes...',
  'Rehearsing dramatic pauses...',
  'Brewing some strong opinions...',
  'Clearing throats...',
  'Loosening up the banter...',
  'Picking a fight topic...',
  'Tuning the chaos engine...',
  'Preparing unsolicited advice...',
  'Loading interruption protocol...',
  'Synchronising egos...',
  'Placing bets on who wins...',
];

const MAX_DURATION = 50000; // 50s worst case (cold start)

function pickRandom3(): string[] {
  const shuffled = [...SETUP_LINES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export default function StartupLoader() {
  const [elapsed, setElapsed] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);

  // Pick 3 random setup lines once on mount (no repeats)
  const funnyLines = useMemo(() => pickRandom3(), []);

  const stages = useMemo(() => [
    { text: 'Connecting to ChatGPT...', delay: 0 },
    { text: 'Connecting to Claude...', delay: 1500 },
    { text: funnyLines[0], delay: 3000 },
    { text: funnyLines[1], delay: 23000 },
    { text: funnyLines[2], delay: 43000 },
  ], [funnyLines]);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timers = stages.slice(1).map((stage, i) =>
      setTimeout(() => setStageIdx(i + 1), stage.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [stages]);

  // Ease-out: fast at first, slows down. Never quite reaches 100%.
  const raw = Math.min(elapsed / MAX_DURATION, 1);
  const eased = 1 - Math.pow(1 - raw, 3); // cubic ease-out
  const percent = Math.min(eased * 98, 98); // cap at 98% visually

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 animate-fade-in">
      <p className="text-xs text-bot-muted mb-4 transition-opacity duration-500">
        {stages[stageIdx].text}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-[280px] h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${percent}%`,
            background: '#82ccdd',
          }}
        />
      </div>
    </div>
  );
}
