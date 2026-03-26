interface SettingsCountdownProps {
  gptCount: number | null;
  claudeCount: number | null;
}

export default function SettingsCountdown({ gptCount, claudeCount }: SettingsCountdownProps) {
  return (
    <>
      {gptCount !== null && gptCount > 0 && (
        <div className="fixed bottom-6 left-6 bg-bot-panel border border-bot-gpt/30 rounded-lg px-3 py-2 animate-fade-in shadow-lg">
          <span className="text-[10px] text-bot-gpt font-normal tracking-wide">ChatGPT</span>
          <p className="text-[11px] text-bot-text mt-0.5">
            New settings in <span className="text-bot-gpt font-medium">{gptCount}</span> {gptCount === 1 ? 'response' : 'responses'}
          </p>
        </div>
      )}
      {claudeCount !== null && claudeCount > 0 && (
        <div className="fixed bottom-6 right-6 bg-bot-panel border border-bot-claude/30 rounded-lg px-3 py-2 animate-fade-in shadow-lg">
          <span className="text-[10px] text-bot-claude font-normal tracking-wide">Claude</span>
          <p className="text-[11px] text-bot-text mt-0.5">
            New settings in <span className="text-bot-claude font-medium">{claudeCount}</span> {claudeCount === 1 ? 'response' : 'responses'}
          </p>
        </div>
      )}
    </>
  );
}
