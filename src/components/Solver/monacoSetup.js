import * as monaco from 'monaco-editor/editor/editor.main.js';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import TypeScriptWorker from 'monaco-editor/languages/features/typescript/ts.worker.js?worker';
import { loader } from '@monaco-editor/react';

self.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    if (label === 'javascript' || label === 'typescript') return new TypeScriptWorker();
    return new EditorWorker();
  },
};
loader.config({ monaco });
