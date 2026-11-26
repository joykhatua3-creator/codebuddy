const vm = require('vm');

const CODE_HINT_KEYWORDS = new Set([
  'abstract', 'async', 'await', 'begin', 'bool', 'boolean', 'break', 'case', 'catch',
  'char', 'class', 'console', 'const', 'continue', 'contract', 'cout', 'create', 'def',
  'default', 'delete', 'disp', 'do', 'double', 'echo', 'elif', 'else', 'end', 'enum',
  'except', 'export', 'extends', 'false', 'finally', 'float', 'fn', 'for', 'from',
  'fun', 'func', 'function', 'global', 'if', 'impl', 'implements', 'import', 'include',
  'insert', 'int', 'interface', 'let', 'local', 'loop', 'main', 'match', 'module',
  'mov', 'mut', 'namespace', 'new', 'none', 'null', 'package', 'pragma', 'print',
  'printf', 'println', 'private', 'proc', 'public', 'pub', 'puts', 'raise', 'require',
  'return', 'section', 'select', 'self', 'static', 'std', 'str', 'string', 'struct',
  'switch', 'syscall', 'System', 'this', 'throw', 'true', 'try', 'type', 'typedef',
  'undefined', 'update', 'use', 'using', 'val', 'var', 'void', 'where', 'while', 'with',
]);

