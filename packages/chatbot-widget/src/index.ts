import { initWidget } from './components/Widget';
import type { ChatbotConfig, ChatbotAPIResponse } from './types';

// Main entry point - exports the embed API
export { initWidget };
export type { ChatbotConfig, ChatbotAPIResponse };

// Convenience global for script-tag embedding
if (typeof window !== 'undefined') {
  (window as Record<string, unknown>).CoreforgeChatbot = {
    init: initWidget,
  };
}