import { useState, useRef, useEffect } from 'react';
import { api } from '@lib/api';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm MAXVOLT Assistant. How can I help you today?",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
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

      // Handle both response shapes defensively:
      //   { reply: "..." }  OR  "..." (if backend returns raw string)
      let replyText = 'Sorry, I could not generate a response.';
      if (data && typeof data === 'object' && typeof data.reply === 'string') {
        replyText = data.reply;
      } else if (typeof data === 'string') {
        replyText = data;
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: replyText },
      ]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I encountered an error. Please try again or contact us on WhatsApp.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-[9999]">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary to-secondary-light text-white shadow-2xl shadow-secondary/40 grid place-items-center hover:scale-110 transition-transform"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
            <circle cx="8" cy="10" r="1.5" />
            <circle cx="12" cy="10" r="1.5" />
            <circle cx="16" cy="10" r="1.5" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[360px] max-w-[calc(100vw-32px)] h-[480px] max-h-[calc(100vh-180px)] bg-dark-elevated border border-dark-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-br from-primary-light to-primary text-white flex items-center justify-between">
            <div>
              <strong className="block">MAXVOLT Assistant</strong>
              <span className="text-xs opacity-80">Online • Ask me anything</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'ml-auto bg-secondary text-white rounded-br-sm'
                    : 'bg-dark-muted text-[var(--text)] rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            ))}
            {isTyping && (
              <div className="max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm bg-dark-muted text-[var(--text-subtle)] italic rounded-bl-sm">
                Typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 p-3 border-t border-dark-border bg-dark-subtle"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3.5 py-2.5 rounded-full border-[1.5px] border-dark-border bg-dark-muted text-sm"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="w-11 h-11 rounded-full bg-secondary text-white grid place-items-center hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
              aria-label="Send"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}