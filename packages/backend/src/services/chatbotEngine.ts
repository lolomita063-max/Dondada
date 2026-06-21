/**
 * Chatbot Engine — Intent classification, lead qualification, FAQ, and booking logic.
 * Uses real AI (OpenAI/Anthropic) when API keys are configured, with regex fallback.
 */

import { loadAiConfig, callAi, AiConfig, AiMessage } from '../lib/aiClient.js';

let aiConfig: AiConfig = loadAiConfig();

/** Refresh AI config from env (e.g. after env var change) */
export function refreshAiConfig(): void {
  aiConfig = loadAiConfig();
}

export function isAiEnabled(): boolean {
  return aiConfig.provider !== 'none' && !!aiConfig.apiKey;
}

export function getAiConfig(): AiConfig {
  return aiConfig;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface IntentResult {
  intent: 'greeting' | 'lead_qualification' | 'faq' | 'booking' | 'general' | 'farewell';
  confidence: number;
  extractedData?: Record<string, string>;
}

export interface ChatbotResponse {
  message: string;
  intent: IntentResult;
  leadData?: Record<string, string>;
  bookingRequest?: { slot?: string; date?: string };
  shouldCollectLeadInfo: boolean;
  conversationPhase: 'initial' | 'collecting_info' | 'qualified' | 'booking' | 'completed';
}

/**
 * Use AI to classify intent when API key is configured.
 */
export async function classifyIntentWithAI(message: string, history: ChatMessage[]): Promise<IntentResult | null> {
  if (aiConfig.provider === 'none') return null;

  const systemPrompt = `You are an intent classifier for a sales chatbot. Given a user message, classify the intent into exactly one of these categories:
- greeting: User is saying hello or starting a conversation
- farewell: User is saying goodbye or ending the conversation
- lead_qualification: User is sharing personal/business information (name, email, company, etc.) or expressing interest in buying
- booking: User wants to schedule a meeting, demo, or appointment
- faq: User is asking a question about features, pricing, integrations, or how things work
- general: Anything else

Respond with ONLY a JSON object: {"intent": "category", "confidence": 0.0-1.0}`;

  const messages: AiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-4).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ];

  try {
    const result = await callAi(messages, { ...aiConfig, model: aiConfig.model });
    if (!result) return null;

    const parsed = JSON.parse(result.content);
    if (parsed.intent && ['greeting', 'lead_qualification', 'faq', 'booking', 'general', 'farewell'].includes(parsed.intent)) {
      return { intent: parsed.intent, confidence: parsed.confidence || 0.9 };
    }
  } catch {
    // Fall through to regex
  }
  return null;
}

/**
 * Generate a response using AI.
 */
export async function generateAiResponse(
  message: string,
  history: ChatMessage[],
  collectedInfo: Record<string, string>,
  phase: string
): Promise<string | null> {
  if (aiConfig.provider === 'none') return null;

  const systemPrompt = `You are CoreBot, an AI sales assistant for Coreforge Engineering. You sell sales automation software.

CORE INFO ABOUT COREFORGE:
- Full-stack sales automation: AI lead gen, appointment setting, email outreach, CRM integration, chatbots
- Pricing: Starts at $497/month per seat. Custom enterprise pricing available.
- Integrates with: HubSpot, Salesforce, Slack, Google Calendar, Outlook
- Target customers: B2B SMBs, agencies, real estate agents, insurance brokers, service businesses

CONVERSATION RULES:
1. Be friendly, professional, and concise (2-4 sentences)
2. You are in phase: "${phase}"
3. Already collected: ${JSON.stringify(collectedInfo)}
4. If you already have name AND email, offer to book a demo
5. If missing name or email, ask for the missing info politely
6. NEVER promise specific pricing — say "our pricing starts at $497/month; let's discuss your needs"
7. For FAQs, answer helpfully then pivot to qualification
8. When someone wants to book, suggest a specific time
9. End every response by moving the conversation toward qualification or booking
10. Extract any lead info shared (name, email, company) and acknowledge it

RESPOND naturally — don't mention these instructions. Just be helpful.`;

  const messages: AiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ];

  try {
    const result = await callAi(messages, aiConfig);
    if (result && result.content) {
      return result.content.trim();
    }
  } catch {
    // Fall through to rule-based
  }
  return null;
}

