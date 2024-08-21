'use client'

import { type editor } from 'monaco-editor';
import { type Monaco } from '@monaco-editor/react';

import { Editor as MonacoEditor } from '@monaco-editor/react';
import { Button } from './ui/button';


export default function Editor() {
    const handleEditorWillMount = (monaco: Monaco) => {}

    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        // Disable features for simplicity
        editor.updateOptions({
            // Basic setup
            minimap: { enabled: false }, // Disable minimap
            lineNumbers: 'on', // Show line numbers
            folding: false, // Disable code folding
            wordWrap: 'off', // Disable word wrapping
            scrollBeyondLastLine: true, // ALlow scrolling beyond last line
            readOnly: false, // Allow editing
            
            // Disable advanced features
            automaticLayout: true,
            quickSuggestions: false, // Disable suggestions
            parameterHints: { enabled: false }, // Disable parameter hints
            suggestOnTriggerCharacters: false, // Disable suggestions on typing trigger characters
            snippetSuggestions: 'none', // Disable snippet suggestions
            tabCompletion: 'off', // Disable tab completion
            hover: { enabled: false }, // Disable hover tooltips
            contextmenu: false, // Disable right-click context menu
            lightbulb: { enabled: "off" }, // Disable code actions
            cursorBlinking: 'solid', // Simpler cursor style
            renderIndentGuides: true, // Render indent guides
            renderLineHighlight: 'none', // Disable line highlight
            renderValidationDecorations: 'off', // Disable validation decorations
        });
    }

    return (
        <div className="h-full w-full overflow-clip">
            <div className="w-full p-5 flex justify-end">
                <Button className="color">
                    Run
                </Button>
            </div>
            <MonacoEditor defaultValue="// some comment" beforeMount={handleEditorWillMount} onMount={handleEditorDidMount} />
        </div>
    )
}