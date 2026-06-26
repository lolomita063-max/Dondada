#!/usr/bin/env node
/**
 * Coreforge Chatbot Stress Test
 * Simulates 50+ concurrent conversations to verify server handles launch traffic.
 * Run: node stress-test.mjs
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

const MESSAGES_POOL = [
  'Hi there! I need sales automation for my business.',
  'My name is Alex Johnson and I run a marketing agency.',
  'My email is alex@agency.com',
  'What are your pricing options?',
  'Can you integrate with HubSpot?',
  'I want to book a demo for next Tuesday.',
  '2pm works for me.',
  'Thanks, that sounds great!',
  'Hello, do you have enterprise options?',
  'Actually, can you tell me more about the features first?',
];

let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let startTime = 0;

async function simulateConversation(id) {
  const sessionId = `stress-test-${id}-${Date.now()}`;
  const msgCount = 3 + Math.floor(Math.random() * 4);
  const messages = MESSAGES_POOL.slice(0, msgCount);

  for (const msg of messages) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
        body: JSON.stringify({ message: msg, sessionId }),
      });
      totalRequests++;
      if (res.ok) {
        successfulRequests++;
      } else {
        failedRequests++;
      }
    } catch (err) {
      totalRequests++;
      failedRequests++;
    }
    // Small random delay between messages (100-300ms to simulate real usage)
    await new Promise(r => setTimeout(r, 100 + Math.random() * 200));
  }
}

async function runStressTest() {
  const concurrentUsers = parseInt(process.env.CONCURRENT_USERS || '50', 10);
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Coreforge Chatbot — Stress Test           ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Target:     ${BASE_URL.padEnd(35)}║`);
  console.log(`║  Concurrent: ${String(concurrentUsers).padEnd(35)}║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // Warm up: check server is alive
  try {
    const health = await fetch(`${BASE_URL}/api/v1/chatbot/health`);
    if (!health.ok) throw new Error('Health check failed');
    const data = await health.json();
    console.log(`✅ Server is alive (AI: ${data.data.ai})`);
  } catch (err) {
    console.error(`❌ Server is not responding at ${BASE_URL}`);
    console.error(`   Make sure the chatbot server is running on port 3000`);
    process.exit(1);
  }

  startTime = Date.now();

  // Launch concurrent conversations
  const promises = [];
  for (let i = 0; i < concurrentUsers; i++) {
    promises.push(simulateConversation(i));
  }

  console.log(`🚀 Launching ${concurrentUsers} concurrent conversations...\n`);

  // Progress indicator
  const progressInterval = setInterval(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stdout.write(`\r   ${totalRequests} requests sent (${successfulRequests} ok, ${failedRequests} failed) — ${elapsed}s elapsed`);
  }, 1000);

  await Promise.all(promises);
  clearInterval(progressInterval);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const successRate = totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(1) : '0';

  console.log('\n');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Stress Test Results                        ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Total Requests:  ${String(totalRequests).padEnd(27)}║`);
  console.log(`║  Successful:      ${String(successfulRequests).padEnd(27)}║`);
  console.log(`║  Failed:          ${String(failedRequests).padEnd(27)}║`);
  console.log(`║  Success Rate:    ${String(successRate + '%').padEnd(27)}║`);
  console.log(`║  Duration:        ${String(elapsed + 's').padEnd(27)}║`);
  console.log(`║  Avg Throughput:  ${String((totalRequests / parseFloat(elapsed)).toFixed(1) + ' req/s').padEnd(27)}║`);
  console.log('╚══════════════════════════════════════════════╝');

  // Also verify analytics
  try {
    const analytics = await fetch(`${BASE_URL}/api/v1/chatbot/analytics`);
    const analyticsData = await analytics.json();
    console.log(`\n📊 Post-test analytics: ${JSON.stringify(analyticsData.data)}`);
  } catch {}

  if (failedRequests > 0) {
    console.log(`\n⚠️  ${failedRequests} requests failed. Check the server logs for details.`);
    process.exit(1);
  } else {
    console.log(`\n✅ All requests succeeded! Server is ready for launch.`);
    process.exit(0);
  }
}

runStressTest().catch(err => {
  console.error('Stress test error:', err);
  process.exit(1);
});