import type { ChatbotConfig } from '../types';

interface ChatBubbleProps {
  config: ChatbotConfig;
  onClick: () => void;
  isOpen: boolean;
}

export default function ChatBubble({ config, onClick, isOpen }: ChatBubbleProps) {
  return (
    <button
      className={`cf-bubble ${isOpen ? 'cf-bubble-close' : ''}`}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      style={{ background: config.primaryColor }}
    >
      {isOpen ? (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
          <circle cx="12" cy="11" r="1.5" />
          <circle cx="7.5" cy="11" r="1.5" />
          <circle cx="16.5" cy="11" r="1.5" />
        </svg>
      )}
    </button>
  );
}