const CODE_SYNTAX_PATTERN = /[=(){}\[\];<>+\-*/%&|^~!@#$:\\]|->|=>|::|:=|\.\./;

/**
 * Check whether user input looks like source code rather than plain prose or keyboard mash.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
const validateCodeInput = (code) => {
  const trimmed = (code || '').trim();
  if (trimmed.length < 5) {
    return { valid: false, reason: 'Code must be at least 5 non-whitespace characters.' };
  }

  // Reject single repeated character spam (e.g., "aaaaaaaaaa" or ";;;;;;;;;;")
  if (/^(.)\1+$/.test(trimmed.replace(/\s+/g, ''))) {
    return {
      valid: false,
      reason: 'Please enter valid programming code to review (repeated character input detected).',
    };
  }

  // Must contain at least some alphanumeric content
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return {
      valid: false,
      reason: 'Please enter valid programming code to review.',
    };
  }

  const hasSyntaxChars = CODE_SYNTAX_PATTERN.test(trimmed);
  const words = trimmed.split(/[^a-zA-Z0-9_]+/).filter(Boolean);
  const hasKeyword = words.some((w) => CODE_HINT_KEYWORDS.has(w) || CODE_HINT_KEYWORDS.has(w.toLowerCase()));

  if (!hasSyntaxChars && !hasKeyword) {
    return {
      valid: false,
      reason:
        'Input does not appear to be valid programming code. Please paste actual source code (with syntax, keywords, or expressions) to review.',
    };
  }

  return { valid: true };
};

/**
 * Strip top-level ES module import/export keywords so vm.Script can syntax-check browser/ESM JS.
 */
const prepareJsForSyntaxCheck = (code) => {
  return code
    .replace(/^\s*import\s+[\s\S]*?;\s*$/gm, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^\s*import\s+[^\n;]+$/gm, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s+(?=(?:async\s+)?(?:function|const|let|var|class)\b)/gm, '');
};

/**
 * Parse JavaScript syntax safely using Node's vm.Script (compile-only, never executes code).
 */
const checkJavaScriptSyntax = (code) => {
  const candidates = [code];
  const stripped = prepareJsForSyntaxCheck(code);
  if (stripped !== code) candidates.push(stripped);

  for (let i = 0; i < candidates.length; i++) {
    try {
      // eslint-disable-next-line no-new
      new vm.Script(candidates[i], { filename: 'submission.js' });
      return null; // Valid JS syntax
    } catch (err) {
      // If raw code failed only because of ESM import/export, try the stripped version
      const isEsmLoaderMsg =
        i === 0 &&
        candidates.length > 1 &&
        /Cannot use import statement outside a module|Unexpected token 'export'/.test(err.message);
      if (isEsmLoaderMsg) continue;

      const lineMatch = err.stack?.match(/submission\.js:(\d+)/);
      const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : 1;
      return {
        title: `Syntax Error: ${err.message}`,
        lineNumber,
        description: `JavaScript failed to parse at line ${lineNumber}: ${err.message}.`,
        whyItHappens:
          'A syntax error violates JavaScript grammar rules (such as a missing bracket, unclosed string, misplaced token, or invalid expression), preventing the code from running.',
        hint: `Inspect line ${lineNumber} (and the lines immediately above it) for missing brackets, quotes, commas, or typos.`,
        solution: `// Fix the syntax error near line ${lineNumber}: ${err.message}`,
        isCritical: true,
      };
    }
  }
  return null;
};

const BRACE_LANGUAGES = new Set([
  'javascript', 'typescript', 'java', 'cpp', 'c', 'csharp', 'go', 'rust',
  'kotlin', 'swift', 'dart', 'php', 'scala', 'zig', 'solidity', 'groovy',
]);
const HASH_COMMENT_LANGUAGES = new Set(['python', 'ruby', 'bash', 'perl', 'r', 'elixir', 'julia', 'mojo']);
const DASH_COMMENT_LANGUAGES = new Set(['sql', 'lua', 'haskell']);
const BACKTICK_STRING_LANGUAGES = new Set(['javascript', 'typescript', 'go']);

/**
 * Scan for unbalanced (), {}, [] and unclosed string literals across lines.
 */
const checkDelimitersAndStrings = (code, language) => {
  const issues = [];
  const stack = [];
  const pairs = { '(': ')', '{': '}', '[': ']' };
  const closingToOpening = { ')': '(', '}': '{', ']': '[' };
  const lines = code.split('\n');
  const isHashCommentLang = HASH_COMMENT_LANGUAGES.has(language);
  const isDashCommentLang = DASH_COMMENT_LANGUAGES.has(language);
  const isBacktickLang = BACKTICK_STRING_LANGUAGES.has(language);
  const isMatlab = language === 'matlab';
  const isAssembly = language === 'assembly';
  const allowSingleQuotes = language !== 'rust';

  let inBlockComment = false;
  let inBacktick = false;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineNum = lineIdx + 1;
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const next = line[i + 1];

      if (inBlockComment) {
        if (ch === '*' && next === '/') {
          inBlockComment = false;
          i++;
        }
        continue;
      }

      if (inBacktick) {
        if (ch === '\\') { i++; continue; }
        if (ch === '`') inBacktick = false;
        continue;
      }

      if (inSingle) {
        if (ch === '\\') { i++; continue; }
        if (ch === "'") inSingle = false;
        continue;
      }

      if (inDouble) {
        if (ch === '\\') { i++; continue; }
        if (ch === '"') inDouble = false;
        continue;
      }

      // Comment detection
      if (ch === '/' && next === '/') break;
      if (ch === '/' && next === '*') { inBlockComment = true; i++; continue; }
      if (ch === '#' && isHashCommentLang) break;
      if (ch === '-' && next === '-' && isDashCommentLang) break;
      if (ch === '%' && isMatlab) break;
      if (ch === ';' && isAssembly) break;

      // String literal start
      if (ch === '"') { inDouble = true; continue; }
      if (ch === "'" && allowSingleQuotes) { inSingle = true; continue; }
      if (ch === '`' && isBacktickLang) { inBacktick = true; continue; }

      // Brackets
      if (pairs[ch]) {
        stack.push({ char: ch, line: lineNum });
      } else if (closingToOpening[ch]) {
        const expectedOpen = closingToOpening[ch];
        const top = stack[stack.length - 1];
        if (!top || top.char !== expectedOpen) {
          issues.push({
            title: `Unexpected closing '${ch}'`,
            lineNumber: lineNum,
            description: `Found '${ch}' at line ${lineNum} without a matching opening '${expectedOpen}'.`,
            whyItHappens: 'Mismatched or extra closing brackets break code block structure and cause parse errors.',
            hint: `Check line ${lineNum} for an extra '${ch}' or a missing '${expectedOpen}' earlier in the code.`,
            solution: `// Ensure '${expectedOpen}' and '${ch}' are properly balanced around line ${lineNum}`,
            isCritical: true,
          });
          if (issues.length >= 3) return issues;
        } else {
          stack.pop();
        }
      }
    }

    if (inDouble || inSingle) {
      const quoteChar = inDouble ? '"' : "'";
      issues.push({
        title: `Unterminated string literal (${quoteChar})`,
        lineNumber: lineNum,
        description: `A string opened with ${quoteChar} on line ${lineNum} is never closed on that line.`,
        whyItHappens: 'Single-line string literals must have a matching closing quote before the end of the line.',
        hint: `Add the missing closing ${quoteChar} quote on line ${lineNum}.`,
        solution: `${line}${quoteChar}`,
        isCritical: true,
      });
      if (issues.length >= 3) return issues;
    }
  }

  if (inBacktick) {
    issues.push({
      title: 'Unterminated template literal (`)',
      lineNumber: lines.length,
      description: 'A backtick template string is opened but never closed.',
      whyItHappens: 'Every opening backtick (`) requires a matching closing backtick (`).',
      hint: 'Close the template string with a matching backtick (`).',
      solution: '// Add closing backtick ` at the end of the template string',
      isCritical: true,
    });
  }

  if (stack.length > 0 && issues.length < 3) {
    const unclosed = stack[stack.length - 1];
    issues.push({
      title: `Unclosed '${unclosed.char}'`,
      lineNumber: unclosed.line,
      description: `The '${unclosed.char}' opened on line ${unclosed.line} is never closed with '${pairs[unclosed.char]}'.`,
      whyItHappens: 'Every opening bracket, brace, or parenthesis must have a matching closing delimiter.',
      hint: `Add the missing '${pairs[unclosed.char]}' to close the block started on line ${unclosed.line}.`,
      solution: `// Add missing '${pairs[unclosed.char]}' to match '${unclosed.char}' on line ${unclosed.line}`,
      isCritical: true,
    });
  }

  return issues;
};

