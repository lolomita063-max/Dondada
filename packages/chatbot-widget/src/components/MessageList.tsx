import { useRef, useEffect } from 'react';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

export default function MessageList({ messages, isTyping }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="cf-messages">
      {messages.map((msg) => (
        <div key={msg.id} className={`cf-message cf-message-${msg.role}`}>
          <div>{msg.content}</div>
          <div className="cf-message-time">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))}
      {isTyping && (
        <div className="cf-typing">
          <span></span><span></span><span></span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}