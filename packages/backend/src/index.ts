import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerChatbotRoutes } from './routes/chatbot.js';
import { getDb, closeDb } from './lib/database.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register CORS
await app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-session-id'],
});

// Initialize database on startup
getDb();

// Register routes
registerChatbotRoutes(app);

// Root endpoint — simple health/info
app.get('/', async () => {
  return {
    name: 'Coreforge Chatbot API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/v1/chatbot/health',
      start: '/api/v1/chatbot/start',
      message: '/api/v1/chatbot/message',
      analytics: '/api/v1/chatbot/analytics',
    },
  };
});

// Start server
try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`🚀 Coreforge Chatbot API running on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  closeDb();
  await app.close();
});

process.on('SIGINT', async () => {
  closeDb();
  await app.close();
  process.exit(0);
});
