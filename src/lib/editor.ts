import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  HighlightStyle,
  StreamLanguage,
  bracketMatching,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from '@codemirror/language';
import { EditorView, drawSelection, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { tags } from '@lezer/highlight';

const KEYWORDS = new Set(['pub', 'fn', 'extern', 'if', 'while', 'else', 'ret', 'true', 'false']);
const TYPES = new Set(['void', 'bool']);

const flick = StreamLanguage.define<{ depth: number }>({
  name: 'flick',
  startState: () => ({ depth: 0 }),
  token(stream, state) {
    if (stream.eatSpace()) return null;
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }
    // Arbitrary-width integer types such as u8 and i11.
    if (stream.match(/^[iu][1-9]\d*\b/)) return 'typeName';
    if (stream.match(/^[A-Za-z_$][\w$]*/)) {
      const word = stream.current();
      return KEYWORDS.has(word) ? 'keyword' : TYPES.has(word) ? 'typeName' : 'variableName';
    }
    if (stream.match(/^\d+/)) return 'number';
    if (stream.match(/^"(?:[^"\\]|\\.)*"?/)) return 'string';
    if (stream.match(/^[=!<>+\-*/%]=?/)) return 'operator';

    const char = stream.next();
    if (char === '{' || char === '(') state.depth++;
    else if (char === '}' || char === ')') state.depth = Math.max(0, state.depth - 1);
    return null;
  },
  indent(state, textAfter, context) {
    const closes = /^\s*[})]/.test(textAfter);
    return Math.max(0, state.depth - (closes ? 1 : 0)) * context.unit;
  },
  languageData: {
    commentTokens: { line: '//' },
    closeBrackets: { brackets: ['{', '(', '"', "'"] },
    indentOnInput: /^\s*[})]$/,
  },
});

// Colours come from global.css so they follow the theme.
const highlighting = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--syntax-keyword)', fontWeight: '500' },
  { tag: tags.typeName, color: 'var(--syntax-type)' },
  { tag: tags.number, color: 'var(--syntax-number)' },
  { tag: tags.string, color: 'var(--syntax-string)' },
  { tag: tags.operator, color: 'var(--syntax-operator)' },
  { tag: tags.comment, color: 'var(--syntax-comment)', fontStyle: 'italic' },
]);

const theme = EditorView.theme({
  // isolation contains CodeMirror's z-indexed layers (gutters, cursor) so overlays such as the help button sit above them.
  '&': { height: '100%', fontSize: '13.5px', color: 'var(--color-fg)', backgroundColor: 'var(--color-surface)', isolation: 'isolate' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', fontVariantLigatures: 'none', lineHeight: '1.65' },
  '.cm-content': { padding: '12px 0' },
  '.cm-gutters': { backgroundColor: 'var(--color-surface)', color: 'var(--color-faint)', border: 'none' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 12px 0 16px' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--active-line)' },
  '.cm-activeLineGutter': { color: 'var(--color-muted)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--selection)',
  },
  '&.cm-focused .cm-matchingBracket': { backgroundColor: 'var(--selection)', outline: 'none' },
  '.cm-cursor': { borderLeftColor: 'var(--color-accent)', borderLeftWidth: '2px' },
});

export function createEditor(parent: HTMLElement, doc: string, onChange: (code: string) => void) {
  return new EditorView({
    parent,
    doc,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      drawSelection(),
      history(),
      flick,
      syntaxHighlighting(highlighting),
      indentUnit.of('    '),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
      EditorView.updateListener.of((update) => update.docChanged && onChange(update.state.doc.toString())),
      EditorView.contentAttributes.of({ 'aria-label': 'Flick code' }),
      theme,
    ],
  });
}

/** Replaces the whole document as one undoable edit. */
export function setCode(editor: EditorView, code: string) {
  editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: code } });
}
