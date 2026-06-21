import React, { useState, useRef, useEffect } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

interface ChatBoxProps {
  apiUrl: string;
  title?: string;
  subtitle?: string;
  primaryColor?: string;
}

export function ChatBox({ 
  apiUrl, 
  title = 'CoreBot AI', 
  subtitle = 'Sales Automation Assistant',
  primaryColor = '#4F46E5',
}: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'bot', content: '👋 Hi there! Click here to start a conversation.' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/chatbot/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'widget' }),
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.data.sessionId);
        setMessages([
          { id: '1', role: 'bot', content: data.data.message },
        ]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'bot', 
        content: 'Sorry, I\'m having trouble connecting. Please try again later.' 
      }]);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // Add typing indicator
    const typingId = 'typing';
    setMessages(prev => [...prev, { id: typingId, role: 'bot', content: '...' }]);

    try {
      const res = await fetch(`${apiUrl}/api/v1/chatbot/message`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session-id': sessionId || '',
        },
        body: JSON.stringify({ message: userMsg.content, sessionId }),
      });
      const data = await res.json();

      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== typingId));

      if (data.success) {
        if (!sessionId) setSessionId(data.data.sessionId);
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'bot', 
          content: data.data.message 
        }]);
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== typingId));
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'bot', 
        content: 'Sorry, something went wrong. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="cf-widget-container" style={{ '--cf-primary': primaryColor } as React.CSSProperties}>
      {isOpen && (
        <div className="cf-chat-window">
          <div className="cf-header">
            <div>
              <div className="cf-header-title">{title}</div>
              <div className="cf-header-subtitle">{subtitle}</div>
            </div>
            <button className="cf-close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="cf-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`cf-message ${msg.role}${msg.content === '...' ? ' typing' : ''}`}>
                {msg.content === '...' ? (
                  <>
                    <span className="cf-typing-dot" />
                    <span className="cf-typing-dot" />
                    <span className="cf-typing-dot" />
                  </>
                ) : (
                  msg.content
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="cf-input-area">
            <input
              className="cf-input"
              placeholder="Type a message..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button 
              className="cf-send-btn" 
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          <div className="cf-powered">
            Powered by <a href="https://coreforge.io" target="_blank" rel="noopener">Coreforge Engineering</a>
          </div>
        </div>
      )}

      <button 
        className={`cf-chat-button${isOpen ? ' open' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && messages.length <= 1) {
            startSession();
          }
        }}
      >
        {isOpen ? '✕' : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
