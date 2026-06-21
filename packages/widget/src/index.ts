import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ChatBox } from './components/ChatBox';
import './styles/widget.css';

export interface CoreforgeChatbotConfig {
  /** API URL for the chatbot backend */
  apiUrl: string;
  /** Optional title (default: "CoreBot AI") */
  title?: string;
  /** Optional subtitle (default: "Sales Automation Assistant") */
  subtitle?: string;
  /** Optional primary color hex (default: "#4F46E5") */
  primaryColor?: string;
  /** Optional container element ID (default: creates its own) */
  containerId?: string;
}

/**
 * Initialize and mount the Coreforge Chatbot widget.
 * Call this once on your page to embed the chatbot.
 * 
 * @example
 * ```html
 * <script src="https://cdn.coreforge.io/widget/coreforge-chatbot.js"></script>
 * <script>
 *   CoreforgeChatbot.init({ apiUrl: 'https://api.coreforge.io' });
 * </script>
 * ```
 */
function init(config: CoreforgeChatbotConfig): void {
  const containerId = config.containerId || 'cf-chatbot-container';
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  const root = createRoot(container);
  root.render(
    React.createElement(ChatBox, {
      apiUrl: config.apiUrl,
      title: config.title,
      subtitle: config.subtitle,
      primaryColor: config.primaryColor,
    })
  );
}

// Expose globally for script-tag embedding
if (typeof window !== 'undefined') {
  (window as any).CoreforgeChatbot = { init };
}

export { init, ChatBox };
export default { init };
