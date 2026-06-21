// Core types for the chatbot widget

export interface ChatbotConfig {
  apiBaseUrl: string;
  companyName?: string;
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  welcomeMessage?: string;
  title?: string;
  botAvatar?: string;
  bookingEnabled?: boolean;
}

export interface LeadInfo {
  name: string;
  email: string;
  company?: string;
  needs?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  sessionId?: string;
  lead?: LeadInfo;
  messages: Message[];
  status: 'collecting_lead' | 'chatting' | 'booking' | 'ended';
}

export interface ChatbotAPIResponse {
  sessionId?: string;
  message: string;
  actions?: string[];
  bookingUrl?: string;
}

export interface WidgetState {
  isOpen: boolean;
  session: ChatSession;
}

export const DEFAULT_CONFIG: ChatbotConfig = {
  apiBaseUrl: '/api/chatbot',
  companyName: 'Coreforge',
  primaryColor: '#2563eb',
  position: 'bottom-right',
  welcomeMessage: 'Hi there! 👋 How can we help you today?',
  title: 'Chat with us',
  bookingEnabled: false,
};