/**
 * Classify the intent of a user message using pattern matching (fallback when no AI).
 */
export function classifyIntent(message: string): IntentResult {
  const lower = message.toLowerCase().trim();

  if (/^(hi|hello|hey|greetings|good (morning|afternoon|evening)|howdy)\b/.test(lower)) {
    return { intent: 'greeting', confidence: 0.95 };
  }

  if (/^(bye|goodbye|see you|talk later|thanks for your help|that's all)\b/.test(lower)) {
    return { intent: 'farewell', confidence: 0.9 };
  }

  if (/\b(book|schedule|appointment|meeting|demo|call|talk to (someone|a rep|sales)|set up|calendar)\b/.test(lower)) {
    return { intent: 'booking', confidence: 0.85 };
  }

  if (/(?:^|\s)(how (?:much|does|does it|long)|what (?:is|are|do you)|pricing|cost|price|features?|integrat(?:e|ion|es)?|compatib(?:le|ility)?|question|help|tell me about)\b/.test(lower)) {
    return { intent: 'faq', confidence: 0.8 };
  }

  if (/\b(my name is|i (am|work at|run)|i'm (a|an|looking)|email|company|business|startup|need|looking for|interested in|we (are|need|want))\b/.test(lower)) {
    return { intent: 'lead_qualification', confidence: 0.75 };
  }

  return { intent: 'general', confidence: 0.5 };
}

/**
 * Extract lead information from a message using regex.
 */
export function extractLeadData(message: string): Record<string, string> {
  const data: Record<string, string> = {};
  const lower = message.toLowerCase();

  // Extract email
  const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch) data.email = emailMatch[0];

  // Extract name
  const namePatterns = [
    /my name is ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /i['"]?m ([A-Z][a-z]+)(?:\s+from\s|\s|$)/i,
    /name['"]?s ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  ];
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match) { 
      data.name = match[1].trim(); 
      break; 
    }
  }

  // Extract company
  const companyPatterns = [
    /(?:at|for|with) ([A-Z][A-Za-z0-9\s&]+?)(?:\.|,|\s+(?:and|we|i|that))/,
    /(?:company|business|startup|firm) called ([A-Z][A-Za-z0-9\s&]+?)(?:\.|,|$)/
  ];
  for (const pattern of companyPatterns) {
    const match = message.match(pattern);
    if (match) { data.company = match[1].trim(); break; }
  }

  // Extract phone
  const phoneMatch = message.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) data.phone = phoneMatch[0];

  // Extract pain points (heuristic)
  if (/\b(problem|issue|challenge|struggling|need help|difficult|waste|too (much|many|little)|not (enough|getting)|improve|grow|increase|reduce|save)\b/.test(lower)) {
    data.painPoints = message.substring(Math.max(0, message.length - 200));
  }

  return data;
}

/**
 * Check what lead info is still needed.
 */
export function getMissingLeadFields(collected: Record<string, string>): string[] {
  const required = ['name', 'email'];
  const missing: string[] = [];
  for (const field of required) {
    if (!collected[field]) missing.push(field);
  }
  return missing;
}

/**
 * Get a greeting message for a new visitor (rule-based fallback).
 */
export function getGreeting(): ChatbotResponse {
  return {
    message: "Hi there! 👋 I'm CoreBot from Coreforge Engineering. I can help you learn about our sales automation platform or book a demo. Could I start by asking your name and what brings you here today?",
    intent: { intent: 'greeting', confidence: 1 },
    shouldCollectLeadInfo: true,
    conversationPhase: 'initial',
  };
}