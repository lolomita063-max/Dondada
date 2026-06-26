#!/usr/bin/env node
/**
 * Coreforge Bot Monitor — auto-restart on crash.
 * Run alongside the server: node monitor.js
 * The server sends keepalive pings; if they stop, we restart.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_SCRIPT = path.join(__dirname, 'src/index.ts');
const LOG_FILE = '/tmp/chatbot-server.log';
const MAX_RESTARTS = 10;
const RESTART_WINDOW_MS = 60_000; // 1 minute window for counting restarts

let restartCount = 0;
let firstRestartTime = 0;

function startServer(): void {
  const child = spawn('node', ['--import', 'tsx', SERVER_SCRIPT], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, MONITOR_PID: String(process.pid) },
  });

  const logStream = require('fs').createWriteStream(LOG_FILE, { flags: 'a' });
  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);

  child.on('exit', (code, signal) => {
    const now = Date.now();

    // Reset counter if last restart was outside the window
    if (now - firstRestartTime > RESTART_WINDOW_MS) {
      restartCount = 0;
      firstRestartTime = now;
    }

    restartCount++;
    if (restartCount === 1) firstRestartTime = now;

    console.error(`⚠️  Server exited (code=${code}, signal=${signal}). Restart ${restartCount}/${MAX_RESTARTS}`);

    if (restartCount >= MAX_RESTARTS) {
      console.error('💥 Too many restarts. Giving up.');
      process.exit(1);
    }

    // Wait 1 second then restart
    setTimeout(startServer, 1000);
  });

  console.log(`✅ Monitor active (PID ${process.pid}). Server PID: ${child.pid}`);
}

startServer();