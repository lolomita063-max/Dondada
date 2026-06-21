/**
 * Chatbot Engine — Intent classification, lead qualification, FAQ, and booking logic.
 * Works with either OpenAI or Anthropic APIs.
 */

const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const AI_MODEL = process.env.AI_MODEL || (AI_PROVIDER === 'anthropic' ? 'claude-3-haiku-20240307' : 'gpt-4o-mini');

const AI_API_BASE = AI_PROVIDER === 'anthropic'
  ? 'https://api.anthropic.com/v1'
  : 'https://api.openai.com/v1';

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
 * Classify the intent of a user message using pattern matching (no API call needed for basic classification).
 */
export function classifyIntent(message: string): IntentResult {
  const lower = message.toLowerCase().trim();

  // Greeting patterns
  if (/^(hi|hello|hey|greetings|good (morning|afternoon|evening)|howdy)\b/.test(lower)) {
    return { intent: 'greeting', confidence: 0.95 };
  }

  // Farewell patterns
  if (/^(bye|goodbye|see you|talk later|thanks for your help|that's all)\b/.test(lower)) {
    return { intent: 'farewell', confidence: 0.9 };
  }

  // Booking patterns
  if (/\b(book|schedule|appointment|meeting|demo|call|talk to (someone|a rep|sales)|set up|calendar)\b/.test(lower)) {
    return { intent: 'booking', confidence: 0.85 };
  }

  // FAQ patterns
  if (/(?:^|\s)(how (?:much|does|does it|long)|what (?:is|are|do you)|pricing|cost|price|features?|integrat(?:e|ion|es)?|compatib(?:le|ility)?|question|help|tell me about)\b/.test(lower)) {
    return { intent: 'faq', confidence: 0.8 };
  }

  // Lead qualification patterns (giving personal/business info)
  if (/\b(my name is|i (am|work at|run)|i'm (a|an|looking)|email|company|business|startup|need|looking for|interested in|we (are|need|want))\b/.test(lower)) {
    return { intent: 'lead_qualification', confidence: 0.75 };
  }

  return { intent: 'general', confidence: 0.5 };
}

/**
 * Extract lead information from a message.
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

  // Extract pain points (heuristic: look for problem-describing phrases)
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
 * Generate the system prompt for the AI.
 */
export function getSystemPrompt(): string {
  return `You are CoreBot, an AI sales assistant for Coreforge Engineering. Your job is to qualify leads, answer questions, and book appointments.

CORE RULES:
1. Be friendly, professional, and concise.
2. QUALIFY LEADS: Collect name, email, company, and pain points.
3. If you have all required info, offer to book a demo/appointment.
4. For FAQ questions, answer helpfully and then pivot to qualification.
5. NEVER promise specific pricing — say "our pricing depends on your needs; let's schedule a quick call to discuss."
6. NEVER share internal implementation details.
7. Keep responses under 3-4 sentences unless the user asks for more detail.
8. At the end, always move toward booking a demo or collecting contact info.

LEAD QUALIFICATION FLOW:
- Greet → Ask for name and what brings them
- Collect email and company info
- Understand pain points
- Offer to book a demo call
- Thank and confirm`;
}

/**
 * Build the conversation context from message history.
 */
export function buildContext(messages: ChatMessage[]): ChatMessage[] {
  const systemPrompt = getSystemPrompt();
  return [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-10), // Keep last 10 messages for context
  ];
}

/**
 * Get a greeting message for a new visitor.
 */
export function getGreeting(): ChatbotResponse {
  return {
    message: "Hi there! 👋 I'm CoreBot from Coreforge Engineering. I can help you learn about our sales automation platform or book a demo. Could I start by asking your name and what brings you here today?",
    intent: { intent: 'greeting', confidence: 1 },
    shouldCollectLeadInfo: true,
    conversationPhase: 'initial',
  };
}
