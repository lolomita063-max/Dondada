const http = require('http');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];

  // API proxy - forward to backend (or use mock if unavailable)
  if (url.startsWith('/api/')) {
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path: url,
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      let body = '';
      proxyRes.on('data', (chunk) => (body += chunk));
      proxyRes.on('end', () => {
        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(body);
      });
    });
    proxyReq.on('error', () => {
      // Mock responses when backend not available
      if (url === '/api/v1/chatbot/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: { status: 'ok' } }));
      } else if (url === '/api/v1/chatbot/start') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: { sessionId: 'demo_123', message: '👋 Welcome! I\'m your AI assistant. What\'s your name?' } }));
      } else if (url === '/api/v1/chatbot/message') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const { message } = JSON.parse(body || '{}');
          const responses = [
            "Great! Let me ask a few questions to understand your needs better.",
            "Thanks for sharing! What industry are you in?",
            "Excellent! How many leads are you looking to generate per month?",
            "Perfect. Our AI Chatbot Pro at $497/mo could be a great fit for your needs.",
            "Would you like to book a demo to see it in action?",
          ];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: { message: responses[Math.floor(Math.random() * responses.length)] } }));
        });
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: null }));
      }
    });
    if (req.method === 'POST') {
      req.pipe(proxyReq);
    } else {
      proxyReq.end();
    }
    return;
  }

  // Serve static files
  if (url === '/') url = '/index.html';

  const filePath = path.join(PUBLIC_DIR, url);

  // Security: only serve files within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath);
    const isHtml = ext === '.html';
    const cacheControl = isHtml
      ? 'no-cache, must-revalidate'
      : 'public, max-age=31536000, immutable';
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Landing page server running at http://${HOST}:${PORT}`);
  console.log(`Serving files from: ${PUBLIC_DIR}`);
});
