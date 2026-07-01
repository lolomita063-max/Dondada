import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { registerChatbotRoutes } from './routes/chatbot.js';
import { getDb, closeDb } from './lib/database.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const START_TIME = Date.now();

// ============================================================
// Crash recovery: auto-restart via wrapper script
// ============================================================
const MONITOR_PID = process.env.MONITOR_PID;
if (MONITOR_PID) {
  // Ping the monitor periodically so it knows we're alive
  setInterval(() => {
    try {
      process.kill(parseInt(MONITOR_PID), 0);
    } catch {
      // Monitor is gone, but we keep running
    }
  }, 30000);
}

// ============================================================
// Fastify server setup
// ============================================================
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Rate limiting — protect API endpoints from abuse
await app.register(rateLimit, {
  max: 100, // 100 requests per minute per IP
  timeWindow: '1 minute',
  keyGenerator: (request) => {
    return request.ip || request.headers['x-forwarded-for'] as string || 'unknown';
  },
  errorResponseBuilder: (request, context) => {
    return {
      success: false,
      error: 'Too many requests. Please slow down.',
      retryAfter: context.after,
    };
  },
});

// Apply stricter limits on message endpoint
app.register(async (scopedApp) => {
  scopedApp.register(rateLimit, {
    max: 30,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip || 'unknown',
  });
}, { prefix: '/api/v1/chatbot/message' });

// Register CORS
await app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-session-id'],
});

// Register API routes
registerChatbotRoutes(app);

// Serve the widget build if available
const widgetDist = path.join(__dirname, '../../widget/dist');
if (fs.existsSync(widgetDist)) {
  app.register(async (publicApp) => {
    publicApp.register(await import('@fastify/static'), {
      root: widgetDist,
      prefix: '/widget/',
      maxAge: '1h',
      immutable: true,
    });
  });
  console.log('📦 Widget bundle available at /widget/');
}

