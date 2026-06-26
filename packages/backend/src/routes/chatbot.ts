import { FastifyInstance } from 'fastify';
import { processMessage, startSession, getAnalyticsSummary } from '../services/conversationService.js';
import { isAiEnabled, getAiConfig, refreshAiConfig } from '../services/chatbotEngine.js';
import { getDb } from '../lib/database.js';

export function registerChatbotRoutes(app: FastifyInstance): void {
  // Health check
  app.get('/api/v1/chatbot/health', async () => {
    return {
      success: true,
      data: {
        status: 'ok',
        version: '1.0.0',
        ai: isAiEnabled() ? getAiConfig().provider : 'fallback-rules',
        timestamp: new Date().toISOString(),
      },
    };
  });

  // AI status
  app.get('/api/v1/chatbot/ai-status', async () => {
    return {
      success: true,
      data: {
        enabled: isAiEnabled(),
        provider: isAiEnabled() ? getAiConfig().provider : 'none',
        model: isAiEnabled() ? getAiConfig().model : 'rule-based-fallback',
      },
    };
  });

  // Start a new chat session
  app.post<{
    Body: { source?: string };
  }>('/api/v1/chatbot/start', async (request, reply) => {
    const { source = 'widget' } = request.body || {};
    const sessionId = request.headers['x-session-id'] as string || 
                      `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const response = startSession(sessionId, source);

    reply.header('x-session-id', sessionId);
    return {
      success: true,
      data: {
        sessionId,
        ...response,
      },
    };
  });

  // Send a message (async — may call AI APIs)
  app.post<{
    Body: { message: string; sessionId?: string };
  }>('/api/v1/chatbot/message', async (request, reply) => {
    const { message, sessionId: bodySessionId } = request.body || {};
    
    if (!message || message.trim().length === 0) {
      return reply.code(400).send({
        success: false,
        error: 'Message is required',
      });
    }

    const sessionId = bodySessionId || 
                      (request.headers['x-session-id'] as string) ||
                      `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const response = await processMessage(sessionId, message);

    reply.header('x-session-id', sessionId);
    return {
      success: true,
      data: {
        sessionId,
        ...response,
      },
    };
  });

  // Get analytics summary
  app.get('/api/v1/chatbot/analytics', async () => {
    const analytics = getAnalyticsSummary();
    return {
      success: true,
      data: analytics,
    };
  });

  // Get conversation logs (last 50 conversations with messages)
  app.get('/api/v1/chatbot/logs', async (request) => {
    const db = getDb();
    const limit = Math.min(parseInt((request.query as any)?.limit || '50'), 200);
    
    const conversations = db.prepare(`
      SELECT c.id, c.session_id, c.visitor_name, c.visitor_email, c.visitor_company,
             c.qualified, c.intent, c.source, c.created_at
      FROM conversations c
      ORDER BY c.created_at DESC
      LIMIT ?
    `).all(limit) as any[];

    const logs = conversations.map((conv: any) => {
      const messages = db.prepare(`
        SELECT role, content, created_at FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
      `).all(conv.id);

      return {
        sessionId: conv.session_id,
        visitor: { name: conv.visitor_name, email: conv.visitor_email, company: conv.visitor_company },
        qualified: !!conv.qualified,
        intent: conv.intent,
        source: conv.source,
        createdAt: conv.created_at,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content?.slice(0, 200), at: m.created_at })),
        messageCount: (messages as any[]).length,
      };
    });

    return { success: true, data: { total: conversations.length, logs } };
  });
}