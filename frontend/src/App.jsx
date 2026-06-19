import { useState } from 'react';
import { motion } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import DocumentFilter from './components/DocumentFilter';
import TechnicalBackground from './components/TechnicalBackground';
import SystemStatus from './components/SystemStatus';
import IconBadge from './components/IconBadge';

const stagger = {
  hidden: { opacity: 0, y: 10 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' },
  }),
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [selectedSection, setSelectedSection] = useState('all');

  const handleDocumentToggle = (filename) => {
    setSelectedDocuments((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]
    );
  };

  const handleClearFilters = () => {
    setSelectedDocuments([]);
    setSelectedSection('all');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 relative">
      <TechnicalBackground />

      <motion.aside
        custom={0}
        initial="hidden"
        animate="show"
        variants={stagger}
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-r border-zinc-800 relative z-10`}
      >
        <div className="w-72 h-full flex flex-col">
          <DocumentFilter
            selectedDocuments={selectedDocuments}
            onDocumentToggle={handleDocumentToggle}
            selectedSection={selectedSection}
            onSectionChange={setSelectedSection}
            onClearFilters={handleClearFilters}
          />
        </div>
      </motion.aside>

      <motion.div
        custom={1}
        initial="hidden"
        animate="show"
        variants={stagger}
        className="flex-1 flex flex-col min-w-0 relative z-10"
      >
        <header className="flex items-center gap-2.5 px-3 py-2.5 border-b border-zinc-800 bg-zinc-950/75">
          <motion.button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <motion.span
              animate={{ rotate: sidebarOpen ? 0 : 180 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="block"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <PanelLeftOpen className="w-4 h-4" strokeWidth={1.5} />
              )}
            </motion.span>
          </motion.button>

          <div className="flex items-center gap-2">
            <IconBadge />
            <div>
              <h1 className="text-sm font-medium text-zinc-100 tracking-tight">
                RoboDocs
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Robot Manual Interface
              </p>
            </div>
          </div>

          <SystemStatus />
        </header>

        <main className="flex-1 min-h-0 relative">
          <ChatInterface
            selectedDocuments={selectedDocuments}
            selectedSection={selectedSection}
          />
        </main>
      </motion.div>
    </div>
  );
}
