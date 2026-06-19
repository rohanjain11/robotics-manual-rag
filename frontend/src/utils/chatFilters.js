const SECTION_LABELS = {
  safety: 'Safety',
  installation: 'Installation',
  maintenance: 'Maintenance',
  troubleshooting: 'Troubleshooting',
  general: 'General',
};

/**
 * Build POST /chat request body from current filter state.
 * Always reads the latest selected documents and section at call time.
 */
export function buildChatRequestBody(message, selectedDocuments, selectedSection) {
  const body = { message };

  if (selectedDocuments.length > 0) {
    body.filter_documents = [...selectedDocuments];
  }

  if (selectedSection && selectedSection !== 'all') {
    body.filter_section = selectedSection;
  }

  return body;
}

/**
 * Human-readable label for active filters (badge display).
 */
export function buildActiveFilterLabel(selectedDocuments, selectedSection) {
  const parts = [];

  if (selectedDocuments.length === 1) {
    parts.push(selectedDocuments[0]);
  } else if (selectedDocuments.length > 1) {
    parts.push(`${selectedDocuments.length} documents`);
  }

  if (selectedSection && selectedSection !== 'all') {
    parts.push(SECTION_LABELS[selectedSection] || selectedSection);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

export { SECTION_LABELS };
