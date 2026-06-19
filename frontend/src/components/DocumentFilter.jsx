import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Filter,
  Shield,
  Wrench,
  AlertCircle,
  Settings,
  HelpCircle,
  Loader2,
  Check,
} from 'lucide-react';
import CountUp from './CountUp';
import { apiUrl } from '../config';

const SECTIONS = [
  { id: 'all', label: 'All', icon: Filter, dot: 'bg-industrial' },
  { id: 'safety', label: 'Safety', icon: Shield, dot: 'bg-status-warning' },
  { id: 'installation', label: 'Installation', icon: Settings, dot: 'bg-industrial' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, dot: 'bg-status-success' },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: AlertCircle, dot: 'bg-zinc-500' },
  { id: 'general', label: 'General', icon: HelpCircle, dot: 'bg-zinc-600' },
];

function CustomCheckbox({ checked }) {
  return (
    <div
      role="presentation"
      className={`relative w-3.5 h-3.5 border flex-shrink-0 mt-0.5 transition-colors duration-200 ${
        checked
          ? 'bg-industrial border-industrial-dark'
          : 'bg-zinc-950 border-zinc-700 group-hover:border-zinc-600'
      }`}
    >
      <AnimatePresence>
        {checked && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Check className="w-2.5 h-2.5 text-zinc-100" strokeWidth={2.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DocumentFilter({
  selectedDocuments,
  onDocumentToggle,
  selectedSection,
  onSectionChange,
  onClearFilters,
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch(apiUrl('/documents'));
        if (!response.ok) {
          throw new Error('Failed to load documents');
        }
        const data = await response.json();
        setDocuments(data.documents || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, []);

  const hasActiveFilters =
    selectedDocuments.length > 0 || selectedSection !== 'all';

  return (
    <div className="flex flex-col h-full bg-zinc-950/70 border-r border-zinc-800">
      <div className="px-3 py-2.5 border-b border-zinc-800">
        <h2 className="text-xs font-medium text-zinc-100 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-industrial" strokeWidth={1.5} />
          Filters
        </h2>
        {hasActiveFilters && (
          <motion.button
            onClick={onClearFilters}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-1.5 text-[10px] font-mono text-industrial hover:text-zinc-300 transition-colors"
          >
            Clear filters
          </motion.button>
        )}
      </div>

      <div className="px-3 py-2 border-b border-zinc-800">
        <p className="text-[10px] font-mono font-medium text-zinc-600 uppercase tracking-widest mb-2">
          Section Type
        </p>
        <div className="flex flex-col gap-0.5">
          {SECTIONS.map(({ id, label, icon: Icon, dot }) => (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className="relative flex items-center gap-2 px-2 py-1.5 text-left text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
            >
              {selectedSection === id && (
                <motion.div
                  layoutId="activeSectionIndicator"
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-industrial"
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                />
              )}
              <span className={`relative z-10 w-1 h-1 rounded-full flex-shrink-0 ${dot}`} />
              <Icon className="relative z-10 w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
              <span
                className={`relative z-10 ${
                  selectedSection === id ? 'text-zinc-100 font-medium' : ''
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
        <div className="mb-2 pb-2 border-b border-zinc-800">
          <p className="text-[10px] font-mono font-medium text-zinc-600 uppercase tracking-widest">
            Documents
          </p>
          {!loading && !error && documents.length > 0 && (
            <p className="text-[10px] font-mono text-zinc-600 mt-0.5">
              <CountUp value={documents.length} /> indexed
            </p>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin text-industrial" strokeWidth={1.5} />
            <span className="font-mono text-sm">Loading documents...</span>
          </div>
        )}

        {error && (
          <p className="text-status-error text-[11px] font-mono py-2">
            {error}
          </p>
        )}

        {!loading && !error && documents.length === 0 && (
          <p className="text-zinc-600 text-[11px] font-mono py-2">
            No documents indexed.
          </p>
        )}

        <ul className="space-y-px">
          {documents.map((filename) => {
            const isSelected = selectedDocuments.includes(filename);
            return (
              <li key={filename}>
                <motion.button
                  type="button"
                  layout
                  onClick={() => onDocumentToggle(filename)}
                  className={`w-full flex items-center gap-2 px-1.5 py-1.5 cursor-pointer transition-colors group text-left ${
                    isSelected
                      ? 'bg-zinc-800 border-l-2 border-l-industrial'
                      : 'hover:bg-zinc-800/50 border-l-2 border-l-transparent'
                  }`}
                  whileHover={{ x: isSelected ? 0 : 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <CustomCheckbox checked={isSelected} />
                  <FileText
                    className={`w-3 h-3 flex-shrink-0 transition-colors ${
                      isSelected ? 'text-industrial' : 'text-zinc-600'
                    }`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`flex-1 text-sm font-mono leading-relaxed break-all min-w-0 ${
                      isSelected ? 'text-zinc-200' : 'text-zinc-400'
                    }`}
                  >
                    {filename}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-600 flex-shrink-0">
                    PDF
                  </span>
                </motion.button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