/**
 * Detect obvious cross-language mismatches (e.g., Python submitted as JavaScript or vice versa).
 */
const checkLanguageMismatch = (code, language) => {
  if (language === 'javascript' || language === 'typescript') {
    if (/^\s*def\s+\w+\s*\([^)]*\)\s*:/m.test(code) || /^\s*elif\s+/m.test(code)) {
      return {
        title: 'Python syntax used in JavaScript/TypeScript mode',
        lineNumber: 1,
        description: 'This code uses Python keywords (`def ...:` or `elif`) while JavaScript/TypeScript is selected.',
        whyItHappens: 'Selected language must match the syntax of the submitted code.',
        hint: 'Switch the language selector to Python, or rewrite the function using `function` / `=>` and `{}` braces.',
        solution: '// Switch language to Python or convert `def` blocks to JavaScript `function (...) { ... }`',
        isCritical: true,
      };
    }
  }
  if (language === 'python') {
    if (/\bconsole\.log\s*\(/.test(code) || /#include\s*</.test(code) || /\bpublic\s+static\s+void\s+main\b/.test(code)) {
      return {
        title: 'Non-Python syntax detected in Python mode',
        lineNumber: 1,
        description: 'Found JavaScript, Java, or C/C++ syntax (`console.log`, `#include`, or `public static void main`) while Python is selected.',
        whyItHappens: 'The submitted syntax belongs to another programming language.',
        hint: 'Select the matching language in the dropdown or rewrite using Python syntax (`print(...)`, `def ...:`).',
        solution: '# Select the correct language or rewrite using Python syntax',
        isCritical: true,
      };
    }
  }
  if (language !== 'sql' && /^\s*(SELECT\s+.+\s+FROM\s+|INSERT\s+INTO\s+|CREATE\s+TABLE\s+)/im.test(code) && !/["'`].*SELECT/i.test(code)) {
    return {
      title: 'SQL query submitted under non-SQL language',
      lineNumber: 1,
      description: `This appears to be a SQL query, but '${language}' is currently selected.`,
      whyItHappens: 'SQL statements are not valid syntax in general-purpose languages outside string literals.',
      hint: 'Switch the language selector to SQL for accurate SQL review.',
      solution: '-- Switch the language selector to SQL',
      isCritical: true,
    };
  }
  return null;
};

const NON_FUNCTION_KEYWORDS = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'else', 'elif', 'try', 'with', 'do', 'typeof', 'sizeof',
]);

/**
 * Extract function/method definitions and inter-function call relationships for fallback study notes.
 */
