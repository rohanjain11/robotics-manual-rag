import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

/**
 * Header chip icon with subtle border pulse and scan-line read effect.
 */
export default function IconBadge({ className = '' }) {
  return (
    <div className={`relative w-8 h-8 flex items-center justify-center flex-shrink-0 ${className}`}>
      <motion.div
        className="absolute inset-0 border border-zinc-700"
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        <motion.div
          className="absolute left-0 right-0 h-px bg-industrial/10"
          animate={{ top: ['-10%', '110%'] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
        />
      </motion.div>
      <Cpu className="relative w-4 h-4 text-industrial" strokeWidth={1.5} />
    </div>
  );
}
