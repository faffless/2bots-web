'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiDebugLogs, type LogEntry } from '@/lib/api';

const CAT_COLORS: Record<string, string> = {
  round: '#f59e0b',    // amber
  gpt: '#22c55e',      // green
  claude: '#a78bfa',   // purple
  session: '#3b82f6',  // blue
  settings: '#f97316',  // orange
  auto: '#06b6d4',     // cyan
  turn: '#ec4899',     // pink
  frontend: '#94a3b8', // gray
};

interface FrontendLog {
  ts: string;
  cat: string;
  msg: string;
  t: number;
}

export default function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [backendLogs, setBackendLogs] = useState<LogEntry[]>([]);
  const [frontendLogs, setFrontendLogs] = useState<FrontendLog[]>([]);
  const sinceRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const frontendStartRef = useRef(Date.now());

  // Expose a global function so page.tsx can push frontend logs
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__debugLog = (cat: string, msg: string) => {
      const t = (Date.now() - frontendStartRef.current) / 1000;
      const now = new Date();
      const ts = now.toTimeString().slice(0, 8) + '.' + String(now.getMilliseconds()).padStart(3, '0');
      setFrontendLogs(prev => [...prev.slice(-100), { ts, cat: `fe:${cat}`, msg, t }]);
    };
    return () => { delete (window as unknown as Record<string, unknown>).__debugLog; };
  }, []);

  // Poll backend logs when open
  useEffect(() => {
    if (!open) return;
    let active = true;
    const poll = async () => {
      while (active) {
        const entries = await apiDebugLogs(sinceRef.current);
        if (entries.length > 0) {
          sinceRef.current = Math.max(...entries.map(e => e.t));
          setBackendLogs(prev => [...prev, ...entries].slice(-150));
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    };
    poll();
    return () => { active = false; };
  }, [open]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [backendLogs, frontendLogs]);

  // Toggle with backtick key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '`' && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        setOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const clear = useCallback(() => {
    setBackendLogs([]);
    setFrontendLogs([]);
    sinceRef.current = 0;
  }, []);

  // Merge and sort all logs by timestamp string
  const allLogs = [
    ...backendLogs.map(l => ({ ...l, source: 'be' as const })),
    ...frontendLogs.map(l => ({ ...l, source: 'fe' as const })),
  ].sort((a, b) => a.t - b.t);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-50 bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded opacity-40 hover:opacity-100 transition-opacity"
        title="Debug logs (or press ` key)"
      >
        DBG
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full md:w-[600px] h-[350px] bg-gray-950 border-t border-l border-gray-700 flex flex-col font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-700">
        <span className="text-gray-300 font-semibold">Debug Logs</span>
        <div className="flex gap-2">
          <button onClick={clear} className="text-gray-500 hover:text-gray-300">Clear</button>
          <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300">Close</button>
        </div>
      </div>

      {/* Log entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {allLogs.length === 0 && (
          <div className="text-gray-600 text-center mt-8">No logs yet. Start a conversation to see timing data.</div>
        )}
        {allLogs.map((entry, i) => {
          const color = CAT_COLORS[entry.cat] || CAT_COLORS[entry.cat.replace('fe:', '')] || '#94a3b8';
          // Build extra fields display
          const extras: string[] = [];
          for (const [k, v] of Object.entries(entry)) {
            if (['t', 'ts', 'cat', 'msg', 'source'].includes(k)) continue;
            extras.push(`${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`);
          }
          return (
            <div key={i} className="flex gap-2 leading-tight">
              <span className="text-gray-600 shrink-0">{entry.ts}</span>
              <span className="shrink-0 font-semibold" style={{ color, minWidth: '70px' }}>
                {entry.cat}
              </span>
              <span className="text-gray-300">{entry.msg}</span>
              {extras.length > 0 && (
                <span className="text-gray-600">{extras.join(' ')}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-3 py-1 bg-gray-900 border-t border-gray-700 text-gray-500">
        <span>Press ` to toggle</span>
        <span>|</span>
        {Object.entries(CAT_COLORS).slice(0, 5).map(([cat, color]) => (
          <span key={cat} style={{ color }}>{cat}</span>
        ))}
      </div>
    </div>
  );
}
