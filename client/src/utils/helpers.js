// Score color helpers
export const getScoreColor = (score) => {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-500';
};

export const getScoreBg = (score) => {
  if (score >= 85) return 'bg-green-50 text-green-700 border-green-200';
  if (score >= 70) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (score >= 50) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  return 'bg-red-50 text-red-700 border-red-200';
};

export const getScoreLabel = (score) => {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
};

export const getLevelColor = (level) => {
  if (level >= 70) return 'bg-green-500';
  if (level >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Date helpers
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

// Language helpers
export const getLanguageLabel = (lang) => {
  const map = { javascript: 'JavaScript', python: 'Python', java: 'Java', cpp: 'C++' };
  return map[lang] || lang;
};

export const getLanguageBadgeClass = (lang) => {
  const map = {
    javascript: 'bg-yellow-100 text-yellow-800',
    python: 'bg-blue-100 text-blue-800',
    java: 'bg-orange-100 text-orange-800',
    cpp: 'bg-purple-100 text-purple-800',
  };
  return map[lang] || 'bg-gray-100 text-gray-700';
};

export const getMonacoLanguage = (lang) => {
  const map = { javascript: 'javascript', python: 'python', java: 'java', cpp: 'cpp' };
  return map[lang] || 'javascript';
};

// String helpers
export const truncate = (str, n = 100) => {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '...' : str;
};

export const copyToClipboard = async (text) => {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  // fallback
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

// Bug severity color
export const getSeverityClass = (severity) => {
  const map = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-blue-100 text-blue-700' };
  return map[severity] || 'bg-gray-100 text-gray-700';
};

// Concept level
export const getConceptLevelClass = (level) => {
  const map = { weak: 'badge-red', ok: 'badge-yellow', strong: 'badge-green' };
  return map[level] || 'badge-gray';
};
