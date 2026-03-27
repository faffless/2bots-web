'use client';

import { useEffect, useState } from 'react';

const STAGES = [
  { text: 'Connecting to ChatGPT...', delay: 0 },
  { text: 'Connecting to Claude...', delay: 1500 },
  { text: 'Setting up the conversation...', delay: 3000 },
];

const MAX_DURATION = 50000; // 50s worst case (cold start)

export default function StartupLoader() {
  const [elapsed, setElapsed] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timers = STAGES.slice(1).map((stage, i) =>
      setTimeout(() => setStageIdx(i + 1), stage.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Ease-out: fast at first, slows down. Never quite reaches 100%.
  const raw = Math.min(elapsed / MAX_DURATION, 1);
  const eased = 1 - Math.pow(1 - raw, 3); // cubic ease-out
  const percent = Math.min(eased * 98, 98); // cap at 98% visually

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 animate-fade-in">
      <p className="text-xs text-bot-muted mb-4 transition-opacity duration-500">
        {STAGES[stageIdx].text}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-[280px] h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${percent}%`,
            background: 'linear-gradient(90deg, #74aa9c, #a78bfa)',
          }}
        />
      </div>
    </div>
  );
}
