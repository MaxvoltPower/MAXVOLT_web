// ============================================================
// MAXVOLT — AI chatbot widget
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { api } from '@lib/api';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    "Hi! I'm MAXVOLT Assistant. How can I help you today? Ask me about batteries, inverters, pricing, or availability.",
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      // Small delay so the panel finishes opening before focus
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Lock scroll on very small screens when chat open
  useEffect(() => {
    if (isOpen && window.innerWidth < 480) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isTyping) return;

    setInput('');
    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const data = await api.chat({ message: text, history });

      let replyText = 'Sorry, I could not generate a response.';
      if (data && typeof data === 'object' && typeof data.reply === 'string') {
        replyText = data.reply;
      } else if (typeof data === 'string') {
        replyText = data;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: replyText }]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I hit a snag. Please try again, or reach us on WhatsApp at +91 7595941311.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[1000] w-14 h-14 rounded-full bg-gradient-to-br from-secondary to-secondary-light text-white shadow-2xl shadow-secondary/40 grid place-items-center transition-all hover:scale-110 ${
          isOpen ? 'rotate-90' : ''
        }`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
            <circle cx="8" cy="10" r="1.5" />
            <circle cx="12" cy="10" r="1.5" />
            <circle cx="16" cy="10" r="1.5" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed z-[1000] bg-dark-elevated border border-dark-border rounded-2xl shadow-2xl flex flex-col overflow-hidden
            right-2 left-2 bottom-20 max-h-[75vh]
            sm:right-6 sm:left-auto sm:bottom-24 sm:w-[380px] sm:max-w-[calc(100vw-48px)] sm:h-[540px]"
          role="dialog"
          aria-label="MAXVOLT Assistant chat"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-br from-primary-light to-primary text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 grid place-items-center text-lg">
                ⚡
              </div>
              <div>
                <strong className="block text-sm">MAXVOLT Assistant</strong>
                <span className="text-[11px] opacity-80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online • Ask me anything
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed break-words ${
                  m.role === 'user'
                    ? 'ml-auto bg-secondary text-white rounded-br-sm'
                    : 'bg-dark-muted text-[var(--text)] rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            ))}
            {isTyping && (
              <div className="max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm bg-dark-muted rounded-bl-sm inline-flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-subtle)] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-subtle)] animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-subtle)] animate-bounce [animation-delay:0.3s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 p-3 border-t border-dark-border bg-dark-subtle shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3.5 py-2.5 rounded-full border-[1.5px] border-dark-border bg-dark-muted text-sm"
              disabled={isTyping}
              aria-label="Message"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="w-11 h-11 shrink-0 rounded-full bg-secondary text-white grid place-items-center hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
              aria-label="Send"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}