import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, FileText } from 'lucide-react';

export default function SourceCitation({ sources }) {
  const [expanded, setExpanded] = useState(false);
  const [activeSource, setActiveSource] = useState(null);

  if (!sources || sources.length === 0) return null;

  const toggleSourceDetail = (idx) => {
    setActiveSource(activeSource === idx ? null : idx);
  };

  return (
    <div className="mt-1.5">
      <motion.button
        onClick={() => setExpanded(!expanded)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <ChevronRight className="w-3 h-3" strokeWidth={1.5} />
        </motion.span>
        Sources ({sources.length})
      </motion.button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 flex flex-wrap gap-1 pt-0.5">
              {sources.map((source, idx) => (
                <div key={idx} className="relative">
                  <motion.button
                    onClick={() => toggleSourceDetail(idx)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-xs font-mono transition-colors ${
                      activeSource === idx
                        ? 'border-industrial bg-zinc-800 text-zinc-200'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    <FileText className="w-2.5 h-2.5 flex-shrink-0" strokeWidth={1.5} />
                    <span className="truncate max-w-[160px]">
                      {source.source_filename}
                    </span>
                    <span className="text-zinc-600">
                      p.{parseFloat(source.page_number)}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {activeSource === idx && source.chunk_text && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 top-full mt-1 z-10 w-64 p-2 border border-zinc-700 bg-zinc-950 text-[11px] font-mono text-zinc-400 leading-relaxed"
                      >
                        <p className="text-zinc-600 mb-1 text-[10px] uppercase tracking-wider">
                          Excerpt
                        </p>
                        <p className="line-clamp-6">{source.chunk_text}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
