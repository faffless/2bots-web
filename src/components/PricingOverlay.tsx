import { FREE_SESSION_LIMIT } from '@/lib/constants';

interface PricingOverlayProps {
  onClose: () => void;
}

export default function PricingOverlay({ onClose }: PricingOverlayProps) {
  return (
    <div className="min-h-screen bg-bot-bg flex items-center justify-center px-6">
      <div className="max-w-lg text-center animate-fade-in" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <h1 className="text-4xl font-normal tracking-wide mb-2">You&apos;re hooked!</h1>
        <p className="text-bot-muted mb-8">
          You&apos;ve used your {FREE_SESSION_LIMIT} free conversations for today.
          Upgrade to Pro to keep the conversation going.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 mb-8">
          <div className="bg-bot-panel rounded-xl p-5 border border-white/5 text-left">
            <h3 className="font-normal tracking-wide mb-1">Free</h3>
            <div className="text-2xl font-normal mb-3">$0</div>
            <ul className="text-sm text-bot-muted space-y-1.5">
              <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>{FREE_SESSION_LIMIT} conversations / day</li>
              <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>Voice + text</li>
              <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>All features</li>
            </ul>
          </div>
          <div className="bg-bot-panel rounded-xl p-5 border-2 border-bot-user text-left">
            <h3 className="font-normal tracking-wide mb-1">Pro</h3>
            <div className="mb-3">
              <span className="text-2xl font-normal">$9.99</span>
              <span className="text-bot-muted text-sm">/month</span>
            </div>
            <ul className="text-sm text-bot-muted space-y-1.5">
              <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>Unlimited conversations</li>
              <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>Priority speed</li>
              <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>Conversation history</li>
              <li className="flex gap-2"><span className="text-bot-gpt">{'\u2713'}</span>Early access to new features</li>
            </ul>
            <button className="mt-4 w-full bg-bot-user text-bot-bg py-2 rounded-lg font-normal text-sm tracking-wide hover:opacity-90 transition">
              Upgrade to Pro
            </button>
          </div>
        </div>
        <button onClick={onClose} className="text-sm text-bot-muted hover:text-bot-muted/60 transition">
          Come back tomorrow for more free conversations
        </button>
      </div>
    </div>
  );
}
