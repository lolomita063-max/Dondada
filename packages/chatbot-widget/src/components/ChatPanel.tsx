import type { ChatbotConfig } from '../types';
import { useChatbot } from '../hooks/useChatbot';
import LeadForm from './LeadForm';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

interface ChatPanelProps {
  config: ChatbotConfig;
  onClose: () => void;
  onBooking?: () => void;
}

export default function ChatPanel({ config, onClose, onBooking }: ChatPanelProps) {
  const { messages, sessionStatus, isTyping, submitLead, sendMessage, submitting } = useChatbot(config);

  return (
    <div className="cf-panel">
      {/* Header */}
      <div className="cf-header" onClick={onClose}>
        <h3>{config.title || 'Chat with us'}</h3>
        <button className="cf-header-close" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Lead Form or Chat */}
      {sessionStatus === 'collecting_lead' ? (
        <LeadForm onSubmit={submitLead} submitting={submitting} />
      ) : (
        <>
          <MessageList messages={messages} isTyping={isTyping} />
          <ChatInput onSend={sendMessage} disabled={isTyping} />
        </>
      )}
    </div>
  );
}