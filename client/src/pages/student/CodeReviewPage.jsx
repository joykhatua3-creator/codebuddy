import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Trash2, Radio, Sparkles, Moon, Sun, Maximize2, Minimize2, Globe, AlertCircle, Upload, FileCode2 } from 'lucide-react';
import { reviewService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ALL_LANGUAGES, POPULAR_LANGUAGES, getMonacoLanguage, getLanguageLabel } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';

const MAX_CHARS = 15000;
const MAX_LINES = 400;
const MAX_FILE_BYTES = 100 * 1024;
const DRAFT_STORAGE_KEY = 'codebuddy_review_draft';

const EXTENSION_LANGUAGE_MAP = {
  py: 'python',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  java: 'java',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  c: 'c',
  h: 'c',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  sql: 'sql',
  kt: 'kotlin',
  kts: 'kotlin',
};

const readStoredDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.code === 'string' && typeof parsed.language === 'string') {
      return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return null;
};

const clearStoredDraft = () => {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
};

const DEFAULT_CODE = {
  python: `# Python 3.x\ndef greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("World"))`,
  javascript: `// JavaScript (ES2024)\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greet("World"));`,
  typescript: `// TypeScript\ninterface User {\n  id: number;\n  name: string;\n}\n\nfunction greet(user: User): string {\n  return \`Hello, \${user.name}! (ID: \${user.id})\`;\n}\n\nconsole.log(greet({ id: 1, name: "World" }));`,
  java: `// Java 21+\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  cpp: `// C++ 20+\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    cout << "Hello, C++ World!" << endl;\n    return 0;\n}`,
  c: `// C17\n#include <stdio.h>\n\nint main() {\n    printf("Hello, C World!\\n");\n    return 0;\n}`,
  csharp: `// C# (.NET 8+)\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, C# World!");\n    }\n}`,
  go: `// Go (Golang)\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Go World!")\n}`,
  rust: `// Rust (Edition 2021)\nfn main() {\n    let greeting = "Hello, Rust World!";\n    println!("{}", greeting);\n}`,
  sql: `-- SQL (PostgreSQL / MySQL)\nSELECT \n    u.id,\n    u.name,\n    COUNT(o.id) AS order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nGROUP BY u.id, u.name\nORDER BY order_count DESC;`,
  kotlin: `// Kotlin\nfun main() {\n    val greeting = "Hello, Kotlin World!"\n    println(greeting)\n}`,
  swift: `// Swift 5.9+\nimport Foundation\n\nfunc greet(name: String) -> String {\n    return "Hello, \\(name)!"\n}\nprint(greet(name: "World"))`,
  dart: `// Dart (Flutter)\nvoid main() {\n  print('Hello, Dart World!');\n}`,
  php: `<?php\n// PHP 8.2+\nfunction greet(string $name): string {\n    return "Hello, {$name}!";\n}\necho greet("World");`,
  ruby: `# Ruby 3+\ndef greet(name)\n  "Hello, #{name}!"\nend\nputs greet("World")`,
  r: `# R Script\nx <- c(10, 20, 30, 40, 50)\ncat("Mean:", mean(x), "\\n")`,
  scala: `// Scala 3\nobject Main extends App {\n  def greet(name: String): String = s"Hello, $name!"\n  println(greet("World"))\n}`,
  julia: `# Julia\nfunction greet(name::String)\n    return "Hello, $name!"\nend\nprintln(greet("World"))`,
  mojo: `# Mojo (Modular)\nfn main():\n    let msg: String = "Hello, Mojo World!"\n    print(msg)`,
  zig: `// Zig 0.12+\nconst std = @import("std");\n\npub fn main() !void {\n    std.debug.print("Hello, Zig World!\\n", .{});\n}`,
  elixir: `# Elixir\ndefmodule Greeter do\n  def greet(name), do: "Hello, #{name}!"\nend\nIO.puts Greeter.greet("World")`,
  lua: `-- Lua 5.4\nfunction greet(name)\n    return "Hello, " .. name .. "!"\nend\nprint(greet("World"))`,
  perl: `# Perl 5\nuse strict;\nuse warnings;\nmy $msg = "Hello, Perl World!\\n";\nprint $msg;`,
  matlab: `% MATLAB / GNU Octave\nx = [1, 2, 3, 4, 5];\ny = x .^ 2;\ndisp(y);`,
  assembly: `; x86_64 NASM Assembly\nsection .data\n    msg db "Hello, Assembly World!", 10\n    len equ $ - msg\nsection .text\n    global _start\n_start:\n    mov rax, 1\n    mov rdi, 1\n    mov rsi, msg\n    mov rdx, len\n    syscall\n    mov rax, 60\n    xor rdi, rdi\n    syscall`,
  bash: `#!/usr/bin/env bash\n# Bash / Shell Script\nNAME="World"\necho "Hello, \${NAME}!"`,
  solidity: `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract Greeter {\n    string public greeting;\n    constructor(string memory _greeting) {\n        greeting = _greeting;\n    }\n}`,
  groovy: `// Apache Groovy\ndef greet(name) {\n    return "Hello, \${name}!"\n}\nprintln greet("World")`,
  haskell: `-- Haskell GHC\ngreet :: String -> String\ngreet name = "Hello, " ++ name ++ "!"\n\nmain :: IO ()\nmain = putStrLn (greet "World")`,
  fsharp: `// F#\nlet greet name = sprintf "Hello, %s!" name\n\n[<EntryPoint>]\nlet main argv =\n    printfn "%s" (greet "World")\n    0`
};

