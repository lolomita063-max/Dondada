#!/usr/bin/env bash
# Start Coreforge Chatbot with crash-protection monitor
# Usage: ./start.sh

cd "$(dirname "$0")"
DIR="$(pwd)/packages/backend"

echo "🚀 Starting Coreforge Chatbot with crash protection..."
echo "   Logs: /tmp/chatbot-server.log"
echo "   Monitor: auto-restarts on crash (max 10 in 60s)"
echo ""

# Create data directory
mkdir -p "$DIR/data"

# Start monitor (which spawns server)
nohup node --import tsx "$DIR/monitor.mjs" > /dev/null 2>&1 &
MONITOR_PID=$!

echo "Monitor PID: $MONITOR_PID"
echo ""

# Wait for server
sleep 4
if ss -Htln | grep -q :3000; then
  echo "✅ Coreforge Chatbot is running on port 3000!"
else
  echo "⚠️  Server may not be ready yet. Check: tail -20 /tmp/chatbot-server.log"
fi

echo "📋 Demo:  http://localhost:3000/"
echo "🔌 API:   http://localhost:3000/api"
echo "❤️  Health: http://localhost:3000/healthz"
echo ""
echo "To stop: kill $MONITOR_PID && kill \$(lsof -t -i:3000)"