import { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ChatbotConfig, WidgetState } from '../types';
import { DEFAULT_CONFIG } from '../types';
import ChatBubble from './ChatBubble';
import ChatPanel from './ChatPanel';
import { WIDGET_STYLES } from '../styles/widget.css';

interface WidgetProps {
  config: ChatbotConfig;
}

function Widget({ config }: WidgetProps) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.closest('.cf-chatbot')) {
        return;
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleBooking = useCallback(() => {
    // Open booking URL in new tab
    window.open('/booking', '_blank');
  }, []);

  return (
    <div
      className={`cf-chatbot cf-${mergedConfig.position || 'bottom-right'}`}
      style={{ '--cf-primary': mergedConfig.primaryColor } as React.CSSProperties}
    >
      {isOpen && (
        <div ref={panelRef}>
          <ChatPanel
            config={mergedConfig}
            onClose={toggleOpen}
            onBooking={handleBooking}
          />
        </div>
      )}
      <ChatBubble
        config={mergedConfig}
        onClick={toggleOpen}
        isOpen={isOpen}
      />
    </div>
  );
}

// --- Embedding API ---

function injectStyles(): HTMLStyleElement | null {
  // Check if already injected
  if (document.getElementById('cf-chatbot-styles')) return null;

  const style = document.createElement('style');
  style.id = 'cf-chatbot-styles';
  style.textContent = WIDGET_STYLES;
  document.head.appendChild(style);
  return style;
}

export function initWidget(config: ChatbotConfig): { destroy: () => void } {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  injectStyles();

  const container = document.createElement('div');
  container.id = 'cf-chatbot-container';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<Widget config={mergedConfig} />);

  return {
    destroy: () => {
      root.unmount();
      container.remove();
    },
  };
}