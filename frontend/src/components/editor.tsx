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
            minimap: { enabled: false }, // Disable minimap
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