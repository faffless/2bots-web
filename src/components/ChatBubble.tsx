import { memo } from 'react';
import type { ChatMsg } from '@/lib/constants';

const styles: Record<string, string> = {
  claude: 'border-bot-claude/20 bg-bot-claude/[0.08]',
  gpt: 'border-bot-gpt/20 bg-bot-gpt/[0.07]',
  user: 'border-bot-user/20 bg-bot-user/[0.08]',
};

const nameColors: Record<string, string> = {
  claude: 'text-bot-claude',
  gpt: 'text-bot-gpt',
  user: 'text-bot-user',
};

const labels: Record<string, string> = {
  claude: 'Claude',
  gpt: 'ChatGPT',
  user: 'You',
};

function ChatBubbleInner({ msg }: { msg: ChatMsg }) {
  if (msg.speaker === 'system') {
    return (
      <div className="text-center text-[13px] text-bot-muted italic py-0.5">
        {msg.text}
      </div>
    );
  }

  const alignment = msg.speaker === 'gpt' ? 'self-start' : 'self-end';

  return (
    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[15px] leading-relaxed border ${
      styles[msg.speaker] || ''
    } ${alignment} animate-fade-in`}>
      <span className={`text-xs font-normal tracking-wide block mb-0.5 ${nameColors[msg.speaker] || ''}`}>
        {labels[msg.speaker] || msg.speaker}
      </span>
      {msg.text}
    </div>
  );
}

const ChatBubble = memo(ChatBubbleInner);
export default ChatBubble;
