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

// 30 Supported Languages Metadata
export const ALL_LANGUAGES = [
  { id: 'python', name: 'Python', category: 'General & Data', monaco: 'python' },
  { id: 'javascript', name: 'JavaScript', category: 'Web & Fullstack', monaco: 'javascript' },
  { id: 'typescript', name: 'TypeScript', category: 'Web & Fullstack', monaco: 'typescript' },
  { id: 'java', name: 'Java', category: 'Enterprise & Mobile', monaco: 'java' },
  { id: 'cpp', name: 'C++', category: 'Systems & Performance', monaco: 'cpp' },
  { id: 'c', name: 'C', category: 'Systems & Performance', monaco: 'c' },
  { id: 'csharp', name: 'C#', category: 'Enterprise & GameDev', monaco: 'csharp' },
  { id: 'go', name: 'Go (Golang)', category: 'Cloud & Systems', monaco: 'go' },
  { id: 'rust', name: 'Rust', category: 'Systems & Performance', monaco: 'rust' },
  { id: 'sql', name: 'SQL', category: 'Database & Data', monaco: 'sql' },
  { id: 'kotlin', name: 'Kotlin', category: 'Mobile & Enterprise', monaco: 'kotlin' },
  { id: 'swift', name: 'Swift', category: 'Mobile & Apple', monaco: 'swift' },
  { id: 'dart', name: 'Dart', category: 'Mobile & Flutter', monaco: 'dart' },
  { id: 'php', name: 'PHP', category: 'Web & Backend', monaco: 'php' },
  { id: 'ruby', name: 'Ruby', category: 'Web & Scripting', monaco: 'ruby' },
  { id: 'r', name: 'R', category: 'Data & Statistics', monaco: 'r' },
  { id: 'scala', name: 'Scala', category: 'Big Data & Functional', monaco: 'scala' },
  { id: 'julia', name: 'Julia', category: 'Data & Scientific', monaco: 'julia' },
  { id: 'mojo', name: 'Mojo', category: 'AI & Systems', monaco: 'python' },
  { id: 'zig', name: 'Zig', category: 'Systems & Performance', monaco: 'c' },
  { id: 'elixir', name: 'Elixir', category: 'Distributed & Concurrency', monaco: 'elixir' },
  { id: 'lua', name: 'Lua', category: 'Embedded & GameDev', monaco: 'lua' },
  { id: 'perl', name: 'Perl', category: 'Scripting & Text', monaco: 'perl' },
  { id: 'matlab', name: 'MATLAB', category: 'Scientific & Math', monaco: 'matlab' },
  { id: 'assembly', name: 'Assembly', category: 'Low-Level Architecture', monaco: 'mips' },
  { id: 'bash', name: 'Bash / Shell', category: 'DevOps & Scripting', monaco: 'shell' },
  { id: 'solidity', name: 'Solidity (Web3)', category: 'Blockchain & Smart Contracts', monaco: 'sol' },
  { id: 'groovy', name: 'Groovy', category: 'JVM & DevOps', monaco: 'groovy' },
  { id: 'haskell', name: 'Haskell', category: 'Pure Functional', monaco: 'haskell' },
  { id: 'fsharp', name: 'F#', category: 'Functional .NET', monaco: 'fsharp' },
];

export const POPULAR_LANGUAGES = [
  'python', 'javascript', 'typescript', 'java', 'cpp', 'csharp', 'go', 'rust', 'sql', 'kotlin'
];

// Language helpers
export const getLanguageLabel = (lang) => {
  const found = ALL_LANGUAGES.find((l) => l.id === lang);
  return found ? found.name : (lang ? lang.toUpperCase() : 'Code');
};

export const getLanguageBadgeClass = (lang) => {
  const map = {
    javascript: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    typescript: 'bg-blue-100 text-blue-800 border-blue-200',
    python: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    java: 'bg-orange-100 text-orange-800 border-orange-200',
    cpp: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    c: 'bg-slate-100 text-slate-800 border-slate-200',
    csharp: 'bg-purple-100 text-purple-800 border-purple-200',
    go: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    rust: 'bg-amber-100 text-amber-800 border-amber-200',
    sql: 'bg-sky-100 text-sky-800 border-sky-200',
    kotlin: 'bg-violet-100 text-violet-800 border-violet-200',
    swift: 'bg-rose-100 text-rose-800 border-rose-200',
    solidity: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  };
  return map[lang] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export const getMonacoLanguage = (lang) => {
  const found = ALL_LANGUAGES.find((l) => l.id === lang);
  return found ? found.monaco : 'plaintext';
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
