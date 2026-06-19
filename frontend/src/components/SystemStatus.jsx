import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountUp from './CountUp';
import { apiUrl } from '../config';

/**
 * Live system status indicator with pulsing dot and indexed document count.
 */
export default function SystemStatus() {
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch(apiUrl('/documents'));
        if (res.ok) {
          const data = await res.json();
          setDocCount((data.documents || []).length);
        }
      } catch {
        /* display-only — fail silently */
      }
    }
    fetchCount();
  }, []);

  return (
    <div className="ml-auto flex items-center gap-2">
      <motion.span
        className="w-1.5 h-1.5 rounded-full bg-industrial flex-shrink-0"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
        {docCount > 0 ? (
          <>
            <CountUp value={docCount} /> documents indexed · live
          </>
        ) : (
          'system online'
        )}
      </p>
    </div>
  );
}
