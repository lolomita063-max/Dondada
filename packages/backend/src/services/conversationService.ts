import { v4 as uuidv4 } from 'uuid';
import {
  classifyIntent,
  extractLeadData,
  getMissingLeadFields,
  getGreeting,
  ChatMessage,
  ChatbotResponse,
} from './chatbotEngine.js';
import {
  createConversation,
  getConversationBySession,
  updateConversation,
  qualifyConversation,
  createLead,
  getLeadByConversation,
  updateLeadStatus,
  createAppointment,
  trackAnalytics,
  getAnalyticsSummary,
} from './leadService.js';

interface SessionState {
  conversationId: string;
  collectedData: Record<string, string>;
  phase: 'initial' | 'collecting_info' | 'qualified' | 'booking' | 'completed';
  messageHistory: ChatMessage[];
  intentCounts: Record<string, number>;
}

// In-memory session store (for MVP; use Redis in production)
const sessions = new Map<string, SessionState>();

export function startSession(sessionId: string, source = 'widget'): ChatbotResponse {
  const conv = createConversation(sessionId, source);
  
  const state: SessionState = {
    conversationId: conv.id,
    collectedData: {},
    phase: 'initial',
    messageHistory: [],
    intentCounts: {},
  };
  
  sessions.set(sessionId, state);
  trackAnalytics('session_started', sessionId);

  return getGreeting();
}

export function processMessage(sessionId: string, message: string): ChatbotResponse {
  let state = sessions.get(sessionId);
  
  if (!state) {
    // Auto-start session if not found
    return startSession(sessionId);
  }

  // Add user message to history
  state.messageHistory.push({ role: 'user', content: message });

  // Classify intent
  const intent = classifyIntent(message);
  state.intentCounts[intent.intent] = (state.intentCounts[intent.intent] || 0) + 1;

  // Extract lead data
  const extractedData = extractLeadData(message);
  Object.assign(state.collectedData, extractedData);

  // Update database conversation with collected info
  if (Object.keys(extractedData).length > 0) {
    updateConversation(state.conversationId, extractedData as any);
  }

  let responseMessage = '';
  let nextPhase = state.phase;

  switch (intent.intent) {
    case 'greeting': {
      if (state.phase === 'initial') {
        responseMessage = "Great to meet you! Could you tell me your name and a bit about what your business does? I'm here to help you find the right sales automation solution.";
        nextPhase = 'collecting_info';
      } else {
        responseMessage = "Hello again! Let's continue where we left off. ";
        const missing = getMissingLeadFields(state.collectedData);
        if (missing.length > 0) {
          responseMessage += `I still need your ${missing.join(' and ')} to get started.`;
        } else {
          responseMessage += "Would you like to book a demo to see our platform in action?";
        }
      }
      break;
    }

    case 'lead_qualification': {
      const missing = getMissingLeadFields(state.collectedData);

      if (missing.length === 0) {
        // We have enough info — qualify and offer booking
        qualifyConversation(state.conversationId, 'lead_qualification');
        createLead(state.conversationId, state.collectedData as any);
        trackAnalytics('lead_qualified', sessionId, { conversationId: state.conversationId });
        
        responseMessage = `Thanks ${state.collectedData.name || 'there'}! I've noted down your info. Based on what you've shared, our sales automation platform could be a great fit for ${state.collectedData.company || 'your business'}. Would you like to schedule a free 15-minute demo call to see it in action? Just let me know a day and time that works for you.`;
        nextPhase = 'booking';
      } else {
        const fieldPrompts: Record<string, string> = {
          name: "What's your name?",
          email: "What's the best email to reach you at?",
        };
        const prompt = fieldPrompts[missing[0]] || `Could you share your ${missing[0]}?`;
        responseMessage = `Thanks! ${prompt}`;
        nextPhase = 'collecting_info';
      }
      break;
    }

    case 'faq': {
      // Handle FAQ — answer and pivot to qualification
      responseMessage = handleFAQ(message);
      const missing = getMissingLeadFields(state.collectedData);
      if (missing.length > 0) {
        responseMessage += ` By the way, could I grab your ${missing.join(' and ')} so I can follow up with more tailored info?`;
      } else if (state.phase !== 'booking') {
        responseMessage += " Would you like to book a quick demo to see how it all works?";
        nextPhase = 'booking';
      }
      break;
    }

    case 'booking': {
      // Extract date/time from message
      const timeMatch = message.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      const dayMatch = message.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b/i);
      
      if (timeMatch) {
        const lead = getLeadByConversation(state.conversationId);
        if (lead) {
          const scheduledAt = dayMatch 
            ? `${dayMatch[1]} at ${timeMatch[0]}`
            : `Next available slot at ${timeMatch[0]}`;
          
          // Record the appointment in the database
          try {
            createAppointment(lead.id, scheduledAt, 30);
            updateLeadStatus(lead.id, 'booked');
            trackAnalytics('appointment_booked', sessionId, { leadId: lead.id });
          } catch (e) {
            // Appointment table may not have lead yet
          }
        }

        responseMessage = `Perfect! I've scheduled a demo for ${scheduledAt}. You'll receive a calendar invite shortly. In the meantime, feel free to ask any other questions!`;
        nextPhase = 'completed';
      } else if (dayMatch) {
        responseMessage = `Great, ${dayMatch[1]} works! What time would be best for you — morning or afternoon?`;
      } else {
        responseMessage = "I'd be happy to schedule a demo! What day works best for you — and what time would you prefer?";
      }
      break;
    }

    case 'farewell': {
      responseMessage = "Thanks for chatting! If you ever have more questions, feel free to come back. Have a great day! 😊";
      nextPhase = 'completed';
      break;
    }

    default: {
      const missing = getMissingLeadFields(state.collectedData);
      if (missing.length > 0) {
        responseMessage = `I'd love to help with that! First, could you share your ${missing.join(' and ')} so I can give you the best information?`;
        nextPhase = 'collecting_info';
      } else {
        responseMessage = "Got it! Would you like to book a quick demo to see our platform in action? Just let me know a good day and time.";
        nextPhase = 'booking';
      }
      break;
    }
  }

  // Update state
  state.phase = nextPhase;
  state.messageHistory.push({ role: 'assistant', content: responseMessage });

  // Record analytics
  trackAnalytics('message_processed', sessionId, { intent: intent.intent, phase: nextPhase });

  return {
    message: responseMessage,
    intent,
    leadData: state.collectedData,
    shouldCollectLeadInfo: getMissingLeadFields(state.collectedData).length > 0,
    conversationPhase: nextPhase,
  };
}

