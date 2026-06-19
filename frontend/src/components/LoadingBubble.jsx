import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export default function LoadingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex items-start gap-3"
    >
      <div className="w-8 h-8 border border-zinc-700 bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-industrial" strokeWidth={1.5} />
      </div>

      <div className="flex-1 max-w-[85%] min-w-[240px] border border-zinc-800 bg-zinc-900">
        {/* Technical progress scan */}
        <div className="relative h-px w-full bg-zinc-800 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full w-1/5 bg-industrial/35"
            animate={{ x: ['-100%', '500%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div className="px-4 py-3">
          <p className="text-sm font-mono text-zinc-500 mb-3">
            Processing query
            <motion.span
              className="inline-block w-2 text-industrial/70"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            >
              _
            </motion.span>
          </p>

          <div className="space-y-2.5">
            {[100, 88, 72].map((width, i) => (
              <motion.div
                key={i}
                className="h-3 bg-zinc-800 overflow-hidden"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 0.65, 0.4] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
                style={{ width: `${width}%` }}
              >
                <motion.div
                  className="h-full w-1/4 bg-zinc-700"
                  animate={{ x: ['-100%', '400%'] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: i * 0.12,
                    ease: 'linear',
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
