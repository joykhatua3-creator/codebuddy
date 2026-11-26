import Editor, { DiffEditor } from '@monaco-editor/react';

export default function LazyMonacoCodeBlock({
  codeViewMode,
  language,
  originalCode,
  improvedCode,
  monacoTheme,
  renderSideBySide,
}) {
  if (codeViewMode === 'diff') {
    return (
      <DiffEditor
        height="100%"
        language={language}
        original={originalCode}
        modified={improvedCode || originalCode}
        theme={monacoTheme}
        options={{
          readOnly: true,
          renderSideBySide,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          overviewRulerLanes: 0,
          renderOverviewRuler: false,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 10, bottom: 10 },
        }}
      />
    );
  }

  return (
    <Editor
      height="100%"
      language={language}
      value={originalCode}
      theme={monacoTheme}
      options={{
        readOnly: true,
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        minimap: { enabled: false },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        wordWrap: 'on',
        automaticLayout: true,
        domReadOnly: true,
        padding: { top: 10, bottom: 10 },
      }}
    />
  );
}
