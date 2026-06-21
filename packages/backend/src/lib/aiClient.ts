/**
 * AI Client — OpenAI and Anthropic API integration.
 * Falls back to rule-based responses when no API key is configured.
 */

export interface AiConfig {
  provider: 'openai' | 'anthropic' | 'none';
  model: string;
  apiKey: string;
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiResponse {
  content: string;
  model: string;
  provider: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

/**
 * Load AI configuration from environment variables.
 */
export function loadAiConfig(): AiConfig {
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

  if (openaiKey && provider === 'openai') {
    return {
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      apiKey: openaiKey,
    };
  }

  if (anthropicKey && provider === 'anthropic') {
    return {
      provider: 'anthropic',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
      apiKey: anthropicKey,
    };
  }

  // Also check generic AI_API_KEY
  const genericKey = process.env.AI_API_KEY || '';
  if (genericKey) {
    return {
      provider: provider as 'openai' | 'anthropic',
      model: process.env.AI_MODEL || (provider === 'anthropic' ? 'claude-3-haiku-20240307' : 'gpt-4o-mini'),
      apiKey: genericKey,
    };
  }

  return { provider: 'none', model: '', apiKey: '' };
}

/**
 * Send messages to the configured AI provider and get a response.
 * Returns null if no API key is configured.
 */
export async function callAi(
  messages: AiMessage[],
  config: AiConfig
): Promise<AiResponse | null> {
  if (config.provider === 'none' || !config.apiKey) {
    return null;
  }

  try {
    if (config.provider === 'anthropic') {
      return await callAnthropic(messages, config);
    }
    return await callOpenAI(messages, config);
  } catch (error: any) {
    console.error(`[AI Client] ${config.provider} API error:`, error?.message || error);
    return null;
  }
}

/**
 * Call OpenAI Chat Completions API.
 */
async function callOpenAI(
  messages: AiMessage[],
  config: AiConfig
): Promise<AiResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${error}`);
  }

  const data = await response.json() as any;
  return {
    content: data.choices[0]?.message?.content || '',
    model: data.model || config.model,
    provider: 'openai',
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

/**
 * Call Anthropic Messages API.
 */
async function callAnthropic(
  messages: AiMessage[],
  config: AiConfig
): Promise<AiResponse> {
  // Anthropic uses a different format — extract system prompt separately
  const systemMsg = messages.find(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user' as const,
    content: m.content,
  }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      system: systemMsg?.content || '',
      messages: nonSystemMessages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${error}`);
  }

  const data = await response.json() as any;
  return {
    content: data.content?.[0]?.text || '',
    model: data.model || config.model,
    provider: 'anthropic',
    usage: data.usage ? {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    } : undefined,
  };
}

/**
 * Get a simple test to verify the AI connection is working.
 */
export async function testAiConnection(config: AiConfig): Promise<{ ok: boolean; message: string }> {
  if (config.provider === 'none') {
    return { ok: false, message: 'No AI API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.' };
  }

  const result = await callAi(
    [{ role: 'user', content: 'Reply with just the word: connected' }],
    config
  );

  if (!result) {
    return { ok: false, message: 'AI API call failed.' };
  }

  return { ok: true, message: `Connected to ${config.provider} (${config.model})` };
}