import { motion } from 'framer-motion';

/**
 * Oscilloscope-style sweep line for idle/empty chat state.
 */
export default function ScanLine() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <motion.div
        className="absolute left-0 right-0 h-px bg-industrial/[0.07]"
        initial={{ top: '0%' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}
