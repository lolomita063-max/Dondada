import { useState, useCallback, useRef } from 'react';
import type { Message, LeadInfo, ChatSession, ChatbotConfig, ChatbotAPIResponse } from '../types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function useChatbot(config: ChatbotConfig) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionStatus, setSessionStatus] = useState<ChatSession['status']>('collecting_lead');
  const [leadInfo, setLeadInfo] = useState<LeadInfo | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const sessionIdRef = useRef<string>();

  const addBotMessage = useCallback((content: string) => {
    const msg: Message = {
      id: generateId(),
      role: 'bot',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    const msg: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const startChat = useCallback((lead: LeadInfo) => {
    setLeadInfo(lead);
    setSessionStatus('chatting');

    const welcomeMsg = config.welcomeMessage || 'Hi there! How can we help you today?';
    addBotMessage(welcomeMsg);
  }, [config.welcomeMessage, addBotMessage]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isTyping) return;
    addUserMessage(content);
    setIsTyping(true);

    try {
      const response = await fetch(`${config.apiBaseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId: sessionIdRef.current,
          lead: leadInfo,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data: ChatbotAPIResponse = await response.json();
      sessionIdRef.current = data.sessionId;
      addBotMessage(data.message);

      // Handle booking flow
      if (data.bookingUrl && config.bookingEnabled) {
        setSessionStatus('booking');
        addBotMessage('Would you like to schedule an appointment? Click the link below to book a time.');
      }
    } catch {
      // Fallback: simulate response for demo
      setTimeout(() => {
        const responses = [
          "Thanks for your message! I'll look into that for you.",
          "That's a great question! Let me find the right information.",
          "I understand. Our team can definitely help with that.",
          "Thanks for sharing. Let me connect you with the right person.",
        ];
        addBotMessage(responses[Math.floor(Math.random() * responses.length)]);
      }, 1000);
    } finally {
      setTimeout(() => setIsTyping(false), 500);
    }
  }, [addUserMessage, addBotMessage, config.apiBaseUrl, config.bookingEnabled, isTyping, leadInfo]);

  const submitLead = useCallback(async (lead: LeadInfo) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      if (!response.ok) throw new Error('API error');
    } catch {
      // Silently handle - lead info is still captured locally
    }
    startChat(lead);
  }, [config.apiBaseUrl, startChat]);

  const reset = useCallback(() => {
    setMessages([]);
    setSessionStatus('collecting_lead');
    setLeadInfo(null);
    setIsTyping(false);
    sessionIdRef.current = undefined;
  }, []);

  return {
    messages,
    sessionStatus,
    leadInfo,
    isTyping,
    sendMessage,
    submitLead,
    startChat,
    reset,
  };
}