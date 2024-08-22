'use client'

import { type editor } from 'monaco-editor';
import { type Monaco } from '@monaco-editor/react';

import { Editor as MonacoEditor } from '@monaco-editor/react';
import { Button } from './ui/button';


interface EditorProps {
    editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>
    runCode: () => void
}

export default function Editor({ editorRef, runCode }: EditorProps) {
    const handleEditorWillMount = (monaco: Monaco) => {
        monaco.languages.register({ id: 'flick' });

        // Register a tokens provider for the language
        // see: https://microsoft.github.io/monaco-editor/monarch.html
        monaco.languages.setMonarchTokensProvider('flick', {
            // Set defaultToken to invalid to see what you do not tokenize yet
            // defaultToken: 'invalid',

            keywords: [
                "pub", "fn", "extern", "if", "while", "else", "ret"
            ],
            typeKeywords: [
                "void"
            ],
            symbols:  /[=><!+\-*\/]+/,
            operators: [
                '=', '==', '!=', '>', '>=', '<', '<=', '/', '/=', '*', '*=', '+', '+=', '-', '-='
            ],

            tokenizer: {
                root: [
                    // identifiers and keywords
                    [/[iu][1-9]\d*/, 'keyword'], // to show signed and unsigned int types
                    [/[a-z_$][\w$]*/, {
                        cases: {
                            '@typeKeywords': 'keyword',
                            '@keywords': 'keyword',
                            '@default': 'identifier'
                        }
                    }],

                    // whitespace
                    { include: '@whitespace' },

                    // delimiters and operators
                    [/[{}()\[\]]/, '@brackets'],
                    [/[<>](?!@symbols)/, '@brackets'],
                    [/@symbols/, {
                        cases: {
                            '@operators': 'operator',
                            '@default': ''
                        }
                    }],

                    // numbers
                    [/\d+/, 'number'],
                ],
                whitespace: [
                    [/[ \t\r\n]+/, 'white'],
                    [/\/\/.*$/,    'comment'],
                ],
            }
        });
    }

    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        // Disable features for simplicity
        editor.updateOptions({
            minimap: { enabled: false }, // Disable minimap
        });

        editorRef.current = editor;
    }

    return (
        <div className="h-full w-full overflow-clip">
            <div className="w-full p-5 flex justify-end">
                <Button onClick={runCode}>
                    Run
                </Button>
            </div>
            <MonacoEditor defaultValue="// some comment" defaultLanguage="flick" beforeMount={handleEditorWillMount} onMount={handleEditorDidMount} />
        </div>
    )
}