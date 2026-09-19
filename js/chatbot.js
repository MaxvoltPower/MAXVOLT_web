// ============================================
// MAXVOLT — Floating Chatbot Widget
// ============================================

(function () {
  function createWidget() {
    const widget = document.createElement('div');
    widget.id = 'maxvolt-chatbot';
    widget.innerHTML = `
      <button id="chat-toggle" aria-label="Open chat">
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          <circle cx="8" cy="10" r="1.5"/>
          <circle cx="12" cy="10" r="1.5"/>
          <circle cx="16" cy="10" r="1.5"/>
        </svg>
      </button>
      <div id="chat-window" style="display:none;">
        <div id="chat-header">
          <div>
            <strong>MAXVOLT Assistant</strong>
            <div style="font-size:0.75rem;opacity:0.8;">Online • Ask me anything</div>
          </div>
          <button id="chat-close" aria-label="Close chat">✕</button>
        </div>
        <div id="chat-messages"></div>
        <form id="chat-form">
          <input type="text" id="chat-input" placeholder="Type your message..." autocomplete="off" />
          <button type="submit" aria-label="Send">➤</button>
        </form>
      </div>
    `;
    document.body.appendChild(widget);

    const style = document.createElement('style');
    style.textContent = `
      #maxvolt-chatbot {
        position: fixed;
        bottom: 88px;
        right: 24px;
        z-index: 9999;
        font-family: var(--font-sans, sans-serif);
      }
      #chat-toggle {
        width: 56px; height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--secondary, #ff6b00), var(--secondary-light, #ff8c3a));
        color: #fff;
        border: none;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(255,107,0,0.4);
        display: grid; place-items: center;
        transition: transform 200ms, box-shadow 200ms;
      }
      #chat-toggle:hover {
        transform: scale(1.08);
        box-shadow: 0 12px 32px rgba(255,107,0,0.55);
      }
      #chat-window {
        position: absolute;
        bottom: 72px;
        right: 0;
        width: 360px;
        max-width: calc(100vw - 32px);
        height: 480px;
        max-height: calc(100vh - 160px);
        background: var(--bg-elevated, #16213a);
        border: 1px solid var(--border, #1f2b45);
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 48px rgba(0,0,0,0.6);
        animation: chatIn 250ms ease-out;
      }
      @keyframes chatIn {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #chat-header {
        padding: 14px 16px;
        background: linear-gradient(135deg, var(--primary-light, #0a4d8c), var(--primary, #003366));
        color: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #chat-close {
        background: none; border: none; color: #fff;
        font-size: 1.1rem; cursor: pointer; padding: 4px 8px;
        border-radius: 6px;
      }
      #chat-close:hover { background: rgba(255,255,255,0.15); }
      #chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .chat-msg {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 0.9rem;
        line-height: 1.5;
        word-wrap: break-word;
      }
      .chat-msg.user {
        align-self: flex-end;
        background: var(--secondary, #ff6b00);
        color: #fff;
        border-bottom-right-radius: 4px;
      }
      .chat-msg.bot {
        align-self: flex-start;
        background: var(--bg-muted, #1e293b);
        color: var(--text, #f1f5f9);
        border-bottom-left-radius: 4px;
      }
      .chat-msg.typing {
        color: var(--text-subtle, #94a3b8);
        font-style: italic;
      }
      #chat-form {
        display: flex;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid var(--border, #1f2b45);
        background: var(--bg-subtle, #111827);
      }
      #chat-input {
        flex: 1;
        padding: 10px 14px;
        border-radius: 24px;
        border: 1.5px solid var(--border, #1f2b45);
        background: var(--bg-muted, #1e293b);
        color: var(--text, #f1f5f9);
        font-size: 0.9rem;
        outline: none;
      }
      #chat-input:focus { border-color: var(--secondary, #ff6b00); }
      #chat-form button {
        width: 42px; height: 42px;
        border-radius: 50%;
        border: none;
        background: var(--secondary, #ff6b00);
        color: #fff;
        cursor: pointer;
        display: grid; place-items: center;
        font-size: 1rem;
        transition: transform 150ms;
      }
      #chat-form button:hover { transform: scale(1.08); }
      #chat-form button:disabled { opacity: 0.5; cursor: not-allowed; }
      @media (max-width: 480px) {
        #maxvolt-chatbot { bottom: 76px; right: 16px; }
        #chat-window { width: calc(100vw - 32px); height: 420px; }
      }
    `;
    document.head.appendChild(style);

    const toggle = document.getElementById('chat-toggle');
    const win = document.getElementById('chat-window');
    const close = document.getElementById('chat-close');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');
    const history = [];

    function addMessage(text, sender) {
      const el = document.createElement('div');
      el.className = `chat-msg ${sender}`;
      el.textContent = text;
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
      const el = document.createElement('div');
      el.className = 'chat-msg bot typing';
      el.id = 'typing-indicator';
      el.textContent = 'Typing...';
      messages.appendChild(el);
      messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
      document.getElementById('typing-indicator')?.remove();
    }

    toggle.addEventListener('click', () => {
      const isOpen = win.style.display !== 'none';
      win.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen && !messages.children.length) {
        addMessage("Hi! I'm MAXVOLT Assistant. How can I help you today?", 'bot');
      }
      if (!isOpen) input.focus();
    });

    close.addEventListener('click', () => {
      win.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      addMessage(text, 'user');
      history.push({ role: 'user', content: text });
      showTyping();
      form.querySelector('button').disabled = true;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: history.slice(-6) }),
        });
        const data = await res.json();
        hideTyping();
        if (!res.ok) throw new Error(data.error || 'Chat failed');
        addMessage(data.reply, 'bot');
        history.push({ role: 'assistant', content: data.reply });
      } catch (err) {
        hideTyping();
        addMessage('Sorry, I encountered an error. Please try again or contact us on WhatsApp.', 'bot');
      } finally {
        form.querySelector('button').disabled = false;
        input.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();