/**
 * Handle FAQ responses.
 */
function handleFAQ(message: string): string {
  const lower = message.toLowerCase();

  if (/\b(pricing|cost|price|how much)\b/.test(lower)) {
    return "Our pricing is tailored to your needs — we have flexible tiers starting from a basic plan. I'd recommend a quick call to discuss what fits best for your business!";
  }
  if (/\b(feature|capabilit|what does it do|what is)\b.*\b(chatbot|platform|software)\b/.test(lower)) {
    return "Coreforge provides full-stack sales automation: AI lead generation, smart appointment setting, email outreach, CRM automation, and conversational AI chatbots — all in one platform.";
  }
  if (/\b(integrat|connect|works with|compatible)\b/.test(lower)) {
    return "We integrate with major CRMs like HubSpot and Salesforce, plus popular calendar tools. Our API makes custom integrations straightforward too!";
  }
  if (/\b(how.*(work|function)|demo|trial|try)\b/.test(lower)) {
    return "Great question! Our AI handles lead gen, qualification, and booking so your team can focus on closing deals. The best way to see it is a quick demo — want to schedule one?";
  }

  return "That's a great question! I'd be happy to help. The best way to get you the right info would be a quick chat — what's your name and email so I can send over the details?";
}

export function getSessionState(sessionId: string): SessionState | undefined {
  return sessions.get(sessionId);
}

export { getAnalyticsSummary };
