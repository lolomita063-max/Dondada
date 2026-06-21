# Coreforge Chatbot — AI Lead Qualification

AI-powered lead qualification chatbot for Coreforge Engineering. Embedded as a website widget, it qualifies leads, answers FAQs, and books appointments.

## Quick Start

```bash
pnpm install
pnpm dev
```

## Project Structure

```
packages/
├── backend/          # Fastify + TypeScript API server
│   ├── src/
│   │   ├── index.ts           # Server entry point (port 3000)
│   │   ├── routes/chatbot.ts  # API routes
│   │   ├── services/
│   │   │   ├── chatbotEngine.ts      # Intent classification, lead extraction, prompt system
│   │   │   ├── conversationService.ts # Session management, conversation flow
│   │   │   └── leadService.ts        # Database operations (SQLite)
│   │   └── lib/database.ts   # SQLite schema & connection
│   └── test/
│       └── chatbot.test.ts   # Unit tests
├── widget/           # React-based embeddable chatbot widget
│   ├── src/
│   │   ├── index.ts          # Embed API entry point
│   │   ├── components/
│   │   │   └── ChatBox.tsx   # Main chat UI component
│   │   └── styles/
│   │       └── widget.css    # Widget styles
│   └── index.html            # Demo page
```

## API Endpoints

All endpoints at `/api/v1/chatbot/`:

| Method | Endpoint      | Description                        |
|--------|---------------|------------------------------------|
| GET    | `/health`     | Health check                       |
| POST   | `/start`      | Start a new chat session           |
| POST   | `/message`    | Send a message, get AI response    |
| GET    | `/analytics`  | Get conversation/lead analytics    |

### Start Session

```json
POST /api/v1/chatbot/start
{ "source": "widget" }
→ { "success": true, "data": { "sessionId": "...", "message": "...", "intent": {...}, ... } }
```

### Send Message

```json
POST /api/v1/chatbot/message
Headers: { "x-session-id": "sess_..." }
{ "message": "Hi, I'm interested in your platform" }
→ { "success": true, "data": { "sessionId": "...", "message": "...", "intent": {...}, ... } }
```

## Widget Embed

```html
<script>
  window.COREFORGE_CHATBOT_CONFIG = {
    apiUrl: "https://your-api.com",
    title: "CoreBot AI",
    primaryColor: "#4F46E5",
  };
</script>
<script src="https://your-api.com/widget/coreforge-chatbot.js"></script>
```

Or programmatically:

```html
<script src="https://your-api.com/widget/coreforge-chatbot.js"></script>
<script>
  CoreforgeChatbot.init({
    apiUrl: "https://your-api.com",
    title: "CoreBot AI",
    subtitle: "Lead Qualification Assistant",
    primaryColor: "#4F46E5",
  });
</script>
```

## Lead Qualification Flow

1. **Greeting** → Visitor clicks chat, bot introduces itself
2. **Collect Info** → Bot asks for name, email, company, pain points
3. **Qualify** → Bot determines if lead is qualified based on collected data
4. **Book** → Bot offers to schedule a demo/appointment
5. **Confirm** → Appointment is recorded, lead is tagged

## Tech Stack

- **Backend:** Node.js + Fastify (TypeScript)
- **Database:** SQLite (better-sqlite3)
- **Frontend:** React 18 + Vite (TypeScript)
- **AI:** Pattern-based intent classification (OpenAI/Anthropic ready)
- **Testing:** Vitest

## Testing

```bash
pnpm test
```