const extractFunctionsAndCallGraph = (code, language) => {
  const lines = code.split('\n');
  const defs = [];
  const seenNames = new Set();

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;
    let match = null;
    if (language === 'python' || language === 'ruby' || language === 'mojo') {
      match = line.match(/^\s*(?:async\s+)?def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
    } else if (language === 'javascript' || language === 'typescript') {
      match =
        line.match(/^\s*(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/) ||
        line.match(/^\s*(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_]\w*)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/);
    } else if (language === 'go') {
      match = line.match(/^\s*func\s+(?:\([^)]*\)\s*)?([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
    } else if (language === 'rust') {
      match = line.match(/^\s*(?:pub\s+)?(?:async\s+)?fn\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
    } else {
      match =
        line.match(/^\s*(?:(?:public|private|protected|static|final|inline|virtual|override|async|suspend)\s+)*(?:[\w<>\[\]*&:]+\s+)?([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*(?:->\s*[^{]+)?\{/) ||
        line.match(/^\s*fun\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/);
    }

    if (match && !NON_FUNCTION_KEYWORDS.has(match[1])) {
      const name = match[1];
      if (!seenNames.has(`${name}:${idx}`)) {
        seenNames.add(`${name}:${idx}`);
        defs.push({ name, parameters: (match[2] || '').trim() || 'None', startLine: idx, indent });
      }
    }
  }

  const functionBreakdown = defs.map((fn, i) => {
    let endLine = i + 1 < defs.length ? defs[i + 1].startLine - 1 : lines.length - 1;
    if (language === 'python' || language === 'mojo') {
      for (let k = fn.startLine + 1; k < lines.length; k++) {
        const l = lines[k];
        if (!l.trim() || l.trim().startsWith('#')) continue;
        const lIndent = l.length - l.trimStart().length;
        if (lIndent <= fn.indent) {
          endLine = k - 1;
          break;
        }
      }
    }
    const bodyLines = lines.slice(fn.startLine + 1, endLine + 1);
    const bodyText = bodyLines.join('\n');
    const returnMatch = bodyText.match(/\breturn\s+([^\n;]+)/);
    const returns = returnMatch
      ? `Returns ${returnMatch[1].trim().slice(0, 60)}`
      : /\breturn\b/.test(bodyText)
        ? 'Returns early / None'
        : 'None / void';

    const hasLoop = /\b(for|while)\b/.test(bodyText);
    const hasBranch = /\b(if|elif|else|switch|match)\b/.test(bodyText);
    const parts = [];
    parts.push(
      fn.parameters === 'None'
        ? `Runs ${fn.name}() with no input parameters`
        : `Accepts (${fn.parameters}) as input`
    );
    if (hasLoop) parts.push('iterates through data using a loop');
    if (hasBranch) parts.push('checks conditional branches');
    if (returnMatch) parts.push(`returns ${returnMatch[1].trim().slice(0, 40)}`);

    return {
      name: fn.name,
      parameters: fn.parameters,
      returns,
      explanation: `${parts.join(', ')}.`,
      _bodyText: bodyText,
      _startLine: fn.startLine,
      _endLine: endLine,
    };
  });

  const definedNames = defs.map((d) => d.name);
  const callGraph = [];
  const edgeKeys = new Set();

  for (const callerFn of functionBreakdown) {
    for (const calleeName of definedNames) {
      if (calleeName === callerFn.name) continue;
      const callRegex = new RegExp(`\\b${calleeName}\\s*\\(`);
      if (callRegex.test(callerFn._bodyText)) {
        const key = `${callerFn.name}->${calleeName}`;
        if (!edgeKeys.has(key)) {
          edgeKeys.add(key);
          callGraph.push({
            caller: callerFn.name,
            callee: calleeName,
            purpose: `${callerFn.name}() invokes ${calleeName}() as part of its workflow.`,
          });
        }
      }
    }
  }

  const coveredLines = new Set();
  for (const fn of functionBreakdown) {
    for (let l = fn._startLine; l <= fn._endLine; l++) coveredLines.add(l);
  }
  const topLevelLines = lines
    .filter((_, idx) => !coveredLines.has(idx) && !/^\s*(#|\/\/)/.test(lines[idx]))
    .join('\n');
  for (const calleeName of definedNames) {
    const callRegex = new RegExp(`\\b${calleeName}\\s*\\(`);
    if (callRegex.test(topLevelLines)) {
      const key = `main/script->${calleeName}`;
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key);
        callGraph.push({
          caller: 'script',
          callee: calleeName,
          purpose: `Top-level entry script calls ${calleeName}().`,
        });
      }
    }
  }

  return {
    functionBreakdown: functionBreakdown.map(({ _bodyText, _startLine, _endLine, ...clean }) => clean),
    callGraph,
  };
};

/**
 * Comprehensive multi-language static & syntax code analyzer.
 * Used both as an instant syntax verifier and as the resilient fallback when AI is unavailable.
 */
const analyzeCodeStatically = (code, language) => {
  const lines = code.split('\n');
  const bugs = [];
  const security = [];
  const concepts = [];

  // 1. Language mismatch check
  const mismatch = checkLanguageMismatch(code, language);
  if (mismatch) bugs.push(mismatch);

  // 2. JavaScript native AST/syntax check via vm.Script
  if (language === 'javascript') {
    const jsSyntaxErr = checkJavaScriptSyntax(code);
    if (jsSyntaxErr) bugs.push(jsSyntaxErr);
  }

  // 3. Delimiters & unclosed string checks (avoid duplicating JS vm.Script if JS already caught syntax error)
  if (language !== 'javascript' || bugs.length === 0) {
    const delimiterIssues = checkDelimitersAndStrings(code, language);
    for (const issue of delimiterIssues) {
      bugs.push(issue);
    }
  }

  // 4. Line-by-line language-specific static checks
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) return;

    // Common typos across languages
    const typoMatch = trimmed.match(/\b(retrun|fucntion|cosnt|consoel|documnet|pritn|pubilc|viod|improt)\b/);
    if (typoMatch) {
      const corrections = {
        retrun: 'return',
        fucntion: 'function',
        cosnt: 'const',
        consoel: 'console',
        documnet: 'document',
        pritn: 'print',
        pubilc: 'public',
        viod: 'void',
        improt: 'import',
      };
      const bad = typoMatch[1];
      const fixed = corrections[bad];
      bugs.push({
        title: `Misspelled keyword/identifier '${bad}'`,
        lineNumber: lineNum,
        description: `Line ${lineNum} contains a typo '${bad}' instead of '${fixed}'.`,
        whyItHappens: 'Misspelled language keywords cause syntax or undefined-reference errors.',
        hint: `Replace '${bad}' with '${fixed}'.`,
        solution: line.replace(new RegExp(`\\b${bad}\\b`, 'g'), fixed),
        isCritical: true,
      });
    }

    // Literal division by zero
    if (/[^/'"`]\s*\/\s*0(?![.\dxX])/.test(line) && !trimmed.startsWith('/*')) {
      bugs.push({
        title: 'Division by zero',
        lineNumber: lineNum,
        description: `Line ${lineNum} divides by literal 0, which causes Infinity/NaN or a runtime ZeroDivisionError/crash.`,
        whyItHappens: 'Dividing by zero is mathematically undefined and fails at runtime in most languages.',
        hint: 'Ensure the divisor is non-zero or add a guard condition before dividing.',
        solution: '// Guard against zero divisor before dividing',
        isCritical: true,
      });
    }

    // Assignment inside if/while condition (C-like & JS)
    if (BRACE_LANGUAGES.has(language) && /\b(?:if|while)\s*\(\s*[a-zA-Z_]\w*\s*=\s*[^=<>!]/.test(trimmed)) {
      bugs.push({
        title: 'Assignment (=) used inside condition',
        lineNumber: lineNum,
        description: `Line ${lineNum} uses a single '=' inside a condition instead of a comparison operator ('==' or '===').`,
        whyItHappens: 'Single "=" assigns a value rather than comparing values, which is almost always an unintended bug.',
        hint: "Use '===' (in JS/TS) or '==' to compare values instead of '='.",
        solution: line.replace(/(\b(?:if|while)\s*\(\s*[a-zA-Z_]\w*\s*)=([^=])/, '$1==$2'),
        isCritical: true,
      });
    }

    if (language === 'javascript') {
      if (/(^|[^=!<>])==([^=]|$)/.test(line)) {
        bugs.push({
          title: 'Loose equality comparison (==)',
          lineNumber: lineNum,
          description: 'Using loose equality (==) allows implicit type coercion which can trigger unexpected bugs.',
          whyItHappens: 'JavaScript converts types before comparing with ==, leading to subtle bugs like 0 == "".',
          hint: 'Use strict equality (===) to compare both value and type without coercion.',
          solution: line.replace(/(^|[^=!<>])==([^=]|$)/g, '$1===$2'),
        });
      }
      if (trimmed.startsWith('var ')) {
        bugs.push({
          title: 'Use of legacy var declaration',
          lineNumber: lineNum,
          description: 'Variables declared with var are function-scoped and hoisted, which can cause scope pollution.',
          whyItHappens: 'var does not respect block scope ({ ... }), leading to variable leakage across blocks.',
          hint: 'Use let for mutable variables or const for immutable variables.',
          solution: line.replace(/\bvar\b/g, 'let'),
        });
      }
    }

    if (language === 'python') {
      if (/^(?:def|class|if|elif|else|for|while|try|except|finally|with)\b.*[^:\s\\]$/.test(trimmed) && !trimmed.includes(':')) {
        bugs.push({
          title: 'Missing colon (:) at end of Python block header',
          lineNumber: lineNum,
          description: `Line ${lineNum} starts a Python block statement without a trailing ':'.`,
          whyItHappens: 'Python requires a colon at the end of def, class, if, for, while, try, and except headers.',
          hint: `Add ':' at the end of line ${lineNum}.`,
          solution: `${line}:`,
          isCritical: true,
        });
      }
      if (/^\s*print\s+["']/.test(line)) {
        bugs.push({
          title: 'Python 2 print statement without parentheses',
          lineNumber: lineNum,
          description: 'In Python 3, print is a function and requires parentheses.',
          whyItHappens: 'Calling print without parentheses raises a SyntaxError in Python 3.',
          hint: 'Wrap the printed expression in parentheses: print(...).',
          solution: line.replace(/print\s+(.+)/, 'print($1)'),
          isCritical: true,
        });
      }
      if (/^\s*except\s*:/.test(line)) {
        bugs.push({
          title: 'Bare except clause catches all exceptions',
          lineNumber: lineNum,
          description: 'Using bare `except:` catches KeyboardInterrupt and SystemExit, hiding real bugs.',
          whyItHappens: 'No exception class is specified after except.',
          hint: 'Catch a specific exception like `except Exception as e:` so errors are properly handled.',
          solution: line.replace(/except\s*:/, 'except Exception as e:'),
        });
      }
      if (/def\s+\w+\([^)]*=\s*(\[\]|\{\})/.test(line)) {
        bugs.push({
          title: 'Mutable default argument in function',
          lineNumber: lineNum,
          description: 'Default list/dict arguments in Python are shared across all function calls.',
          whyItHappens: 'Python evaluates default arguments once at function definition time, not on every call.',
          hint: 'Use `None` as the default value and initialize inside the function.',
          solution: line.replace(/=\s*(\[\]|\{\})/, '=None'),
        });
      }
    }

    if ((language === 'c' || language === 'cpp') && /\b(gets|strcpy|sprintf)\s*\(/.test(line)) {
      bugs.push({
        title: 'Unsafe buffer operation detected',
        lineNumber: lineNum,
        description: 'Unbounded string/input functions like gets() or strcpy() can cause buffer overflows.',
        whyItHappens: 'These functions do not check destination buffer boundaries.',
        hint: 'Use bounded alternatives like fgets(), strncpy(), or snprintf().',
        solution: line.replace(/\bgets\(/, 'fgets(').replace(/\bstrcpy\(/, 'strncpy('),
      });
    }

    if (language === 'sql') {
      if (/SELECT\s+\*/i.test(line)) {
        bugs.push({
          title: 'Avoid SELECT * in production queries',
          lineNumber: lineNum,
          description: 'Selecting all columns increases I/O and memory usage and can break consumers if schema changes.',
          whyItHappens: 'Wildcard column selection fetches unnecessary columns.',
          hint: 'Explicitly list only the required column names.',
          solution: line.replace(/SELECT\s+\*/i, 'SELECT id, name'),
        });
      }
      if (/^\s*(DELETE\s+FROM|UPDATE)\b/i.test(trimmed) && !/\bWHERE\b/i.test(code)) {
        bugs.push({
          title: 'Destructive SQL statement without WHERE clause',
          lineNumber: lineNum,
          description: 'Running DELETE or UPDATE without a WHERE filter modifies every row in the table.',
          whyItHappens: 'Omitting WHERE applies the mutation to the entire table.',
          hint: 'Add a specific WHERE condition to target only the intended rows.',
          solution: `${trimmed.replace(/;$/, '')} WHERE id = ?;`,
          isCritical: true,
        });
      }
    }

    if ((line.includes('while (true)') || line.includes('while(true)') || /^\s*while\s+True\s*:/.test(line)) && !code.includes('break') && !code.includes('return')) {
      bugs.push({
        title: 'Potential infinite loop without break',
        lineNumber: lineNum,
        description: 'An infinite loop without an explicit break or return will run indefinitely and hang execution.',
        whyItHappens: 'The loop condition never evaluates to false.',
        hint: 'Include a termination condition or break/return statement inside the loop.',
        solution: '// Add a termination condition and break/return inside the loop',
        isCritical: true,
      });
    }
  });

  if (code.includes('eval(')) {
    security.push({
      issue: 'Use of eval()',
      severity: 'high',
      recommendation: 'Never use eval() on dynamic or untrusted input as it exposes code injection vulnerabilities.',
    });
  }

  // Detect concepts
  const hasCriticalErrors = bugs.some((b) => b.isCritical);
  if (hasCriticalErrors) {
    concepts.push({ name: 'Syntax & Debugging', level: 'weak' });
  }
  if (code.includes('function') || code.includes('def ') || code.includes('=>') || code.includes('fn ')) {
    concepts.push({ name: 'Functions', level: hasCriticalErrors ? 'ok' : 'strong' });
  }
  if (code.includes('for') || code.includes('while') || code.includes('loop')) {
    concepts.push({ name: 'Loops', level: hasCriticalErrors ? 'ok' : 'strong' });
  }
  if (code.includes('let ') || code.includes('const ') || code.includes('var ') || code.includes('=')) {
    concepts.push({ name: 'Variables and Data Types', level: hasCriticalErrors ? 'ok' : 'strong' });
  }
  if (code.includes('class ') || code.includes('struct ') || code.includes('interface ')) {
    concepts.push({ name: 'OOP', level: 'ok' });
  }
  if (code.includes('async ') || code.includes('await ') || code.includes('Promise')) {
    concepts.push({ name: 'Async/Await', level: 'ok' });
  }
  if (code.includes('try') || code.includes('catch') || code.includes('except')) {
    concepts.push({ name: 'Exception Handling', level: 'ok' });
  }
  if (concepts.length === 0) {
    concepts.push({ name: 'Variables and Data Types', level: hasCriticalErrors ? 'weak' : 'ok' });
  }

  // Detect complexity
  const loopCount = (code.match(/\b(for|while)\b/g) || []).length;
  let time = 'O(1)';
  const space = 'O(1)';
  let timeReason = 'Operations execute sequentially without iterating over input collections, so runtime stays constant O(1).';
  const spaceReason = 'Uses only a fixed amount of helper variables in memory regardless of input size.';
  let explanation = timeReason;
  if (loopCount === 1) {
    time = 'O(n)';
    timeReason = 'A single loop walks across each element of the input once, scaling linearly with input size n.';
    explanation = timeReason;
  } else if (loopCount >= 2) {
    time = 'O(n^2)';
    timeReason = 'Multiple or nested loops run across pairs or repeated passes over the data, causing quadratic O(n^2) growth.';
    explanation = timeReason;
  }

  const { functionBreakdown, callGraph } = extractFunctionsAndCallGraph(code, language);

  const howItWorks = [];
  if (functionBreakdown.length > 0) {
    howItWorks.push(
      `Defines ${functionBreakdown.length} function${functionBreakdown.length > 1 ? 's' : ''}: ${functionBreakdown
        .map((f) => `${f.name}(${f.parameters === 'None' ? '' : f.parameters})`)
        .join(', ')}.`
    );
  } else {
    howItWorks.push(`Executes ${language} statements sequentially from top to bottom.`);
  }
  if (loopCount > 0) {
    howItWorks.push(`Uses ${loopCount} loop construct${loopCount > 1 ? 's' : ''} to process items repeatedly.`);
  }
  if (/\b(if|elif|else|switch)\b/.test(code)) {
    howItWorks.push('Evaluates conditional checks to branch execution based on runtime values.');
  }
  if (callGraph.length > 0) {
    howItWorks.push(
      `Coordinates execution via function calls (${callGraph
        .slice(0, 3)
        .map((c) => `${c.caller}() -> ${c.callee}()`)
        .join(', ')}).`
    );
  }
  if (bugs.length > 0) {
    howItWorks.push(`Warning: ${bugs.length} static/syntax issue${bugs.length > 1 ? 's were' : ' was'} spotted that can affect expected behavior.`);
  }

  const criticalCount = bugs.filter((b) => b.isCritical).length;
  const minorCount = bugs.length - criticalCount;
  const errors = bugs.map((b) => ({
    line: b.lineNumber || 0,
    severity: b.isCritical ? 'ERROR' : 'WARNING',
    title: b.title,
    explanation: b.whyItHappens || b.description,
    fix: b.solution || b.hint,
  }));
  const cleanedBugs = bugs.map(({ isCritical: _isCritical, ...rest }) => rest);

  // Build line-patched improvedCode & improvementNotes when concrete line fixes exist
  const patchedLines = lines.slice();
  const improvementNotes = [];
  for (const b of cleanedBugs) {
    const idx = (b.lineNumber || 1) - 1;
    if (
      b.lineNumber > 0 &&
      idx >= 0 &&
      idx < patchedLines.length &&
      b.solution &&
      !b.solution.trim().startsWith('//') &&
      !b.solution.trim().startsWith('#') &&
      !b.solution.trim().startsWith('--') &&
      !b.solution.includes('\n')
    ) {
      patchedLines[idx] = b.solution;
      improvementNotes.push({
        lineNumber: b.lineNumber,
        explanation: `${b.title}: ${b.hint}`,
      });
    } else if (b.lineNumber > 0) {
      improvementNotes.push({
        lineNumber: b.lineNumber,
        explanation: `${b.title} — ${b.hint}`,
      });
    }
  }
  const improvedCode = patchedLines.join('\n');

  let score;
  let summary;
  if (criticalCount > 0) {
    score = Math.max(15, 45 - (criticalCount - 1) * 10 - minorCount * 5);
    summary = `Errors detected in your ${language} code: found ${cleanedBugs.length} issue(s) (including ${criticalCount} syntax/critical error${criticalCount > 1 ? 's' : ''}) that prevent valid execution. Review the errors and guided hints below.`;
  } else if (cleanedBugs.length > 0) {
    score = Math.max(55, 88 - cleanedBugs.length * 10);
    summary = `Found ${cleanedBugs.length} code quality/logic suggestion(s) in your ${language} code. Review the hints below to improve reliability and best practices.`;
  } else {
    score = 88;
    summary = `No syntax or common static issues were detected in your ${language} snippet. Note: deep semantic AI review was unavailable, so verify edge cases and runtime logic manually.`;
  }

  const qualityScore = (base) => Math.max(2, Math.min(10, base - criticalCount * 3 - minorCount));

  return {
    score,
    summary,
    analysisEngine: 'STATIC_FALLBACK',
    errors,
    howItWorks,
    callGraph,
    functionBreakdown,
    bugs: cleanedBugs,
    codeQuality: {
      readability: {
        score: qualityScore(9),
        comment: criticalCount > 0 ? 'Fix syntax/structural errors to make the code valid and readable.' : 'Indentation and formatting are clear.',
      },
      namingConventions: {
        score: qualityScore(8),
        comment: 'Review identifier spelling and descriptive naming.',
      },
      codeStructure: {
        score: qualityScore(9),
        comment: criticalCount > 0 ? 'Code structure contains syntax or block errors.' : 'Control flow and block structure are well-organized.',
      },
      bestPractices: {
        score: qualityScore(9),
        comment: cleanedBugs.length === 0 ? 'Follows standard coding conventions.' : 'Address the flagged bugs and hints below.',
      },
    },
    complexity: { time, timeReason, space, spaceReason, explanation },
    security,
    concepts,
    improvedCode,
    improvementNotes,
    isFallback: true,
  };
};

module.exports = {
  validateCodeInput,
  analyzeCodeStatically,
};
