import { FastifyInstance } from 'fastify';
import { processMessage, startSession, getAnalyticsSummary } from '../services/conversationService.js';

export function registerChatbotRoutes(app: FastifyInstance): void {
  // Health check
  app.get('/api/v1/chatbot/health', async () => {
    return {
      success: true,
      data: {
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
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

  // Send a message
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

    const response = processMessage(sessionId, message);

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
}
