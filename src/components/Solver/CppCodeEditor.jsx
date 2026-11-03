import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

export default function CppCodeEditor({
  value,
  onChange,
  language = 'cpp',
  readOnly = false,
  height = '420px'
}) {
  const [richEditorReady, setRichEditorReady] = useState(false);
  const usingTextEditor = useRef(false);

  useEffect(() => {
    let mounted = true;
    // Plain text is editable immediately, even if the editor bundle never loads.
    // Keep focus and selection stable if the learner has already started editing.
    import('./monacoSetup.js').then(() => {
      if (mounted && !usingTextEditor.current) setRichEditorReady(true);
    }).catch(() => { /* Keep the plain-text editor available. */ });
    return () => { mounted = false; };
  }, []);

  if (!richEditorReady) {
    return (
      <label className="plain-code-editor" style={{ height }}>
        <span>Plain-text code editor</span>
        <textarea className="editor-textarea" aria-label="Solution code" value={value ?? ''}
          onFocus={() => { usingTextEditor.current = true; }}
          onChange={event => onChange?.(event.target.value)}
          readOnly={readOnly} spellCheck={false} autoCapitalize="off" autoCorrect="off" />
      </label>
    );
  }

  const handleEditorDidMount = (_editor, monaco) => {
    // Define custom dark theme to match AdaptiveDSA #0E0E17 surface
    try {
      monaco.editor.defineTheme('adaptivedsa-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6B6B80', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'A78BFA', fontStyle: 'bold' },
          { token: 'string', foreground: '86EFAC' },
          { token: 'number', foreground: '67E8F9' },
          { token: 'type', foreground: 'FDE047' }
        ],
        colors: {
          'editor.background': '#0E0E17',
          'editor.foreground': '#F5F5FA',
          'editorLineNumber.foreground': '#4B4B60',
          'editorLineNumber.activeForeground': '#A78BFA',
          'editor.selectionBackground': 'rgba(167, 139, 250, 0.25)',
          'editor.lineHighlightBackground': '#171722',
          'editorCursor.foreground': '#A78BFA'
        }
      });
      monaco.editor.setTheme('adaptivedsa-dark');
    } catch (e) {
      // Ignore theme registration error if already set
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height, background: '#0E0E17' }}>
      <Editor
        height={height}
        language={language === 'cpp' ? 'cpp' : 'javascript'}
        value={value}
        onChange={(val) => onChange && onChange(val || '')}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          tabSize: 4,
          readOnly,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          padding: { top: 12, bottom: 12 }
        }}
      />
    </div>
  );
}
