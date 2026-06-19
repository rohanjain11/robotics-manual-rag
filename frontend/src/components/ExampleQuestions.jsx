import { motion } from 'framer-motion';
import { ShieldAlert, Settings2, CalendarClock, Ruler } from 'lucide-react';
import IconBadge from './IconBadge';

const EXAMPLES = [
  {
    question: 'What is the emergency stop procedure?',
    icon: ShieldAlert,
    category: 'Safety',
  },
  {
    question: 'How do I calibrate the robot arm?',
    icon: Settings2,
    category: 'Setup',
  },
  {
    question: 'What is the recommended maintenance schedule?',
    icon: CalendarClock,
    category: 'Maintenance',
  },
  {
    question: 'What safety distance is required during operation?',
    icon: Ruler,
    category: 'Safety',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function ExampleQuestions({ onQuestionClick }) {
  return (
    <div className="py-6 relative z-[1]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center mb-6"
      >
        <div className="inline-flex mb-4">
          <IconBadge className="w-12 h-12" />
        </div>
        <h2 className="text-lg font-medium text-zinc-100 mb-1">
          Robotics Manual Assistant
        </h2>
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-2">
          Technical Documentation System
        </p>
        <p className="text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
          Query indexed operation manuals, maintenance guides, and safety
          procedures. All answers include source citations.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
      >
        {EXAMPLES.map(({ question, icon: Icon, category }) => (
          <motion.button
            key={question}
            variants={itemVariants}
            onClick={() => onQuestionClick(question)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.995 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="group text-left p-3 border border-zinc-800 bg-zinc-900 hover:border-industrial/30 hover:bg-zinc-800/80"
          >
            <div className="flex items-start gap-2">
              <Icon
                className="w-3.5 h-3.5 text-zinc-500 group-hover:text-industrial flex-shrink-0 mt-0.5 transition-colors duration-150"
                strokeWidth={1.5}
              />
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">
                  {category}
                </span>
                <p className="text-base font-medium text-zinc-200 mt-1 group-hover:text-zinc-100 transition-colors duration-150 leading-relaxed">
                  {question}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
