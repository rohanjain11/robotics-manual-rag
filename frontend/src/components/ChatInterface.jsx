import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Filter } from 'lucide-react';
import MessageBubble from './MessageBubble';
import LoadingBubble from './LoadingBubble';
import ExampleQuestions from './ExampleQuestions';
import { apiUrl } from '../config';
import {
  buildChatRequestBody,
  buildActiveFilterLabel,
} from '../utils/chatFilters';

function FilterBadge({ label }) {
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-zinc-700 bg-zinc-800 text-xs font-mono text-zinc-400">
      <Filter className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
      {label}
    </span>
  );
}

export default function ChatInterface({ selectedDocuments, selectedSection }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const filterLabel = buildActiveFilterLabel(selectedDocuments, selectedSection);
      const body = buildChatRequestBody(trimmed, selectedDocuments, selectedSection);

      setError(null);
      setInput('');
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: trimmed, activeFilters: filterLabel },
      ]);
      setLoading(true);

      try {
        const response = await fetch(apiUrl('/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || `Request failed (${response.status})`);
        }

        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer,
            sources: data.sources,
            is_safety_related: data.is_safety_related,
            activeFilters: filterLabel,
          },
        ]);
      } catch (err) {
        setError(err.message);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Sorry, something went wrong: ${err.message}. Make sure the backend is running on port 8000.`,
            sources: [],
            is_safety_related: false,
            isError: true,
            activeFilters: filterLabel,
          },
        ]);
      } finally {
        setLoading(false);
        textareaRef.current?.focus();
      }
    },
    [loading, selectedDocuments, selectedSection]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleExampleClick = (question) => {
    sendMessage(question);
  };

  const liveFilterLabel = buildActiveFilterLabel(
    selectedDocuments,
    selectedSection
  );
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full relative bg-zinc-950/40">

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 relative z-[1]">
        <div className="max-w-3xl mx-auto space-y-4">
          {isEmpty && !loading && (
            <ExampleQuestions onQuestionClick={handleExampleClick} />
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <MessageBubble message={msg} />
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {loading && <LoadingBubble />}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-zinc-800 bg-zinc-950/80 px-3 py-3">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {liveFilterLabel && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-1.5"
            >
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-600">
                Active filters
              </span>
              <FilterBadge label={liveFilterLabel} />
            </motion.div>
          )}

          {error && (
            <p className="text-status-error text-sm mb-2 font-mono">{error}</p>
          )}

          <div className="flex items-end gap-2 border border-zinc-800 bg-zinc-950 p-2 focus-within:border-industrial transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about setup, safety, maintenance, or troubleshooting..."
              rows={1}
              className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 resize-none px-2 py-1.5 focus:outline-none text-base leading-relaxed max-h-32"
              disabled={loading}
            />
            <motion.button
              type="submit"
              disabled={!input.trim() || loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-shrink-0 p-2.5 bg-industrial hover:bg-industrial-dark text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <AnimatePresence mode="wait" initial={false}>
                {loading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="send"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Send className="w-4 h-4" strokeWidth={1.5} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
          <p className="text-xs font-mono text-zinc-600 mt-2 text-center">
            Answers grounded in indexed manuals with source citations.
          </p>
        </form>
      </div>
    </div>
  );
}