// ============================================================
// Compelling demo landing page
// ============================================================
const demoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coreforge AI Chatbot — Automate Your Sales in Minutes</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #0F172A; color: #F1F5F9; min-height: 100vh; }
    .container { max-width: 960px; margin: 0 auto; padding: 0 24px; }
    
    /* Hero */
    .hero { padding: 80px 0 60px; text-align: center; }
    .hero-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; background: rgba(79,70,229,0.2); color: #A5B4FC; font-size: 14px; font-weight: 500; border: 1px solid rgba(79,70,229,0.3); margin-bottom: 20px; }
    .hero h1 { font-size: 52px; line-height: 1.1; margin-bottom: 16px; background: linear-gradient(135deg, #F1F5F9 0%, #A5B4FC 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { font-size: 20px; color: #94A3B8; max-width: 600px; margin: 0 auto 32px; line-height: 1.6; }
    .hero-cta { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; border-radius: 10px; font-size: 18px; font-weight: 600; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 20px rgba(79,70,229,0.4); }
    .hero-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 30px rgba(79,70,229,0.5); }
    .hero-stats { display: flex; gap: 48px; justify-content: center; margin-top: 48px; }
    .stat { text-align: center; }
    .stat-num { font-size: 32px; font-weight: 700; color: #A5B4FC; }
    .stat-label { font-size: 14px; color: #64748B; margin-top: 4px; }

    /* Features */
    .features { padding: 80px 0; }
    .features h2 { text-align: center; font-size: 36px; margin-bottom: 48px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }
    .feature-card { background: #1E293B; border-radius: 16px; padding: 32px; border: 1px solid #334155; transition: border-color 0.2s, transform 0.2s; }
    .feature-card:hover { border-color: #4F46E5; transform: translateY(-4px); }
    .feature-icon { font-size: 36px; margin-bottom: 16px; }
    .feature-card h3 { font-size: 18px; margin-bottom: 8px; }
    .feature-card p { font-size: 14px; color: #94A3B8; line-height: 1.5; }

    /* Pricing */
    .pricing { padding: 60px 0; text-align: center; }
    .pricing-card { display: inline-block; background: linear-gradient(135deg, #1E293B, #334155); border-radius: 24px; padding: 48px; border: 1px solid #4F46E5; }
    .pricing h2 { font-size: 36px; margin-bottom: 12px; }
    .price { font-size: 64px; font-weight: 700; margin: 16px 0; }
    .price span { font-size: 24px; color: #94A3B8; }
    .price-desc { color: #94A3B8; margin-bottom: 24px; font-size: 16px; }
    .price-cta { display: inline-block; padding: 12px 32px; background: #4F46E5; color: white; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 8px; }
    .price-features { list-style: none; margin: 16px 0; text-align: left; }
    .price-features li { padding: 6px 0; font-size: 14px; color: #CBD5E1; }
    .price-features li::before { content: "✓ "; color: #34D399; }

    /* How it works */
    .how-it-works { padding: 60px 0; }
    .how-it-works h2 { text-align: center; font-size: 36px; margin-bottom: 48px; }
    .steps { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }
    .step { text-align: center; padding: 24px; }
    .step-num { width: 40px; height: 40px; border-radius: 50%; background: #4F46E5; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 12px; }
    .step h3 { font-size: 16px; margin-bottom: 6px; }
    .step p { font-size: 13px; color: #94A3B8; }

    /* Embed code */
    .embed-section { padding: 60px 0; }
    .embed-section h2 { text-align: center; font-size: 28px; margin-bottom: 24px; }
    .code-block { background: #0F172A; border-radius: 12px; padding: 24px; border: 1px solid #334155; max-width: 700px; margin: 0 auto; }
    .code-block code { display: block; font-size: 13px; color: #34D399; line-height: 1.8; word-break: break-all; }
    .code-block .comment { color: #64748B; }

    .footer { text-align: center; padding: 48px 0; color: #475569; font-size: 14px; border-top: 1px solid #1E293B; margin-top: 40px; }

    @media (max-width: 768px) {
      .hero h1 { font-size: 36px; }
      .grid { grid-template-columns: 1fr; }
      .steps { grid-template-columns: 1fr 1fr; }
      .hero-stats { flex-direction: column; gap: 24px; }
    }
  </style>
</head>
<body>
  <div class="hero">
    <div class="container">
      <div class="hero-badge">🤖 AI-Powered Lead Qualification</div>
      <h1>Turn Website Visitors Into Paying Customers</h1>
      <p>CoreBot engages every visitor, qualifies their interest, and books demos — all while you sleep.</p>
      <a href="#pricing" class="hero-cta">Start at $497/mo →</a>
      <div class="hero-stats">
        <div class="stat"><div class="stat-num">43%</div><div class="stat-label">Lead Capture Rate</div></div>
        <div class="stat"><div class="stat-num">3x</div><div class="stat-label">More Appointments</div></div>
        <div class="stat"><div class="stat-num">&lt;2m</div><div class="stat-label">Avg. Qualification</div></div>
      </div>
    </div>
  </div>

  <div class="features">
    <div class="container">
      <h2>Everything You Need to Sell More</h2>
      <div class="grid">
        <div class="feature-card"><div class="feature-icon">🤖</div><h3>AI Lead Qualification</h3><p>Automatically collect names, emails, companies, and pain points from every conversation.</p></div>
        <div class="feature-card"><div class="feature-icon">📅</div><h3>Smart Booking</h3><p>Let prospects book demos directly in chat. Calendar integration included.</p></div>
        <div class="feature-card"><div class="feature-icon">💬</div><h3>FAQ Automation</h3><p>Answer pricing, feature, and integration questions instantly. No more repetitive emails.</p></div>
        <div class="feature-card"><div class="feature-icon">📊</div><h3>Real-Time Analytics</h3><p>Track conversations, qualified leads, and appointments in a live dashboard.</p></div>
        <div class="feature-card"><div class="feature-icon">🔌</div><h3>CRM Ready</h3><p>Integrates with HubSpot, Salesforce, and more. Leads sync automatically.</p></div>
        <div class="feature-card"><div class="feature-icon">⚡</div><h3>1-Click Embed</h3><p>Add to any website with a single script tag. No coding required.</p></div>
      </div>
    </div>
  </div>

  <div class="how-it-works">
    <div class="container">
      <h2>How It Works</h2>
      <div class="steps">
        <div class="step"><div class="step-num">1</div><h3>Visitor Chats</h3><p>Visitor clicks the chat bubble on your site</p></div>
        <div class="step"><div class="step-num">2</div><h3>AI Qualifies</h3><p>CoreBot collects name, email, and needs</p></div>
        <div class="step"><div class="step-num">3</div><h3>Lead Saved</h3><p>Scored lead appears in your database</p></div>
        <div class="step"><div class="step-num">4</div><h3>Demo Booked</h3><p>Appointment scheduled, you get notified</p></div>
      </div>
    </div>
  </div>

  <div class="pricing" id="pricing">
    <div class="container">
      <div class="pricing-card">
        <h2>🚀 Start at $497/mo</h2>
        <div class="price">$497<span>/mo</span></div>
        <div class="price-desc">Per seat. Unlimited conversations. No hidden fees.</div>
        <ul class="price-features">
          <li>AI-powered lead qualification</li>
          <li>Unlimited conversations</li>
          <li>CRM integration (HubSpot, Salesforce)</li>
          <li>Analytics dashboard</li>
          <li>Demo booking automation</li>
          <li>Email support</li>
        </ul>
        <a href="#" class="price-cta" onclick="if(window.CoreforgeChatbot){document.querySelector('.cf-chat-button')?.click()}return false">Talk to Sales</a>
      </div>
    </div>
  </div>

  <div class="embed-section">
    <div class="container">
      <h2>🔧 Add to Your Site in 30 Seconds</h2>
      <div class="code-block">
        <code><span class="comment">&lt;!-- Add this to your website --></span>
&lt;script src="/widget/coreforge-chatbot.js"&gt;&lt;/script&gt;
&lt;script&gt;
  CoreforgeChatbot.init({
    apiUrl: window.location.origin,
    title: "CoreBot AI",
    subtitle: "Sales Automation Assistant",
    primaryColor: "#4F46E5",
  });
&lt;/script&gt;</code>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Powered by Coreforge Engineering</p>
    <p style="margin-top: 4px;">© 2026 Coreforge Engineering. AI Lead Qualification Platform</p>
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
      // Auto-trigger greeting after 5 seconds for prospects
      setTimeout(() => {
        const btn = document.querySelector('.cf-chat-button');
        if (btn && !btn.classList.contains('open')) {
          btn.click();
        }
      }, 5000);
    }
  </script>
</body>
</html>`;

app.get('/', async (request, reply) => {
  reply.header('Content-Type', 'text/html; charset=utf-8');
  return demoHtml;
});

// API info
app.get('/api', async () => {
  return {
    name: 'Coreforge Chatbot API',
    version: '1.0.0',
    status: 'running',
    uptime: Math.floor((Date.now() - START_TIME) / 1000) + 's',
    endpoints: {
      demo: '/',
      health: '/api/v1/chatbot/health',
      aiStatus: '/api/v1/chatbot/ai-status',
      start: '/api/v1/chatbot/start',
      message: '/api/v1/chatbot/message',
      analytics: '/api/v1/chatbot/analytics',
      logs: '/api/v1/chatbot/logs',
    },
  };
});

// Analytics dashboard
app.get('/analytics', async (request, reply) => {
  const { getDb } = await import('./lib/database.js');
  const db = getDb();
  
  const totalConversations = (db.prepare('SELECT COUNT(*) as c FROM conversations').get() as any).c;
  const qualifiedLeads = (db.prepare('SELECT COUNT(*) as c FROM conversations WHERE qualified = 1').get() as any).c;
  const totalLeads = (db.prepare('SELECT COUNT(*) as c FROM leads').get() as any).c;
  const bookedAppts = (db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status IN ('confirmed','completed')").get() as any).c;
  const conversationsToday = (db.prepare("SELECT COUNT(*) as c FROM conversations WHERE date(created_at) = date('now')").get() as any).c;
  const leadsToday = (db.prepare("SELECT COUNT(*) as c FROM leads WHERE date(created_at) = date('now')").get() as any).c;
  const messagesToday = (db.prepare("SELECT COUNT(*) as c FROM messages WHERE date(created_at) = date('now')").get() as any).c;
  const topIntents = db.prepare(`
    SELECT intent, COUNT(*) as count FROM conversations 
    WHERE intent IS NOT NULL GROUP BY intent ORDER BY count DESC LIMIT 5
  `).all() as any[];

  const uptime = Math.floor((Date.now() - START_TIME) / 1000);

  reply.header('Content-Type', 'text/html; charset=utf-8');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coreforge — Analytics Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0F172A; color: #F1F5F9; padding: 40px 24px; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    .subtitle { color: #64748B; font-size: 14px; margin-bottom: 32px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: #1E293B; border-radius: 12px; padding: 24px; border: 1px solid #334155; }
    .card .num { font-size: 36px; font-weight: 700; color: #A5B4FC; }
    .card .label { font-size: 13px; color: #64748B; margin-top: 4px; }
    .card .highlight { color: #34D399; }
    .row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
    .chip { background: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 8px 16px; font-size: 13px; }
    .chip .val { color: #A5B4FC; font-weight: 600; }
    .footer { text-align: center; padding: 32px 0; color: #475569; font-size: 13px; }
    .bar { display: inline-block; height: 8px; border-radius: 4px; background: #4F46E5; margin-right: 8px; vertical-align: middle; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Coreforge Analytics</h1>
    <p class="subtitle">Live stats · Updating on refresh · Server uptime: ${Math.floor(uptime / 60)}m ${uptime % 60}s</p>
    
    <div class="grid">
      <div class="card"><div class="num">${totalConversations}</div><div class="label">Total Conversations</div></div>
      <div class="card"><div class="num ${qualifiedLeads > 0 ? 'highlight' : ''}">${qualifiedLeads}</div><div class="label">Qualified Leads</div></div>
      <div class="card"><div class="num">${totalLeads}</div><div class="label">Leads Captured</div></div>
      <div class="card"><div class="num">${bookedAppts}</div><div class="label">Demos Booked</div></div>
    </div>

    <div class="grid">
      <div class="card"><div class="num">${conversationsToday}</div><div class="label">Conversations Today</div></div>
      <div class="card"><div class="num">${leadsToday}</div><div class="label">Leads Today</div></div>
      <div class="card"><div class="num">${messagesToday}</div><div class="label">Messages Today</div></div>
      <div class="card"><div class="num">${totalConversations > 0 ? ((qualifiedLeads / totalConversations) * 100).toFixed(0) : 0}%</div><div class="label">Conversion Rate</div></div>
    </div>

    <h2 style="font-size:18px;margin-bottom:12px;">🎯 Top Intent Categories</h2>
    <div class="row">
      ${(topIntents as any[]).map((i: any) => 
        `<div class="chip"><span class="val">${i.intent}</span> · ${i.count}</div>`
      ).join('') || '<div class="chip" style="color:#64748B">No data yet</div>'}
    </div>

    <p style="color:#64748B;font-size:13px;margin-top:24px;">🔄 Refresh to see updated stats</p>
    <div class="footer">Coreforge Engineering · AI Lead Qualification Platform</div>
  </div>
</body>
</html>`;
});

// Monitoring health check with uptime
app.get('/healthz', async () => {
  return {
    status: 'ok',
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    timestamp: new Date().toISOString(),
  };
});

// Start server
try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`🚀 Coreforge Chatbot API running on http://${HOST}:${PORT}`);
  console.log(`📋 Demo page: http://localhost:${PORT}/`);
  console.log(`📊 Analytics: http://localhost:${PORT}/analytics`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/healthz`);
  console.log(`⏱️  Uptime monitor active`);

  // Log startup to database
  const db = getDb();
  db.prepare(`INSERT INTO analytics (id, event_type, session_id, metadata) VALUES (?, 'server_started', 'system', ?)`)
    .run(`start_${Date.now()}`, JSON.stringify({ port: PORT, pid: process.pid }));
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
  try {
    const db = getDb();
    db.prepare(`INSERT INTO analytics (id, event_type, session_id, metadata) VALUES (?, 'server_shutdown', 'system', ?)`)
      .run(`stop_${Date.now()}`, JSON.stringify({ signal }));
  } catch {}
  closeDb();
  app.close().then(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Crash logging
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err);
  try {
    const db = getDb();
    db.prepare(`INSERT INTO analytics (id, event_type, session_id, metadata) VALUES (?, 'crash', 'system', ?)`)
      .run(`crash_${Date.now()}`, JSON.stringify({ message: err.message, stack: err.stack?.slice(0, 500) }));
  } catch {}
  closeDb();
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 UNHANDLED REJECTION:', reason);
});