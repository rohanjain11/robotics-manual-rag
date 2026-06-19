import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, Filter, FileText } from 'lucide-react';
import SourceCitation from './SourceCitation';

const CITATION_RE = /\(([A-Za-z0-9_\-\.]+\.pdf),\s*page\s*([\d.]+)\)/gi;

function renderTextWithCitations(text) {
  if (typeof text !== 'string') return text;

  const parts = [];
  let lastIndex = 0;
  let match;

  const re = new RegExp(CITATION_RE.source, 'gi');
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={`${match.index}-${match[1]}`}
        className="inline-flex items-center gap-1.5 mx-0.5 px-2 py-0.5 border border-zinc-700 bg-zinc-800 text-xs font-mono text-zinc-400 cursor-pointer hover:border-zinc-600 hover:text-zinc-300 transition-colors"
      >
        <FileText className="w-3 h-3 text-zinc-500 flex-shrink-0" strokeWidth={1.5} />
        <span className="truncate max-w-[120px]">{match[1]}</span>
        <span className="text-zinc-500">p.{parseFloat(match[2])}</span>
      </span>
    );
    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function processChildren(children) {
  if (typeof children === 'string') {
    return renderTextWithCitations(children);
  }
  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === 'string' ? (
        <span key={i}>{renderTextWithCitations(child)}</span>
      ) : (
        child
      )
    );
  }
  return children;
}

const markdownComponents = {
  p: ({ children }) => (
    <p className="my-3 leading-7 text-base">{processChildren(children)}</p>
  ),
  li: ({ children }) => (
    <li className="my-1.5 leading-7 text-base">{processChildren(children)}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-medium text-zinc-100">{children}</strong>
  ),
  ul: ({ children }) => <ul className="my-2 space-y-0.5 list-disc pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 space-y-0.5 list-decimal pl-4">{children}</ol>,
};

function FilterBadge({ label }) {
  if (!label) return null;
  return (
    <div className="flex justify-end mb-0.5">
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-zinc-700 bg-zinc-800 text-xs font-mono text-zinc-500">
        <Filter className="w-3 h-3" strokeWidth={1.5} />
        {label}
      </span>
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <FilterBadge label={message.activeFilters} />
        <div className="flex justify-end">
          <div className="max-w-[85%] bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-2.5 text-base leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  const isSafety = message.is_safety_related;
  const isError = message.isError;

  return (
    <div className="flex items-start gap-3">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="w-8 h-8 border border-zinc-700 bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5"
      >
        <Bot className="w-4 h-4 text-industrial" strokeWidth={1.5} />
      </motion.div>

      <div className="max-w-[85%] w-full min-w-0">
        <FilterBadge label={message.activeFilters} />

        <div
          className={`px-4 py-3 bg-zinc-900 ${
            isSafety && !isError
              ? 'border border-zinc-800 border-l-2 border-l-status-warning'
              : isError
                ? 'border border-zinc-800 border-l-2 border-l-status-error'
                : 'border border-zinc-800'
          }`}
        >
          {isSafety && !isError && (
            <p className="text-xs font-mono uppercase tracking-widest text-amber-500 mb-2">
              Safety Notice
            </p>
          )}

          <div
            className={`prose prose-base prose-invert max-w-none ${
              isError ? 'text-status-error' : 'text-zinc-300'
            } prose-headings:text-zinc-100 prose-headings:font-medium prose-p:leading-7 prose-code:text-zinc-300 prose-code:bg-zinc-950 prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {!isError && message.sources && message.sources.length > 0 && (
          <SourceCitation sources={message.sources} />
        )}
      </div>
    </div>
  );
}
