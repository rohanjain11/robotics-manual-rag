import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Animate a number counting up from 0 on mount.
 */
export default function CountUp({ value, duration = 800, className = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }

    const startTime = performance.now();
    let frameId;

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}
