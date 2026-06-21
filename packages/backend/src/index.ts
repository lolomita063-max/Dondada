import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerChatbotRoutes } from './routes/chatbot.js';
import { getDb, closeDb } from './lib/database.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

// Register API routes
registerChatbotRoutes(app);

// Serve the widget build if available
const widgetDist = path.join(__dirname, '../../widget/dist');
if (fs.existsSync(widgetDist)) {
  app.register(async (publicApp) => {
    publicApp.register(await import('@fastify/static'), {
      root: widgetDist,
      prefix: '/widget/',
    });
  });
  console.log('📦 Widget bundle available at /widget/');
}

// Demo page
const demoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coreforge AI Chatbot — Live Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); min-height: 100vh; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 48px; margin-bottom: 8px; }
    h1 { font-size: 36px; color: #111827; margin-bottom: 8px; }
    .subtitle { font-size: 18px; color: #6B7280; }
    .badge { display: inline-block; padding: 4px 16px; border-radius: 20px; background: #4F46E5; color: white; font-size: 14px; font-weight: 500; margin-bottom: 16px; }
    .demo-card { background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden; margin-bottom: 32px; }
    .demo-content { padding: 40px; text-align: center; }
    .demo-content h2 { font-size: 24px; color: #111827; margin-bottom: 12px; }
    .demo-content p { color: #6B7280; line-height: 1.6; margin-bottom: 8px; }
    .features { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 32px 0; }
    .feature { padding: 20px; background: #F9FAFB; border-radius: 12px; text-align: left; }
    .feature h3 { font-size: 15px; margin-bottom: 4px; color: #111827; }
    .feature p { font-size: 13px; color: #6B7280; margin: 0; }
    .pricing-box { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; border-radius: 12px; padding: 32px; margin: 32px 0; }
    .pricing-box h3 { font-size: 20px; margin-bottom: 8px; }
    .pricing-box .price { font-size: 48px; font-weight: 700; }
    .pricing-box .price span { font-size: 20px; opacity: 0.9; }
    .pricing-box p { opacity: 0.9; }
    .cta { display: inline-block; padding: 12px 32px; background: white; color: #4F46E5; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 16px; }
    .instructions { background: #1F2937; color: #D1D5DB; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: left; }
    .instructions h3 { color: white; margin-bottom: 12px; }
    .instructions code { display: block; padding: 12px; background: #111827; border-radius: 6px; margin: 8px 0; font-size: 13px; color: #34D399; word-break: break-all; }
    .api-status { margin: 24px 0; display: flex; gap: 16px; justify-content: center; }
    .status-item { padding: 8px 16px; background: white; border-radius: 8px; border: 1px solid #E5E7EB; font-size: 14px; }
    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
    .status-dot.green { background: #10B981; }
    .status-dot.yellow { background: #F59E0B; }
    .ai-badge { background: #10B981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .footer { text-align: center; padding: 40px 0; color: #9CA3AF; font-size: 14px; }
    @media (max-width: 640px) { .features { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🤖</div>
      <span class="badge">AI-Powered Lead Qualification</span>
      <h1>Coreforge AI Chatbot</h1>
      <p class="subtitle">Qualify leads, answer FAQs, and book demos — automatically</p>
    </div>

    <div class="api-status">
      <div class="status-item"><span class="status-dot green"></span>API Live</div>
      <div class="status-item"><span class="status-dot ${'yellow'}"></span>AI: Rule-Based</div>
    </div>

    <div class="demo-card">
      <div class="demo-content">
        <h2>👋 Try It Now</h2>
        <p>Click the chat bubble in the bottom-right corner to start a conversation with CoreBot.</p>
        <p>Ask about features, pricing, or share your info to see lead qualification in action!</p>
        
        <div class="features">
          <div class="feature">
            <h3>🤖 Lead Qualification</h3>
            <p>AI conversations that collect name, email, company, and pain points</p>
          </div>
          <div class="feature">
            <h3>📅 Smart Booking</h3>
            <p>Automated demo scheduling with CRM integration</p>
          </div>
          <div class="feature">
            <h3>💬 FAQ & Support</h3>
            <p>Intelligent answers about features, pricing, and integrations</p>
          </div>
          <div class="feature">
            <h3>📊 Analytics</h3>
            <p>Real-time tracking of conversations, leads, and bookings</p>
          </div>
        </div>

        <div class="pricing-box">
          <h3>🚀 Start at $497/month</h3>
          <div class="price">$497<span>/mo</span></div>
          <p>Per-seat pricing • Unlimited conversations • CRM integration • Analytics dashboard</p>
          <a href="#embed" class="cta">Get Started →</a>
        </div>
      </div>
    </div>

    <div class="demo-card" id="embed">
      <div class="demo-content" style="text-align: left;">
        <h2>📦 Embed on Your Site</h2>
        <p style="margin-bottom: 16px;">Add the chatbot to any website with a single script tag:</p>
        
        <div class="instructions">
          <h3>Script Tag Embed</h3>
          <code>&lt;script&gt;
  window.COREFORGE_CHATBOT_CONFIG = {
    apiUrl: "window.location.origin",
    title: "CoreBot AI",
    subtitle: "Sales Automation Assistant",
    primaryColor: "#4F46E5",
  };
&lt;/script&gt;
&lt;script src="/widget/coreforge-chatbot.js"&gt;&lt;/script&gt;</code>
          
          <h3 style="margin-top: 16px;">Or Programmatically</h3>
          <code>&lt;script src="/widget/coreforge-chatbot.js"&gt;&lt;/script&gt;
&lt;script&gt;
  CoreforgeChatbot.init({
    apiUrl: "https://your-api.com",
    title: "CoreBot AI",
    subtitle: "Sales Automation Assistant",
    primaryColor: "#4F46E5",
  });
&lt;/script&gt;</code>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Powered by Coreforge Engineering • AI Lead Qualification Platform</p>
      <p style="margin-top: 4px;">© 2026 Coreforge Engineering. All rights reserved.</p>
    </div>
  </div>

  <script src="/widget/coreforge-chatbot.js"></script>
  <script>
    if (window.CoreforgeChatbot) {
      CoreforgeChatbot.init({
        apiUrl: window.location.origin,
        title: 'CoreBot AI',
        subtitle: 'Lead Qualification Assistant',
        primaryColor: '#4F46E5',
      });
    }
  </script>
</body>
</html>`;

app.get('/demo', async (request, reply) => {
  reply.header('Content-Type', 'text/html; charset=utf-8');
  return demoHtml;
});

// Redirect /demo to root for convenience
app.get('/', async (request, reply) => {
  reply.header('Content-Type', 'text/html; charset=utf-8');
  return demoHtml;
});

// Health check at root for API clients — only if JSON content-type requested
app.get('/api', async () => {
  return {
    name: 'Coreforge Chatbot API',
    version: '1.0.0',
    status: 'running',
    ai: 'rule-based-fallback',
    endpoints: {
      demo: '/demo',
      health: '/api/v1/chatbot/health',
      aiStatus: '/api/v1/chatbot/ai-status',
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
  console.log(`📋 Demo page: http://localhost:${PORT}/demo`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
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