export default function CodeReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const assignmentId = location.state?.assignmentId || null;
  const assignmentTitle = location.state?.assignmentTitle || null;
  const hasExplicitStarter = Boolean(location.state?.starterCode || assignmentId);

  const [editorTheme, setEditorTheme] = useState(isDark ? 'vs-dark' : 'vs-dark'); // VS Code Dark default
  const [fontSize, setFontSize] = useState(14);
  const [language, setLanguage] = useState(() => {
    if (location.state?.language) return location.state.language;
    const draft = readStoredDraft();
    return draft?.language || 'javascript';
  });
  const [code, setCode] = useState(() => {
    if (location.state?.starterCode) return location.state.starterCode;
    if (location.state?.language) return DEFAULT_CODE[location.state.language] || '';
    const draft = readStoredDraft();
    return draft?.code ?? DEFAULT_CODE.javascript;
  });
  const [useStreaming, setUseStreaming] = useState(true);
  const [loading, setLoading] = useState(false);
  const [streamProgress, setStreamProgress] = useState(null);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const submitRef = useRef(null);
  const fileInputRef = useRef(null);

  const lines = code.split('\n').length;
  const chars = code.length;
  const isOverLimit = lines > MAX_LINES || chars > MAX_CHARS;
  const isEmpty = code.trim().length < 5;
  const isDefaultTemplate = code === (DEFAULT_CODE[language] || `// Write your ${getLanguageLabel(language)} code here`);

  // Auto-save draft to localStorage while editing (skip overwriting when viewing fresh assignment starter)
  useEffect(() => {
    if (hasExplicitStarter && code === location.state?.starterCode) return;
    try {
      if (isDefaultTemplate) {
        clearStoredDraft();
      } else {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ language, code }));
      }
    } catch {
      // ignore quota/private mode errors
    }
  }, [code, language, isDefaultTemplate, hasExplicitStarter, location.state?.starterCode]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang] || `// Write your ${getLanguageLabel(lang)} code here`);
    setUploadedFileName('');
    setError('');
  };

  const handleClear = () => {
    clearStoredDraft();
    setUploadedFileName('');
    setCode(DEFAULT_CODE[language] || `// Write your ${getLanguageLabel(language)} code here`);
    setError('');
    setStreamProgress(null);
  };

  const handleFileImport = async (file) => {
    if (!file) return;
    setError('');
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const detectedLang = EXTENSION_LANGUAGE_MAP[ext];
    if (!detectedLang) {
      setError(
        `Unsupported file extension ".${ext}". Supported files: .py, .js, .ts, .java, .cpp, .c, .cs, .go, .rs, .sql, .kt`
      );
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`File "${file.name}" exceeds the 100 KB limit (${Math.round(file.size / 1024)} KB).`);
      return;
    }

    try {
      const content = await file.text();
      if (content.includes('\u0000')) {
        setError(`File "${file.name}" appears to be binary. Please upload plain source code.`);
        return;
      }
      if (content.length > MAX_CHARS) {
        setError(
          `File "${file.name}" has ${content.length.toLocaleString()} characters, exceeding the ${MAX_CHARS.toLocaleString()}-character limit.`
        );
        return;
      }
      if (content.trim().length < 5) {
        setError(`File "${file.name}" does not contain enough code (minimum 5 characters).`);
        return;
      }
      setLanguage(detectedLang);
      setCode(content);
      setUploadedFileName(file.name);
    } catch {
      setError(`Could not read file "${file.name}".`);
    }
  };

  const handleSubmit = async () => {
    if (isEmpty || isOverLimit || loading) return;
    setLoading(true);
    setError('');
    setStreamProgress('Starting code analysis...');

    if (useStreaming) {
      let navigated = false;
      let handledError = false;
      try {
        await reviewService.streamReview(
          { language, code, assignmentId },
          {
            onProgress: (info) => {
              setStreamProgress(info.message || 'Analyzing code...');
            },
            onComplete: (data) => {
              const reviewId = data.reviewId || data._id || data.data?._id;
              if (reviewId) {
                navigated = true;
                clearStoredDraft();
                navigate(`/dashboard/review/${reviewId}`);
              } else {
                fallbackSubmit();
              }
            },
            onError: (err) => {
              handledError = true;
              // Do not retry 4xx client/quota/auth rejections with a duplicate POST
              if (err?.status && err.status >= 400 && err.status < 500) {
                setError(err.message || 'Failed to submit code. Please try again.');
                setLoading(false);
                setStreamProgress(null);
                return;
              }
              console.warn('Streaming error, falling back to standard submit:', err.message);
              fallbackSubmit();
            },
          }
        );
        if (!navigated && !handledError) {
          setLoading(false);
          setStreamProgress(null);
        }
      } catch (err) {
        if (!handledError) {
          console.warn('Streaming exception, falling back to standard submit:', err?.message);
          fallbackSubmit();
        }
      }
    } else {
      fallbackSubmit();
    }
  };

  const fallbackSubmit = async () => {
    try {
      const res = await reviewService.submit({ language, code, ...(assignmentId ? { assignmentId } : {}) });
      const reviewId = res.data?.data?._id || res.data?._id;
      if (reviewId) {
        clearStoredDraft();
        navigate(`/dashboard/review/${reviewId}`);
      } else {
        setError('Review generated but could not open detail. Please check Review History.');
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit code. Please try again.');
      setLoading(false);
      setStreamProgress(null);
    }
  };

  useEffect(() => {
    submitRef.current = handleSubmit;
  });

  const handleEditorDidMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      submitRef.current?.();
    });
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            30 Languages Supported
          </span>
          {!isDefaultTemplate && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              Draft auto-saved
            </span>
          )}
          {uploadedFileName && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200 flex items-center gap-1">
              <FileCode2 size={12} /> {uploadedFileName}
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">AI Code Review</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Select any of the 30 programming languages or drop a code file into the editor for instant AI feedback
        </p>
      </div>

      {assignmentId && (
        <div className="card p-3.5 bg-primary-50/80 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800/60 flex items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-primary-900 dark:text-primary-100">
            <span className="font-semibold">Solving Assignment:</span> {assignmentTitle || 'Course Assignment'}
          </div>
          <span className="badge badge-blue text-[11px]">Linked Submission</span>
        </div>
      )}

      {/* Language selector & Stream mode */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <Globe size={14} className="text-primary-600 dark:text-primary-400" />
            <span>Select Programming Language ({ALL_LANGUAGES.length})</span>
          </label>

          {/* SSE Streaming Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-gray-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="flex items-center gap-1">
              <Radio size={14} className={useStreaming ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'} />
              Live Stream (SSE)
            </span>
          </label>
        </div>

        {/* Quick Popular Pills + All 30 Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {POPULAR_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                language === lang
                  ? 'border-primary-600 bg-primary-600 text-white shadow-xs'
                  : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-primary-400 bg-white dark:bg-slate-800 dark:hover:bg-slate-700'
              }`}
            >
              {getLanguageLabel(lang)}
            </button>
          ))}

          {/* All 30 Languages Dropdown */}
          <div className="relative inline-block ml-auto">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 shadow-2xs hover:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            >
              <option value="" disabled>Browse all 30 languages...</option>
              {ALL_LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.category})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Monaco Editor Card (supports drag-and-drop file upload) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDragging) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragging(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const droppedFile = e.dataTransfer?.files?.[0];
          if (droppedFile) handleFileImport(droppedFile);
        }}
        className={`relative card overflow-hidden transition-all duration-200 ${
          isExpanded ? 'ring-2 ring-primary-500 shadow-xl' : ''
        } ${isDragging ? 'ring-2 ring-primary-500' : ''}`}
      >
        {isDragging && (
          <div className="absolute inset-0 z-30 bg-primary-900/80 backdrop-blur-[1px] flex flex-col items-center justify-center text-white pointer-events-none">
            <Upload size={34} className="mb-2 animate-bounce" />
            <p className="text-sm font-semibold">Drop your source file here to load it into the editor</p>
            <p className="text-xs text-primary-200 mt-1">
              Supports .py, .js, .ts, .java, .cpp, .c, .cs, .go, .rs, .sql, .kt (max 100 KB / 15,000 chars)
            </p>
          </div>
        )}
        {/* Editor Toolbar */}
        <div className={`flex items-center justify-between px-4 py-2.5 border-b ${editorTheme === 'vs-dark' ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            </div>
            <span className="text-xs font-mono font-medium">
              Monaco Editor • <span className="text-primary-400 font-bold">{getLanguageLabel(language)}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Font size picker */}
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className={`rounded px-2 py-0.5 border text-xs font-mono ${
                editorTheme === 'vs-dark'
                  ? 'bg-gray-800 border-gray-700 text-gray-200'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
            </select>

            {/* Monaco Theme Switcher (Dark / Light) */}
            <button
              onClick={() => setEditorTheme((p) => (p === 'vs-dark' ? 'vs-light' : 'vs-dark'))}
              title={`Switch to ${editorTheme === 'vs-dark' ? 'VS Light' : 'VS Dark'} theme`}
              className={`flex items-center gap-1 px-2.5 py-1 rounded border transition-colors ${
                editorTheme === 'vs-dark'
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-yellow-400'
                  : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              {editorTheme === 'vs-dark' ? <Sun size={13} /> : <Moon size={13} />}
              <span className="font-mono text-[11px]">{editorTheme === 'vs-dark' ? 'Dark' : 'Light'}</span>
            </button>

            {/* Expand / Minimize Height */}
            <button
              onClick={() => setIsExpanded((p) => !p)}
              title={isExpanded ? 'Shrink Editor' : 'Expand Editor'}
              className="p-1 rounded hover:opacity-80 transition-opacity"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Character & Line Counters */}
            <span className={`font-mono ${lines > MAX_LINES ? 'text-red-500 font-bold' : ''}`}>
              {lines}/{MAX_LINES}L
            </span>
            <span className={`font-mono ${chars > MAX_CHARS ? 'text-red-500 font-bold' : ''}`}>
              {chars}/{MAX_CHARS}C
            </span>
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div className={`w-full transition-all duration-200 ${isExpanded ? 'h-[550px]' : 'h-96'}`}>
          <Editor
            height="100%"
            language={getMonacoLanguage(language)}
            value={code}
            onChange={(val) => {
              setCode(val || '');
              if (error) setError('');
            }}
            onMount={handleEditorDidMount}
            theme={editorTheme}
            loading={
              <div className={`flex flex-col items-center justify-center h-full space-y-2 ${editorTheme === 'vs-dark' ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                <LoadingSpinner size="md" />
                <span className="text-xs font-mono">Loading Monaco Editor ({getLanguageLabel(language)})...</span>
              </div>
            }
            options={{
              fontSize,
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
              fontLigatures: true,
              minimap: { enabled: isExpanded },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              tabSize: 2,
              wordWrap: 'on',
              automaticLayout: true,
              bracketPairColorization: { enabled: true },
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              formatOnPaste: true,
              formatOnType: true,
              padding: { top: 12, bottom: 12 },
              renderLineHighlight: 'all',
            }}
          />
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".py,.js,.jsx,.mjs,.ts,.tsx,.java,.cpp,.cc,.cxx,.hpp,.c,.h,.cs,.go,.rs,.sql,.kt,.kts"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileImport(f);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="btn btn-secondary btn-sm gap-1.5"
            >
              <Upload size={14} /> Upload File
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="btn btn-secondary btn-sm gap-1.5 text-gray-600 dark:text-slate-300"
            >
              <Trash2 size={14} /> Clear Code
            </button>
            <span className="text-[11px] text-gray-400 dark:text-slate-400 font-mono hidden sm:inline">
              Shortcut: <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded text-[10px]">Enter</kbd>
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isEmpty || isOverLimit || loading}
            className="btn btn-primary gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Reviewing {getLanguageLabel(language)}...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Submit for AI Review</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Streaming / Loading Progress Banner */}
      {loading && (
        <div className="card p-4 bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/60 flex items-center gap-3 animate-pulse">
          <LoadingSpinner size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">
              {streamProgress || `Gemini AI is analyzing ${getLanguageLabel(language)} code structure and identifying bugs...`}
            </p>
            <p className="text-xs text-primary-700 dark:text-primary-300 mt-0.5">
              Evaluating bugs, step-by-step flow, time/space complexity, call hierarchy, and function breakdown.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="card p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-200 text-sm flex items-start gap-2.5">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-semibold">Invalid Code Submission</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}


