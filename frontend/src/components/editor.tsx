'use client'

import { useState } from 'react';
import { editor } from 'monaco-editor';
import { type Monaco } from '@monaco-editor/react';

import examples from '@/app/examples';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"


interface EditorProps {
    editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>
    runCode: () => void
}

export default function Editor({ editorRef, runCode }: EditorProps) {
    const [editorLoaded, setEditorLoaded] = useState(false);

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
                    [/[{}()]/, '@brackets'],
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
            }, 
        });

        monaco.languages.setLanguageConfiguration("flick", {
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" },
            ], 
            indentationRules: { // From https://github.com/microsoft/monaco-editor/issues/612#issuecomment-344218223
                decreaseIndentPattern: /^((?!.*?\/\*).*\*\/)?\s*[\}\]\)]/,
                increaseIndentPattern: /^((?!\/\/).)*(\{[^}"']*|\([^)"']*|\[[^\]"']*)$/,
            }
        })
    }

    const setExample = (title: string) => {
        const example = examples.find((ex) => ex.title === title)!
        editorRef.current?.setValue(example.code)
    }

    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        // Disable features for simplicity
        editor.updateOptions({
            minimap: { enabled: false }, // Disable minimap
            contextmenu: false, // Disable context menu (right click)
            quickSuggestions: false, // Disable quick suggestions
            autoClosingBrackets: "beforeWhitespace",
        });

        editorRef.current = editor
        setEditorLoaded(true)
    }

    return (
        <div className="h-full w-full overflow-clip">
            <div className="w-full p-5 flex justify-end gap-5">
                <Select onValueChange={(exampleName) => setExample(exampleName)}>
                    <SelectTrigger disabled={!editorLoaded} className="w-[180px]">
                        <SelectValue placeholder="Select an example" />
                    </SelectTrigger>
                    <SelectContent>
                        {examples.map((example) => (
                            <SelectItem value={example.title}>{example.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button disabled={!editorLoaded} onClick={runCode}>
                    Run
                </Button>
            </div>
            <MonacoEditor defaultValue={examples[0].code} defaultLanguage="flick" beforeMount={handleEditorWillMount} onMount={handleEditorDidMount} />
        </div>
    )
}
