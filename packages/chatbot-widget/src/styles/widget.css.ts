// Inline styles for the chatbot widget
// Using injectable CSS that gets embedded into the JS bundle

export const WIDGET_STYLES = `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}
.cf-chatbot * {
  box-sizing: border-box;
}
.cf-chatbot {
  position: fixed;
  z-index: 2147483647;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
}
.cf-chatbot.cf-bottom-right {
  right: 20px;
  bottom: 20px;
}
.cf-chatbot.cf-bottom-left {
  left: 20px;
  bottom: 20px;
}
.cf-bubble {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--cf-primary, #2563eb);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: transform 0.2s, box-shadow 0.2s;
  position: absolute;
  bottom: 0;
  right: 0;
}
.cf-bubble:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}
.cf-bubble svg {
  width: 28px;
  height: 28px;
}
.cf-bubble-close {
  transform: rotate(90deg);
}

.cf-panel {
  position: absolute;
  bottom: 75px;
  right: 0;
  width: 360px;
  height: 560px;
  max-height: calc(100vh - 120px);
  max-width: calc(100vw - 40px);
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: cfSlideIn 0.3s ease-out;
}
@keyframes cfSlideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.cf-header {
  background: var(--cf-primary, #2563eb);
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}
.cf-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.cf-header-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  opacity: 0.8;
}
.cf-header-close:hover { opacity: 1; }

.cf-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f9fafb;
}
.cf-message {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  word-wrap: break-word;
}
.cf-message-bot {
  align-self: flex-start;
  background: white;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
}
.cf-message-user {
  align-self: flex-end;
  background: var(--cf-primary, #2563eb);
  color: white;
  border-bottom-right-radius: 4px;
}
.cf-message-time {
  font-size: 10px;
  opacity: 0.6;
  margin-top: 4px;
}
.cf-typing {
  align-self: flex-start;
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
}
.cf-typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
  animation: cfBounce 1.2s infinite;
}
.cf-typing span:nth-child(2) { animation-delay: 0.2s; }
.cf-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes cfBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.cf-input-area {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
  background: white;
}
.cf-input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
}
.cf-input:focus {
  border-color: var(--cf-primary, #2563eb);
  box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
}
.cf-send-btn {
  background: var(--cf-primary, #2563eb);
  color: white;
  border: none;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}
.cf-send-btn:hover { opacity: 0.9; }
.cf-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.cf-send-btn svg {
  width: 18px;
  height: 18px;
}

/* Lead Form */
.cf-lead-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f9fafb;
  flex: 1;
  justify-content: center;
}
.cf-lead-form h3 {
  text-align: center;
  margin: 0 0 8px;
  font-size: 15px;
  color: #374151;
}
.cf-lead-form p {
  text-align: center;
  margin: 0 0 8px;
  font-size: 13px;
  color: #6b7280;
}
.cf-form-input {
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  width: 100%;
}
.cf-form-input:focus {
  border-color: var(--cf-primary, #2563eb);
  box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
}
.cf-form-btn {
  background: var(--cf-primary, #2563eb);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.cf-form-btn:hover { opacity: 0.9; }
.cf-form-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.cf-form-error {
  color: #dc2626;
  font-size: 12px;
  text-align: center;
}

/* Mobile responsive */
@media (max-width: 480px) {
  .cf-panel {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    bottom: 0;
    right: 0;
    border-radius: 0;
  }
}
`;