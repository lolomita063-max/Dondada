import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { getDb, runMigrations, closeDb } from './db/connection.js';
import { errorHandler } from './middleware/error-handler.js';
import { registerCemeteryRoutes } from './modules/cemeteries/cemetery.routes.js';
import { registerReviewRoutes } from './modules/reviews/review.routes.js';
import { registerGeocodeRoutes } from './modules/geocode/geocode.routes.js';
import { registerChatbotRoutes } from './routes/chatbot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function buildApp() {
  const app = Fastify({
    logger: { level: config.logLevel },
  });

  // Register plugins
  app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  // Serve landing page static files (including chatbot widget bundle)
  app.register(fastifyStatic, {
    root: path.join(__dirname, '..', '..', '..', 'packages', 'landing-page', 'public'),
    prefix: '/',
    wildcard: false,
  });

  // Set error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/api/v1/health', async () => {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
  });

  // Register route modules
  registerCemeteryRoutes(app);
  registerReviewRoutes(app);
  registerGeocodeRoutes(app);
  registerChatbotRoutes(app);

  return app;
}

export async function start() {
  // Initialize database and run migrations
  runMigrations();

  const app = buildApp();

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`Server running at http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    await app.close();
    closeDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Run only if this is the main module
start();